import type { FetchInterceptorListener, FetchInterceptorRequest } from '../fetch-interceptor';

import type { Extensions } from './types/gql-request';
import type { GQLResponse } from './types/gql-response';

import { JsonObjectComparator, type JSONObject } from '@/lib/json-object-equal';
import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface GQLQuery {
  extensions?: Extensions;
  operationName?: string;
  variables?: JSONObject;
}

export type GQLInterceptorListener = (data: GQLResponse<unknown>) => void;

interface GQLInterceptorRecord {
  query: GQLQuery;
  listener: GQLInterceptorListener;
}

export type GQLInterceptorListenerUnsubscriber = () => void;

interface GQLRequestItem {
  operationName: string;
  variables: JSONObject;
}

export class GQLInterceptor implements FetchInterceptorListener {
  private readonly subscribers: GQLInterceptorRecord[] = [];

  async onRequest(req: FetchInterceptorRequest, res: Response): Promise<boolean> {
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

    const responseItems: GQLResponse<unknown>[] = await res.json();

    for (const [n, requestItem] of requestItems.entries()) {
      for (const subscriber of this.subscribers) {
        if (
          JsonObjectComparator.isSubset(
            reinterpret_cast<JSONObject>(subscriber.query),
            reinterpret_cast<JSONObject>(requestItem),
          )
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

  private isGQLRequest(req: FetchInterceptorRequest): boolean {
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
