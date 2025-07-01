export interface Variables {
  badgeSourceChannelID: string;
  badgeSourceChannelLogin: string;
  channelID: string;
  channelLogin: string;
  giftRecipientLogin: string;
  hasChannelID: boolean;
  isViewerBadgeCollectionEnabled: boolean;
  withStandardGifting: boolean;
}

export interface ViewerCardRequest {
  operationName: 'ViewerCard';
  variables: Variables;
}
