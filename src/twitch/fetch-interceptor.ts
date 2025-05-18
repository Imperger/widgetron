export interface FetchInterceptorRequest {
  input: RequestInfo | URL;
  init?: RequestInit;
}

export interface FetchInterceptorListener {
  onRequest?(req: FetchInterceptorRequest): Promise<FetchInterceptorRequest | null>;
  onResponse(req: FetchInterceptorRequest, res: Response): Promise<boolean>;
}

export type FetchInterceptorListenerUnsubscriber = () => void;

export class FetchInterceptor {
  private readonly subscribers: FetchInterceptorListener[] = [];

  install(): void {
    const origin = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let request: FetchInterceptorRequest = { input, init };
      try {
        for (const subscriber of this.subscribers) {
          const patchedRequest = (await subscriber.onRequest?.({ input, init })) ?? null;
          if (patchedRequest !== null) {
            request = patchedRequest;
            break;
          }
        }
      } catch (e) {
        console.error(e);
      }

      const response = await origin(request.input, request.init);

      try {
        for (const subscriber of this.subscribers) {
          if (await subscriber.onResponse({ input, init }, response.clone())) {
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
