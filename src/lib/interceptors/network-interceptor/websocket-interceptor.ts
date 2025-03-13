import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface WebsocketInterceptorListenerResult {
  isIntercepted: boolean; // if true - the message not being passed to next subscriber
  isBlocked: boolean; // if true - the message not being passed to the 'message' event listeners
}

export interface WebsocketInterceptorListener {
  onMessage(message: MessageEvent): Promise<WebsocketInterceptorListenerResult>;
}

export type WebsocketInterceptorListenerUnsubscriber = () => void;

type MessageListener = (message: MessageEvent) => void;

type OnMessageListener = (message: MessageEvent) => void;

export class WebsocketInterceptor {
  private nativeOnMessageListener = new Map<WebSocket, OnMessageListener>();
  private nativeMessageListeners = new Map<WebSocket, MessageListener[]>();
  private readonly subscribers: WebsocketInterceptorListener[] = [];

  constructor(private readonly matchUrlList: string[]) {}

  install(): void {
    window.WebSocket = new Proxy(window.WebSocket, {
      construct: (target, args: [url: string | URL, protocols?: string | string[]]) => {
        const instance = new target(...args);

        if (this.matchUrlList.some((x) => x === args[0])) {
          this.setupInterceptor(instance);
        }

        return instance;
      },
    });
  }

  private setupInterceptor(instance: WebSocket): void {
    instance.addEventListener('message', async (message) => {
      for (const subscriber of this.subscribers) {
        const result = await subscriber.onMessage(message);
        if (result.isIntercepted) {
          if (!result.isBlocked) {
            this.callNativeMessageListeners(instance, message);
          }

          return;
        }
      }

      this.callNativeMessageListeners(instance, message);
    });

    Object.defineProperty(instance, 'onmessage', {
      set: (listener?: MessageListener) => {
        if (listener) {
          this.nativeOnMessageListener.set(instance, listener);
        } else {
          this.nativeOnMessageListener.delete(instance);
        }
      },
    });

    instance.addEventListener = new Proxy(instance.addEventListener, {
      apply: (
        target,
        thisArg,
        args: [string, EventListenerOrEventListenerObject, (boolean | AddEventListenerOptions)?],
      ) => {
        if (args[0] !== 'message') {
          return target.apply(thisArg, args);
        }

        const listeners = this.nativeMessageListeners.get(instance);

        if (listeners) {
          listeners.push(reinterpret_cast<MessageListener>(args[1]));
        } else {
          this.nativeMessageListeners.set(instance, [reinterpret_cast<MessageListener>(args[1])]);
        }
      },
    });

    instance.removeEventListener = new Proxy(instance.removeEventListener, {
      apply: (
        target,
        thisArg,
        args: [string, EventListenerOrEventListenerObject, (boolean | AddEventListenerOptions)?],
      ) => {
        if (args[0] !== 'message') {
          return target.apply(thisArg, args);
        }

        const listeners = this.nativeMessageListeners.get(instance);

        if (listeners) {
          const removeIdx = listeners.indexOf(reinterpret_cast<MessageListener>(args[1]));

          if (removeIdx !== -1) {
            listeners.splice(removeIdx, 1);
          }
        }
      },
    });
  }

  private callNativeMessageListeners(instance: WebSocket, message: MessageEvent): void {
    const listeners = this.nativeMessageListeners.get(instance);

    listeners?.forEach((x) => x(message));
    this.nativeOnMessageListener.get(instance)?.(message);
  }

  subscribe(listener: WebsocketInterceptorListener): WebsocketInterceptorListenerUnsubscriber {
    this.subscribers.push(listener);

    return () => {
      const idx = this.subscribers.indexOf(listener);

      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }
}
