export interface Extensions {
  durationMilliseconds: number;
  operationName: string;
  requestID: string;
}

export interface GQLResponse<T> {
  data: T;
  extensions: Extensions;
}
