export interface PersistentQuery {
  sha256Hash: string;
  version: number;
}

export interface Extensions {
  persistedQuery: PersistentQuery;
}

export type GQLRequest<T> = { extensions: Extensions } & T;
