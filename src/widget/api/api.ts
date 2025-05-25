import type { Action } from './action';
import type { Environment } from './environment';

import type AppDB from '@/db/app-db';
import type { Screenshot } from '@/lib/capture-screenshot';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SessionState {}

export interface ChatMessage {
  id: string;
  roomId: string;
  roomDisplayName: string;
  userId: string;
  displayName: string;
  text: string;
  subscriber: boolean;
  moderator: boolean;
  vip: boolean;
  turbo: boolean;
  returning: boolean;
  firstMessage: boolean;
  badges: string[]; // title:discriminator
  color: string;
  timestamp: number;
}

export interface API {
  env: Environment;
  caller: 'system' | 'event';
  db: AppDB;
  action: Action;
  state: SessionState;
  channelMessagesAfterLastTick(): Promise<ChatMessage[]>;
  allMessagesAfterLastTick(): Promise<ChatMessage[]>;
  isUndefined(x: unknown): boolean;
  captureScreenshot(type: 'rgba' | 'png'): Promise<Screenshot>;
}
