import type {
  WebsocketInterceptorListener,
  WebsocketInterceptorListenerResult,
} from './websocket-interceptor';

import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface PubSubNotification {
  notification: {
    subscription: {
      id: string;
    };
    type: 'pubsub';
    pubsub: string; // ViewCountNotification
  };
  id: string;
  type: 'notification';
  timestamp: string;
}

export interface ViewCountNotification {
  type: 'viewcount';
  server_time: number;
  viewers: number;
  collaboration_status: 'none' | string;
  collaboration_viewers: number;
}

export type NotificationType = ViewCountNotification;

type ParsedMessageBody = PubSubNotification;

export type PubSubInterceptorListener<T extends NotificationType> = (message: T) => boolean;

interface PubSubInterceptorRecord {
  type: NotificationType['type'];
  listener: PubSubInterceptorListener<NotificationType>;
}

export type PubSubInterceptorListenerUnsubscriber = () => void;

export class HermesInterceptor implements WebsocketInterceptorListener {
  private readonly subscribers: PubSubInterceptorRecord[] = [];

  async onMessage(message: MessageEvent): Promise<WebsocketInterceptorListenerResult> {
    if (!this.isChatRelatedMessage(message)) {
      return { isIntercepted: false, isBlocked: false };
    }

    const parsedMessage = this.parseMessage(message.data);

    if (parsedMessage === null) {
      return { isIntercepted: false, isBlocked: false };
    }

    let needBlock = false;
    for (const subscriber of this.subscribers) {
      if (subscriber.type === parsedMessage.type) {
        needBlock ||= subscriber.listener(parsedMessage);
      }
    }

    return {
      isIntercepted: true,
      isBlocked: needBlock,
    };
  }

  subscribe<T extends NotificationType>(
    type: T['type'],
    listener: PubSubInterceptorListener<T>,
  ): PubSubInterceptorListenerUnsubscriber {
    this.subscribers.push({
      type,
      listener: reinterpret_cast<PubSubInterceptorListener<NotificationType>>(listener),
    });

    return () => {
      const idx = this.subscribers.findIndex((x) => x.listener === listener);

      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  private parseMessage(messageBody: string): NotificationType | null {
    const obj: ParsedMessageBody = JSON.parse(messageBody);

    if (obj.type === 'notification' && obj.notification.type === 'pubsub') {
      return this.parsePubSubMessage(obj);
    }

    return null;
  }

  private parsePubSubMessage(cmd: PubSubNotification): NotificationType | null {
    const nested: NotificationType = JSON.parse(cmd.notification.pubsub);

    switch (nested.type) {
      case 'viewcount':
        return nested;
      default:
        return null;
    }
  }

  private isChatRelatedMessage(message: MessageEvent): boolean {
    return message.origin === 'wss://hermes.twitch.tv';
  }
}
