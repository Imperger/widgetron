import type {
  WebsocketInterceptorListener,
  WebsocketInterceptorListenerResult,
} from './websocket-interceptor';

import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface ViewCountTopic {
  type: 'viewcount';
  server_time: number;
  viewers: number;
  collaboration_status: 'none' | string;
  collaboration_viewers: number;
}

export interface BroadcastSettingsUpdateTopic {
  type: 'broadcast_settings_update';
  channel_id: string;
  channel: string;
  old_status: string;
  status: string;
  old_game: string;
  game: string;
  old_game_id: number;
  game_id: number;
}

export type Topic = ViewCountTopic | BroadcastSettingsUpdateTopic;

export type SubscriptionTopicWithSource<T> = T & {
  channelId: string;
};

export type SubscriptionTopic = SubscriptionTopicWithSource<Topic>;

interface MessageCommandData {
  message: string;
  topic: string;
}

interface MessageCommand {
  type: 'MESSAGE';
  data: MessageCommandData;
}

type ParsedMessageBody = MessageCommand;

export type PubSubInterceptorListener<T extends SubscriptionTopic> = (message: T) => boolean;

interface PubSubInterceptorRecord {
  type: SubscriptionTopic['type'];
  listener: PubSubInterceptorListener<SubscriptionTopic>;
}

export type PubSubInterceptorListenerUnsubscriber = () => void;

export class PubSubInterceptor implements WebsocketInterceptorListener {
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

  subscribe<T extends SubscriptionTopic>(
    type: T['type'],
    listener: PubSubInterceptorListener<T>,
  ): PubSubInterceptorListenerUnsubscriber {
    this.subscribers.push({
      type,
      listener: reinterpret_cast<PubSubInterceptorListener<SubscriptionTopic>>(listener),
    });

    return () => {
      const idx = this.subscribers.findIndex((x) => x.listener === listener);

      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  private parseMessage(messageBody: string): SubscriptionTopic | null {
    const obj: ParsedMessageBody = JSON.parse(messageBody);

    switch (obj.type) {
      case 'MESSAGE':
        return this.parseMessageCommand(obj);
      default:
        return null;
    }
  }

  private parseMessageCommand(cmd: MessageCommand): SubscriptionTopic | null {
    const channelId = cmd.data.topic.split('.')[1];

    const nested: Topic = JSON.parse(cmd.data.message);

    switch (nested.type) {
      case 'viewcount':
        return { channelId, ...nested };
      case 'broadcast_settings_update':
        return { channelId, ...nested };
      default:
        return null;
    }
  }

  private isChatRelatedMessage(message: MessageEvent): boolean {
    return message.origin === 'wss://pubsub-edge.twitch.tv';
  }
}
