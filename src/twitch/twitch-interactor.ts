import type { GQLRequest, PersistentQuery } from './gql/types/gql-request';
import type { GQLResponse } from './gql/types/gql-response';
import type { SendChatMessageRequest } from './gql/types/send-chat-message-request';
import type { UseLiveResponse } from './gql/types/use-live-response';

import type { JSONObject } from '@/lib/json-object-equal';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import type {
  FetchInterceptor,
  FetchInterceptorListenerUnsubscriber,
  FetchInterceptorRequest,
} from '@/twitch/fetch-interceptor';
import type { GQLInterceptor } from '@/twitch/gql/gql-interceptor';

type GQLHeaders = Record<(typeof TwitchInteractor.requiredHeaders)[number], string>;

export class TwitchInteractor {
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

  constructor(fetchInterceptor: FetchInterceptor, glqInterceptor: GQLInterceptor) {
    this.fetchUnsub = fetchInterceptor.subscribe(this);

    this.knownPersistentQuery.set('sendChatMessage', {
      sha256Hash: '0435464292cf380ed4b3d905e4edcb73078362e82c06367a5b2181c76c822fa2',
      version: 1,
    });

    glqInterceptor.subscribe({ operationName: 'UseLive' }, (x) =>
      this.onChannelChange(reinterpret_cast<GQLResponse<UseLiveResponse>>(x)),
    );
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.isReady) {
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

  async onRequest(req: FetchInterceptorRequest, _res: Response): Promise<boolean> {
    if (!req.input.toString().startsWith('https://gql.twitch.tv/gql')) {
      return false;
    }

    if (req.init && this.captureGQLHeaders(req.init)) {
      console.log(req, _res);
      this.fetchUnsub!();
    }

    return false;
  }

  get isReady(): boolean {
    return this.gqlHeaders !== null;
  }

  private onChannelChange(x: GQLResponse<UseLiveResponse>) {
    this.currentChannelId = x.data.user.id;
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

  private async gqlQuery<T>(query: GQLRequest<T>): Promise<JSONObject | null> {
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
