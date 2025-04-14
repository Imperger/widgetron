export interface Variables {
  channelID: string;
  targetUserID: string;
}

export interface ChatLoginModerationTrackingRequest {
  operationName: 'ChatLoginModerationTracking';
  variables: Variables;
}
