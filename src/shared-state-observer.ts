import { reinterpret_cast } from './lib/reinterpret-cast';
import type { ChatInterceptor, RoomStateCommand } from './twitch/chat-interceptor';
import type { GQLInterceptor } from './twitch/gql/gql-interceptor';
import type { ChatRoomStateResponse } from './twitch/gql/types/chat-room-state-response';
import {
  isGQLErrorResponse,
  isGQLSuccessResponse,
  type GQLResponse,
} from './twitch/gql/types/gql-response';
import type { PlayerTrackingContextQueryLiveResponse } from './twitch/gql/types/player-tracking-context-query-response';
import type { UseLiveResponse } from './twitch/gql/types/use-live-response';
import type {
  BroadcastSettingsUpdateTopic,
  PubSubInterceptor,
  SubscriptionTopicWithSource,
  ViewCountTopic,
} from './twitch/pub-sub-interceptor';
import type { ChannelChat, SharedState } from './widget/shared-state';

interface ChannelCacheRecord extends ChannelChat {
  game: string;
  viewers: number;
}

export class SharedStateObserver {
  private readonly chatRoomStateCache = new Map<string, ChannelCacheRecord>();

  constructor(
    chatInterceptor: ChatInterceptor,
    pubSubInterceptor: PubSubInterceptor,
    gqlInterceptor: GQLInterceptor,
    private readonly sharedState: SharedState,
  ) {
    chatInterceptor.subscribe<RoomStateCommand>('ROOMSTATE', (x) => this.onRoomState(x));
    gqlInterceptor.subscribe({ operationName: 'ChatRoomState' }, (x) => this.onChatRoomState(x));

    gqlInterceptor.subscribe({ operationName: 'UseLive' }, (x) =>
      this.onChannelChange(reinterpret_cast<GQLResponse<UseLiveResponse>>(x)),
    );

    gqlInterceptor.subscribe(
      { operationName: 'PlayerTrackingContextQuery', variables: { isLive: true } },
      (x) =>
        this.onPlayerTrackingContextQuery(
          reinterpret_cast<GQLResponse<PlayerTrackingContextQueryLiveResponse>>(x),
        ),
    );

    pubSubInterceptor.subscribe<SubscriptionTopicWithSource<ViewCountTopic>>('viewcount', (x) =>
      this.onViewCount(x),
    );

    pubSubInterceptor.subscribe<SubscriptionTopicWithSource<BroadcastSettingsUpdateTopic>>(
      'broadcast_settings_update',
      (x) => this.onBroadcastSettingsUpdate(x),
    );
  }

  private onRoomState({ type: _, roomId, roomDisplayName: _2, ...x }: RoomStateCommand): boolean {
    this.updateCache(roomId, x);

    this.sharedState.channel!.chat = { ...this.sharedState.channel!.chat, ...x };

    return false;
  }

  private onChatRoomState(x: GQLResponse<unknown>): void {
    const resp = reinterpret_cast<GQLResponse<ChatRoomStateResponse>>(x);

    if (isGQLErrorResponse(resp)) {
      return;
    }

    const chatSettings = resp.data.channel.chatSettings;

    const chat: ChannelChat = {
      emoteOnly: chatSettings.isEmoteOnlyModeEnabled,
      followersOnly: chatSettings.followersOnlyDurationMinutes ?? -1,
      slowMode: chatSettings.slowModeDurationSeconds ?? 0,
    };

    this.updateCache(resp.data.channel.id, chat);

    this.sharedState.channel = {
      roomId: resp.data.channel.id,
      roomDisplayName: this.sharedState.channel?.roomDisplayName ?? '',
      game: this.chatRoomStateCache.get(resp.data.channel.id)?.game ?? '',
      stream: this.sharedState.channel?.stream ?? null,
      chat,
    };
  }

  private onChannelChange(x: GQLResponse<UseLiveResponse>) {
    if (isGQLSuccessResponse(x)) {
      const placeholder: ChannelCacheRecord = {
        emoteOnly: false,
        followersOnly: -1,
        slowMode: 0,
        game: '',
        viewers: 0,
      };

      const chat = this.chatRoomStateCache.get(x.data.user.id) ?? placeholder;

      this.sharedState.channel = {
        roomId: x.data.user.id,
        roomDisplayName: x.data.user.login,
        game: this.chatRoomStateCache.get(x.data.user.id)?.game ?? '',
        stream: x.data.user.stream
          ? {
              startTime: new Date(x.data.user.stream.createdAt),
              viewers: this.chatRoomStateCache.get(x.data.user.id)?.viewers ?? 0,
            }
          : null,
        chat: SharedStateObserver.sanitizeChat(chat),
      };
    }
  }

  private onPlayerTrackingContextQuery(x: GQLResponse<PlayerTrackingContextQueryLiveResponse>) {
    if (isGQLSuccessResponse(x)) {
      const placeholder: ChannelCacheRecord = {
        emoteOnly: false,
        followersOnly: -1,
        slowMode: 0,
        game: '',
        viewers: 0,
      };

      const chat = this.chatRoomStateCache.get(x.data.user.id) ?? placeholder;

      this.updateCache(x.data.user.id, { game: x.data.user.broadcastSettings.game.name });

      this.sharedState.channel = {
        roomId: x.data.user.id,
        roomDisplayName: x.data.user.login,
        game: x.data.user.broadcastSettings.game.name,
        stream: this.sharedState.channel?.stream ?? null,
        chat: SharedStateObserver.sanitizeChat(chat),
      };
    }
  }

  private onViewCount(x: SubscriptionTopicWithSource<ViewCountTopic>): boolean {
    this.updateCache(x.channelId, { viewers: x.viewers });

    if (x.channelId === this.sharedState.channel?.roomId && this.sharedState.channel.stream) {
      this.sharedState.channel.stream.viewers = x.viewers;
    }

    return false;
  }

  private onBroadcastSettingsUpdate(
    x: SubscriptionTopicWithSource<BroadcastSettingsUpdateTopic>,
  ): boolean {
    this.updateCache(x.channelId, { game: x.game });

    if (x.channelId === this.sharedState.channel?.roomId) {
      this.sharedState.channel.game = x.game;
    }

    return false;
  }

  private updateCache(channelId: string, update: Partial<ChannelCacheRecord>): void {
    const state = this.chatRoomStateCache.get(channelId);

    if (state) {
      this.chatRoomStateCache.set(channelId, { ...state, ...update });
    } else {
      this.chatRoomStateCache.set(channelId, {
        ...{ emoteOnly: false, followersOnly: -1, slowMode: 0, game: '', viewers: 0 },
        ...update,
      });
    }
  }

  private static sanitizeChat({ game: _, viewers: _0, ...x }: ChannelCacheRecord): ChannelChat {
    return x;
  }
}
