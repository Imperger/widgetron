export interface Stream {
  startTime: Date;
  viewers: number;
}

export interface ChannelChat {
  emoteOnly: boolean;
  followersOnly: number;
  slowMode: number;
}

export interface Channel {
  roomId: string;
  roomDisplayName: string;
  game: string;
  stream: Stream | null;
  chat: ChannelChat;
}

export interface SharedState {
  channel: Channel | null;
}
