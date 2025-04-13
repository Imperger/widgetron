import type { Action } from './action';
import type { Environment } from './environment';

import type AppDB from '@/db/app-db';

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
  db: AppDB;
  action: Action;
  channelMessagesAfterLastTick(): Promise<ChatMessage[]>;
  allMessagesAfterLastTick(): Promise<ChatMessage[]>;
}
