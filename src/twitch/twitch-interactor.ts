import type { BanUserRequest } from './gql/types/ban-user-request';
import type { BanUserResponse } from './gql/types/ban-user-response';
import type { ChannelShellRequest } from './gql/types/channel-shell-request';
import type { ChannelShellResponse } from './gql/types/channel-shell-response';
import type { ChatLoginModerationTrackingRequest } from './gql/types/chat-login-moderation-tracking';
import type { DeleteChatMessageRequest } from './gql/types/delete-chat-message-request';
import type { DeleteChatMessageResponse } from './gql/types/delete-chat-message-response';
import type { GQLRequest, PersistentQuery } from './gql/types/gql-request';
import {
  isGQLErrorResponse,
  isGQLSuccessResponse,
  type GQLResponse,
} from './gql/types/gql-response';
import type { SendChatMessageRequest } from './gql/types/send-chat-message-request';
import type { UseLiveResponse } from './gql/types/use-live-response';
import type { ViewerCardRequest } from './gql/types/viewer-card-request';
import type { ViewerCardResponse } from './gql/types/viewer-card-response';
import type { ViewerChannelRelationship } from './viewer-channel-relationship';

import { reinterpret_cast } from '@/lib/reinterpret-cast';
import type {
  FetchInterceptor,
  FetchInterceptorListener,
  FetchInterceptorListenerUnsubscriber,
  FetchInterceptorRequest,
} from '@/twitch/fetch-interceptor';
import type { GQLInterceptor } from '@/twitch/gql/gql-interceptor';

type GQLHeaders = Record<(typeof TwitchInteractor.requiredHeaders)[number], string>;

export class TwitchInteractor implements FetchInterceptorListener {
  static readonly requiredHeaders = [
    'Authorization',
    'Client-Id',
    'Client-Integrity',
    'Client-Session-Id',
    'Client-Version',
    'X-Device-Id',
  ] as const;

  private fetchUnsub: FetchInterceptorListenerUnsubscriber | null = null;

  private gqlHeaders: GQLHeaders | null = null;

  private knownPersistentQuery = new Map<string, PersistentQuery>();

  private currentChannelId = '';

  private loginChannelIdCache = new Map<string, string>();

  constructor(fetchInterceptor: FetchInterceptor, gqlInterceptor: GQLInterceptor) {
    this.fetchUnsub = fetchInterceptor.subscribe(this);

    this.knownPersistentQuery.set('sendChatMessage', {
      sha256Hash: '0435464292cf380ed4b3d905e4edcb73078362e82c06367a5b2181c76c822fa2',
      version: 1,
    });

    this.knownPersistentQuery.set('Chat_DeleteChatMessage', {
      sha256Hash: 'b3a86ecf228824820543f7190362650e727b66d980b34722e27272d461410514',
      version: 1,
    });

    this.knownPersistentQuery.set('ChatLoginModerationTracking', {
      sha256Hash: '123ed6135cb4264e25ac0aeb67abe8ec8a656b1965f6a80d90530b5ddfe14696',
      version: 1,
    });

    this.knownPersistentQuery.set('Chat_BanUserFromChatRoom', {
      sha256Hash: 'd7be2d2e1e22813c1c2f3d9d5bf7e425d815aeb09e14001a5f2c140b93f6fb67',
      version: 1,
    });

    this.knownPersistentQuery.set('ChannelShell', {
      sha256Hash: 'ed6f189ff99548947a3b5acf9410ec69d7f8d4718a534d01ea0d00aa7662f2eb',
      version: 1,
    });

    this.knownPersistentQuery.set('ViewerCard', {
      sha256Hash: '80c53fe04c79a6414484104ea573c28d6a8436e031a235fc6908de63f51c74fd',
      version: 1,
    });

    gqlInterceptor.subscribe({ operationName: 'UseLive' }, (x) =>
      this.onChannelChange(reinterpret_cast<GQLResponse<UseLiveResponse>>(x)),
    );
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.isReady || message.length === 0) {
      return false;
    }

    const query: GQLRequest<SendChatMessageRequest> = {
      operationName: 'sendChatMessage',
      extensions: { persistedQuery: this.knownPersistentQuery.get('sendChatMessage')! },
      variables: {
        input: {
          channelID: this.currentChannelId,
          message,
          nonce: TwitchInteractor.generateNonce(),
          replyParentMessageID: null,
        },
      },
    };

    return (await this.gqlQuery(query)) !== null;
  }

  async deleteMessage(messageID: string): Promise<boolean> {
    if (!this.isReady) {
      return false;
    }

    const query: GQLRequest<DeleteChatMessageRequest> = {
      operationName: 'Chat_DeleteChatMessage',
      extensions: { persistedQuery: this.knownPersistentQuery.get('Chat_DeleteChatMessage')! },
      variables: {
        input: {
          channelID: this.currentChannelId,
          messageID,
        },
      },
    };

    const deleteMessageResponse = await this.gqlQuery<DeleteChatMessageResponse>(query);

    if (deleteMessageResponse === null || isGQLErrorResponse(deleteMessageResponse)) {
      return false;
    }

    const modTrackingQuery: GQLRequest<ChatLoginModerationTrackingRequest> = {
      operationName: 'ChatLoginModerationTracking',
      extensions: { persistedQuery: this.knownPersistentQuery.get('ChatLoginModerationTracking')! },
      variables: {
        channelID: this.currentChannelId,
        targetUserID: deleteMessageResponse.data.deleteChatMessage.message.sender.id,
      },
    };

    await this.gqlQuery(modTrackingQuery);

    return true;
  }

  async banUser(bannedUserLogin: string, expiresIn: string, reason = ''): Promise<boolean> {
    if (!this.isReady) {
      return false;
    }

    const query: GQLRequest<BanUserRequest> = {
      operationName: 'Chat_BanUserFromChatRoom',
      extensions: { persistedQuery: this.knownPersistentQuery.get('Chat_BanUserFromChatRoom')! },
      variables: {
        input: {
          channelID: this.currentChannelId,
          bannedUserLogin,
          expiresIn,
          reason,
        },
      },
    };

    const deleteMessageResponse = await this.gqlQuery<BanUserResponse>(query);

    if (
      deleteMessageResponse === null ||
      isGQLErrorResponse(deleteMessageResponse) ||
      deleteMessageResponse.data.banUserFromChatRoom.ban === null
    ) {
      return false;
    }

    const modTrackingQuery: GQLRequest<ChatLoginModerationTrackingRequest> = {
      operationName: 'ChatLoginModerationTracking',
      extensions: { persistedQuery: this.knownPersistentQuery.get('ChatLoginModerationTracking')! },
      variables: {
        channelID: this.currentChannelId,
        targetUserID: deleteMessageResponse.data.banUserFromChatRoom.ban.bannedUser.id,
      },
    };

    await this.gqlQuery(modTrackingQuery);

    return true;
  }

  async relationship(viewer: string, channel: string): Promise<ViewerChannelRelationship | null> {
    if (!this.isReady) {
      return null;
    }

    let channelId = this.loginChannelIdCache.get(channel);

    if (channelId === undefined) {
      const query: GQLRequest<ChannelShellRequest> = {
        operationName: 'ChannelShell',
        extensions: { persistedQuery: this.knownPersistentQuery.get('ChannelShell')! },
        variables: { isDVR: false, login: channel },
      };

      const channelShellResponse = await this.gqlQuery<ChannelShellResponse>(query);

      if (channelShellResponse === null || isGQLErrorResponse(channelShellResponse)) {
        return null;
      }

      channelId = channelShellResponse.data.userOrError.id;

      this.loginChannelIdCache.set(channel, channelId);
    }

    const query: GQLRequest<ViewerCardRequest> = {
      operationName: 'ViewerCard',
      extensions: { persistedQuery: this.knownPersistentQuery.get('ViewerCard')! },
      variables: {
        badgeSourceChannelID: channelId,
        badgeSourceChannelLogin: channel,
        channelID: channelId,
        channelLogin: channel,
        giftRecipientLogin: viewer,
        hasChannelID: true,
        isViewerBadgeCollectionEnabled: true,
        withStandardGifting: true,
      },
    };

    const viewerCardResponse = await this.gqlQuery<ViewerCardResponse>(query);

    if (viewerCardResponse === null || isGQLErrorResponse(viewerCardResponse)) {
      return null;
    }

    const rel = viewerCardResponse.data.targetUser.relationship;

    return {
      followedAt: rel.followedAt ? new Date(rel.followedAt) : null,
      totalSubscribedMonths: rel.cumulativeTenure?.months ?? 0,
      subscriptionDaysRemaining: rel.cumulativeTenure?.daysRemaining ?? 0,
      subscription: rel.subscriptionBenefit
        ? {
            isGift: rel.subscriptionBenefit.gift.isGift,
            purchasedWithPrime: rel.subscriptionBenefit.purchasedWithPrime,
            tier: rel.subscriptionBenefit.tier,
          }
        : null,
    };
  }

  async onResponse(req: FetchInterceptorRequest, _res: Response): Promise<boolean> {
    if (!req.input.toString().startsWith('https://gql.twitch.tv/gql')) {
      return false;
    }

    if (req.init && this.captureGQLHeaders(req.init)) {
      this.fetchUnsub!();
    }

    return false;
  }

  get isReady(): boolean {
    return this.gqlHeaders !== null;
  }

  private onChannelChange(x: GQLResponse<UseLiveResponse>) {
    if (isGQLSuccessResponse(x)) {
      this.currentChannelId = x.data.user.id;
    }
  }

  private captureGQLHeaders(init: RequestInit): boolean {
    const headers = init.headers;

    if (this.hasRequiredHeaders(headers)) {
      this.gqlHeaders = TwitchInteractor.requiredHeaders.reduce(
        (acc, x) => ({ ...acc, [x]: headers[x] }),
        {} as GQLHeaders,
      );

      return true;
    }

    return false;
  }

  private hasRequiredHeaders(headers?: HeadersInit): headers is GQLHeaders {
    if (!headers) {
      return false;
    }

    if (headers instanceof Headers) {
      return TwitchInteractor.requiredHeaders.every((x) => headers.has(x));
    } else {
      return TwitchInteractor.requiredHeaders.every((x) => x in headers);
    }
  }

  private async gqlQuery<T>(query: GQLRequest<unknown>): Promise<GQLResponse<T> | null> {
    try {
      return (
        await fetch('https://gql.twitch.tv/gql', {
          method: 'POST',
          headers: this.gqlHeaders!,
          body: JSON.stringify(query),
        })
      ).json();
    } catch {
      return null;
    }
  }

  private static generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
