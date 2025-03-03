import { jsonObjectEqual, type JSONObject } from '../../json-object-equal';

import type { NetworkInterceptorListener, NetworkInterceptorRequest } from './network-interceptor';

export interface GQLQuery {
  operationName?: string;
  variables?: JSONObject;
}

export type GQLInterceptorListener = (data: JSONObject) => void;

interface GQLInterceptorRecord {
  query: GQLQuery;
  listener: GQLInterceptorListener;
}

export type GQLInterceptorListenerUnsubscriber = () => void;

interface GQLRequestItem {
  operationName: string;
  variables: JSONObject;
}

export class GQLInterceptor implements NetworkInterceptorListener {
  private readonly subscribers: GQLInterceptorRecord[] = [];

  async onRequest(req: NetworkInterceptorRequest, res: Response): Promise<boolean> {
    if (!this.isGQLRequest(req)) {
      return false;
    }

    if (typeof req.init?.body !== 'string') {
      return false;
    }

    let requestItems: GQLRequestItem[] = JSON.parse(req.init?.body);
    if (!Array.isArray(requestItems)) {
      requestItems = [requestItems];
    }

    const responseItems: JSONObject[] = await res.json();

    for (const [n, requestItem] of requestItems.entries()) {
      for (const subscriber of this.subscribers) {
        if (
          (subscriber.query.operationName === undefined &&
            subscriber.query.variables === undefined) ||
          (subscriber.query.operationName === requestItem.operationName &&
            (subscriber.query.variables === undefined ||
              jsonObjectEqual(subscriber.query.variables, requestItem.variables)))
        ) {
          subscriber.listener(responseItems[n]);
        }
      }
    }

    return true;
  }

  subscribe(query: GQLQuery, listener: GQLInterceptorListener): GQLInterceptorListenerUnsubscriber {
    this.subscribers.push({ query, listener });

    return () => {
      const idx = this.subscribers.findIndex((x) => x.listener);

      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  private isGQLRequest(req: NetworkInterceptorRequest): boolean {
    const url = 'https://gql.twitch.tv/gql';

    if (req.init?.method !== 'POST') {
      return false;
    }

    if (typeof req.input === 'string') {
      return req.input.startsWith(url);
    } else if (req.input instanceof URL) {
      return req.input.href.startsWith(url);
    } else if (req.input instanceof Request) {
      return req.input.url.startsWith(url);
    }

    return false;
  }
}
