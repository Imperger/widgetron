import type { Router } from 'vue-router';

interface InterceptedRequest {
  intercepted: true;
}

export class NavigationInterceptor {
  constructor(private readonly router: Router) {}

  install(): void {
    const origin = history.pushState;

    window.history.pushState = (data: unknown, unused, url: string) => {
      origin.call(window.history, data, unused, url);

      if (!NavigationInterceptor.isInterceptedRequest(data)) {
        this.router.push({ state: { intercepted: true }, path: url });
      }
    };
  }

  private static isInterceptedRequest(data: unknown): data is InterceptedRequest {
    return (data as Partial<InterceptedRequest>)['intercepted'] === true;
  }
}
