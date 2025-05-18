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

type GQLRequestTransformer<T extends GQLRequestItem> = (
  request: T,
) => Promise<GQLRequestItem | null>;

interface GQLRequestTransformerRecord {
  query: GQLQuery;
  fn: GQLRequestTransformer<GQLRequestItem>;
}

export type GQLInterceptorListener = (data: GQLResponse<unknown>) => void;

interface GQLInterceptorRecord {
  query: GQLQuery;
  listener: GQLInterceptorListener;
}

export type GQLInterceptorListenerUnsubscriber = () => void;

interface GQLRequestItem {
  operationName: string;
  variables: object;
}

export class GQLInterceptor implements FetchInterceptorListener {
  private readonly requestTransformers: GQLRequestTransformerRecord[] = [];
  private readonly subscribers: GQLInterceptorRecord[] = [];

  async onRequest(req: FetchInterceptorRequest): Promise<FetchInterceptorRequest | null> {
    if (!this.isGQLRequest(req)) {
      return null;
    }

    if (typeof req.init?.body !== 'string') {
      return null;
    }

    let requestItems: GQLRequestItem[] = JSON.parse(req.init?.body);
    if (!Array.isArray(requestItems)) {
      requestItems = [requestItems];
    }

    let patched = false;
    for (const [n, requestItem] of requestItems.entries()) {
      for (const transformer of this.requestTransformers) {
        if (
          JsonObjectComparator.isSubset(
            reinterpret_cast<JSONObject>(transformer.query),
            reinterpret_cast<JSONObject>(requestItem),
          )
        ) {
          const patchedRequest = await transformer.fn(requestItem);

          if (patchedRequest !== null) {
            requestItems[n] = patchedRequest;

            patched = true;
          }
        }
      }
    }

    if (patched) {
      const body = JSON.stringify(requestItems.length > 1 ? requestItems : requestItems[0]);

      return { input: req.input, init: { ...req.init, body } };
    }

    return null;
  }

  async onResponse(req: FetchInterceptorRequest, res: Response): Promise<boolean> {
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

  transformRequest<T extends GQLRequestItem>(
    query: GQLQuery,
    transformer: GQLRequestTransformer<T>,
  ): GQLInterceptorListenerUnsubscriber {
    this.requestTransformers.push({
      query,
      fn: transformer as GQLRequestTransformer<GQLRequestItem>,
    });

    return () => {
      const idx = this.requestTransformers.findIndex((x) => x.fn);

      if (idx !== -1) {
        this.requestTransformers.splice(idx, 1);
      }
    };
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
