/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface EnvironmentChannelOnline {
  online: true;
  name: string;
  game: string;
  startTime: Date;
  viewers: number;
}

export interface EnvironmentChannelOffline {
  online: false;
  name: string;
}

export type EnvironmentChannel = EnvironmentChannelOnline | EnvironmentChannelOffline;

export interface Environment {
  channel?: EnvironmentChannel;
}
