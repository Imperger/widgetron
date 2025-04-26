import Dexie, { type EntityTable } from 'dexie';

import { Message } from './message';
import type { WidgetSourceCode } from './widget-source-code';

export default class AppDB extends Dexie {
  messages!: EntityTable<Message, 'id'>;
  widgets!: EntityTable<WidgetSourceCode, 'id'>;

  constructor() {
    super('my-twitch-extension');
    this.version(1).stores({
      messages:
        '&id, roomId, roomDisplayName, userId, displayName, subscriber, moderator, vip, turbo, returning, firstMessage, *badges, color, timestamp, [roomDisplayName+timestamp]',
      widgets: '++id',
    });

    this.messages.mapToClass(Message);
  }
}
