import type AppDB from './db/app-db';
import type { WidgetSourceCode } from './db/widget-source-code';
import type { ChatMessage } from './lib/interceptors/network-interceptor/chat-interceptor';

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
