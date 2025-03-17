import { Entity } from 'dexie';

import type AppDB from './app-db';

export class Message extends Entity<AppDB> {
  id!: string;
  roomId!: string;
  roomDisplayName!: string;
  userId!: string;
  displayName!: string;
  text!: string;
  subscriber!: boolean;
  moderator!: boolean;
  vip!: boolean;
  turbo!: boolean;
  returning!: boolean;
  firstMessage!: boolean;
  badges!: string[]; // title:discriminator
  color!: string;
  timestamp!: number;
}
