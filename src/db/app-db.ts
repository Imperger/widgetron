import Dexie, { type EntityTable } from 'dexie';

import { Message } from './message';

export default class AppDB extends Dexie {
  messages!: EntityTable<Message, 'id'>;

  constructor() {
    super('my-twitch-extension');
    this.version(1).stores({
      messages:
        '&id, roomId, roomDisplayName, userId, displayName, subscriber, moderator, vip, turbo, returning, firstMessage, *badges, color, timestamp',
    });

    this.messages.mapToClass(Message);
  }
}
