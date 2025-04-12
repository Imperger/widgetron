import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface LocalStorageInterceptorCallMap {
  set: (key: string, value: string) => boolean;
  get: (key: string) => boolean;
  remove: (key: string) => boolean;
  clear: () => boolean;
}

export type LocalStorageInterceptorListenerUnsubscriber = () => void;

export class LocalStorageInterceptor {
  private readonly setSubscribers: LocalStorageInterceptorCallMap['set'][] = [];
  private readonly getSubscribers: LocalStorageInterceptorCallMap['get'][] = [];
  private readonly removeSubscribers: LocalStorageInterceptorCallMap['remove'][] = [];
  private readonly clearSubscribers: LocalStorageInterceptorCallMap['clear'][] = [];

  install(): void {
    window.localStorage.setItem = new Proxy(window.localStorage.setItem, {
      apply: (target, thisArg, args: [string, string]) => {
        let needBlock = false;
        for (const subscriber of this.setSubscribers) {
          needBlock ||= subscriber(...args);
        }

        if (!needBlock) {
          target.apply(thisArg, args);
        }
      },
    });

    window.localStorage.getItem = new Proxy(window.localStorage.getItem, {
      apply: (target, thisArg, args: [string]) => {
        let needBlock = false;
        for (const subscriber of this.getSubscribers) {
          needBlock ||= subscriber(...args);
        }

        return needBlock ? null : target.apply(thisArg, args);
      },
    });

    window.localStorage.removeItem = new Proxy(window.localStorage.removeItem, {
      apply: (target, thisArg, args: [string]) => {
        let needBlock = false;
        for (const subscriber of this.removeSubscribers) {
          needBlock ||= subscriber(...args);
        }

        if (!needBlock) {
          target.apply(thisArg, args);
        }
      },
    });

    window.localStorage.clear = new Proxy(window.localStorage.clear, {
      apply: (target, thisArg) => {
        let needBlock = false;
        for (const subscriber of this.clearSubscribers) {
          needBlock ||= subscriber();
        }

        if (!needBlock) {
          target.apply(thisArg);
        }
      },
    });
  }

  subscribe<T extends keyof LocalStorageInterceptorCallMap>(
    action: T,
    listener: LocalStorageInterceptorCallMap[T],
  ): LocalStorageInterceptorListenerUnsubscriber {
    const subscribers = this.subscribersByAction(action);

    subscribers.push(listener);

    return () => {
      const idx = subscribers.findIndex((x) => x === listener);

      if (idx !== -1) {
        this.setSubscribers.splice(idx, 1);
      }
    };
  }

  private subscribersByAction<T extends keyof LocalStorageInterceptorCallMap>(
    action: T,
  ): LocalStorageInterceptorCallMap[T][] {
    switch (action) {
      case 'set':
        return reinterpret_cast<LocalStorageInterceptorCallMap[T][]>(this.setSubscribers);
      case 'get':
        return reinterpret_cast<LocalStorageInterceptorCallMap[T][]>(this.getSubscribers);
      case 'remove':
        return reinterpret_cast<LocalStorageInterceptorCallMap[T][]>(this.removeSubscribers);
      case 'clear':
        return reinterpret_cast<LocalStorageInterceptorCallMap[T][]>(this.clearSubscribers);
      default:
        return [];
    }
  }
}
