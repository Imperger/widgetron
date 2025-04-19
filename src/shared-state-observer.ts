import { reinterpret_cast } from './lib/reinterpret-cast';
import type { ChatInterceptor, RoomStateCommand } from './twitch/chat-interceptor';
import type { GQLInterceptor } from './twitch/gql/gql-interceptor';
import type { ChatRoomStateResponse } from './twitch/gql/types/chat-room-state-response';
import {
  isGQLErrorResponse,
  isGQLSuccessResponse,
  type GQLResponse,
} from './twitch/gql/types/gql-response';
import type { UseLiveResponse } from './twitch/gql/types/use-live-response';
import type { ChannelChat, SharedState } from './widget/shared-state';

export class SharedStateObserver {
  private readonly chatRoomStateCache = new Map<string, ChannelChat>();

  constructor(
    chatInterceptor: ChatInterceptor,
    gqlInterceptor: GQLInterceptor,
    private readonly sharedState: SharedState,
  ) {
    chatInterceptor.subscribe<RoomStateCommand>('ROOMSTATE', (x) => this.onRoomState(x));
    gqlInterceptor.subscribe({ operationName: 'ChatRoomState' }, (x) => this.onChatRoomState(x));
    gqlInterceptor.subscribe({ operationName: 'UseLive' }, (x) =>
      this.onChannelChange(reinterpret_cast<GQLResponse<UseLiveResponse>>(x)),
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
      roomDisplayName: '',
      chat,
    };
  }

  private updateCache(channelId: string, update: Partial<ChannelChat>): void {
    const state = this.chatRoomStateCache.get(channelId);

    if (state) {
      this.chatRoomStateCache.set(channelId, { ...state, ...update });
    } else {
      this.chatRoomStateCache.set(channelId, {
        ...{ emoteOnly: false, followersOnly: -1, slowMode: 0 },
        ...update,
      });
    }
  }

  private onChannelChange(x: GQLResponse<UseLiveResponse>) {
    if (isGQLSuccessResponse(x)) {
      const chat = this.chatRoomStateCache.get(x.data.user.id);

      if (!chat) {
        return;
      }

      this.sharedState.channel = {
        roomId: x.data.user.id,
        roomDisplayName: x.data.user.login,
        chat,
      };
    }
  }
}
