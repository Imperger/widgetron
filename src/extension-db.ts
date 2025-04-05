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
    } catch (e) {
      console.error(e);
    }
  }

  async saveWidget(label: string, sourceCode: string, id?: number): Promise<void> {
    try {
      await this.db.widgets.add({ id, label, content: sourceCode });
    } catch (e) {
      console.error(e);
    }
  }

  async deleteWidget(id: number): Promise<void> {
    return this.db.widgets.delete(id);
  }
}
