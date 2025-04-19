export interface ChannelChat {
  emoteOnly: boolean;
  followersOnly: number;
  slowMode: number;
}

export interface Channel {
  roomId: string;
  roomDisplayName: string;
  chat: ChannelChat;
}

export interface SharedState {
  channel: Channel | null;
}
