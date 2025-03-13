export interface FetchInterceptorRequest {
  input: RequestInfo | URL;
  init?: RequestInit;
}

export interface FetchInterceptorListener {
  onRequest(req: FetchInterceptorRequest, res: Response): Promise<boolean>;
}

export type FetchInterceptorListenerUnsubscriber = () => void;

export class FetchInterceptor {
  private readonly subscribers: FetchInterceptorListener[] = [];

  install(): void {
    const origin = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await origin(input, init);

      try {
        for (const subscriber of this.subscribers) {
          if (await subscriber.onRequest({ input, init }, response.clone())) {
            break;
          }
        }
      } catch (e) {
        console.error(e);
      }

      return response;
    };
  }

  subscribe(listener: FetchInterceptorListener): FetchInterceptorListenerUnsubscriber {
    this.subscribers.push(listener);

    return () => {
      const idx = this.subscribers.indexOf(listener);

      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }
}
