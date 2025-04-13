import type { ChatMessage } from './api/api';

import type AppDB from '@/db/app-db';

export type ChatMessageFilter = (x: ChatMessage) => boolean;

export class MessagesAfterLastTick {
  private isCalled = false;
  private prevTickHigherMessageTimestamp = Date.now();
  private readonly prevTickHigherTimestampMessageIds = new Set<string>();

  constructor(private readonly db: AppDB) {}

  enterTick(): void {
    this.isCalled = false;
  }

  leaveTick(): void {
    if (!this.isCalled) {
      this.prevTickHigherMessageTimestamp = Date.now();
    }
  }

  async call(messageFilter: ChatMessageFilter): Promise<ChatMessage[]> {
    this.isCalled = true;

    const result = await this.db.messages
      .where('timestamp')
      .aboveOrEqual(this.prevTickHigherMessageTimestamp)
      .and((x) => messageFilter(x) && !this.prevTickHigherTimestampMessageIds.has(x.id))
      .sortBy('timestamp');

    if (result.length > 0) {
      this.prevTickHigherTimestampMessageIds.clear();

      result
        .filter((x) => x.timestamp === result[result.length - 1].timestamp)
        .forEach((x) => this.prevTickHigherTimestampMessageIds.add(x.id));

      this.prevTickHigherMessageTimestamp = result[result.length - 1].timestamp;
    }

    return result;
  }
}
