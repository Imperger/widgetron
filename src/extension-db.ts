import type AppDB from './db/app-db';

import type { WidgetSourceCode } from '@/db/widget-source-code';
import type { ChatMessage } from '@/twitch/chat-interceptor';

export interface WidgetInfo {
  id: number;
  label: string;
}

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

  async shrinkMessages(count: number): Promise<number> {
    const cutoffMessage = await this.db.messages.orderBy('timestamp').offset(count).first();

    if (cutoffMessage) {
      return this.db.messages.where('timestamp').belowOrEqual(cutoffMessage.timestamp).delete();
    }

    return 0;
  }

  async messageCount(): Promise<number> {
    return this.db.messages.count();
  }

  async saveWidget(label: string, sourceCode: string, id?: number): Promise<number> {
    try {
      return await this.db.widgets.put({ id, label, content: sourceCode });
    } catch (e) {
      console.error(e);
    }

    return -1;
  }

  async allWidgets(): Promise<WidgetInfo[]> {
    return (await this.db.widgets.toArray()).map((x) => ({ id: x.id, label: x.label }));
  }

  async findWidget(id: number): Promise<WidgetSourceCode | null> {
    return (await this.db.widgets.get(id)) ?? null;
  }

  async deleteWidget(id: number): Promise<void> {
    return this.db.widgets.delete(id);
  }
}
