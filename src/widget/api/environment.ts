/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface ChannelChatSettings {
  emoteOnly: boolean;
  followersOnly: number;
  slowMode: number;
}

export interface EnvironmentChannelOnline {
  online: true;
  id: string;
  name: string;
  game: string;
  startTime: Date;
  viewers: number;
  chat: ChannelChatSettings | null;
}

export interface EnvironmentChannelOffline {
  online: false;
  id: string;
  name: string;
  game: string;
  chat: ChannelChatSettings | null;
}

export type EnvironmentChannel = EnvironmentChannelOnline | EnvironmentChannelOffline;

export interface Environment {
  channel?: EnvironmentChannel;
}
