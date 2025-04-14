export interface Extensions {
  durationMilliseconds: number;
  operationName: string;
  requestID: string;
}

export interface GQLSuccessResponse<T> {
  data: T;
  extensions: Extensions;
}

export interface GQLPersistentQueryNotFound {
  message: 'PersistedQueryNotFound';
}

export interface GQLErrorResponse {
  errors: GQLPersistentQueryNotFound[];
}

export type GQLResponse<T> = GQLSuccessResponse<T> | GQLErrorResponse;

export function isGQLSuccessResponse<T>(x: GQLResponse<T>): x is GQLSuccessResponse<T> {
  return !('errors' in x);
}

export function isGQLErrorResponse<T>(x: GQLResponse<T>): x is GQLErrorResponse {
  return 'errors' in x;
}

export function isGQLPersistentQueryNotFound<T>(x: GQLResponse<T>): boolean {
  return isGQLErrorResponse(x) && x.errors.some((x) => x.message === 'PersistedQueryNotFound');
}
