import type AppDB from './db/app-db';
import type { ChatMessage } from './lib/interceptors/network-interceptor/chat-interceptor';

export class ExtensionDB {
  constructor(private readonly db: AppDB) {}

  async addMessage({ type: _type, badges, ...unchanged }: ChatMessage): Promise<void> {
    try {
      await this.db.messages.add({
        ...unchanged,
        badges: badges.map((x) => `${x.title}:${x.discriminator}`),
      });
    } catch {}
  }
}
