type ChatRestrictedReason =
  | 'SUBSCRIBERS_ONLY'
  | 'VERIFIED_PHONE_NUMBER_ONLY'
  | 'FOLLOWERS_ONLY'
  | 'SLOW_MODE';

interface Follower {
  followedAt: string;
  __typename: 'FollowerEdge';
}

interface UserSelfConnection {
  chatRestrictedReasons: ChatRestrictedReason[];
  lastRecentChatMessageAt: string | null;
  follower: Follower;
  banStatus: string | null;
  isFirstTimeChatter: boolean;
  subscriptionBenefit: string | null;
  isVIP: boolean;
  isModerator: boolean;
  __typename: 'UserSelfConnection';
}

interface ChatSettings {
  requireVerifiedAccount: boolean;
  __typename: 'ChatSettings';
}

interface Channel {
  id: string;
  self: UserSelfConnection;
  chatSettings: ChatSettings;
  __typename: 'User';
}

interface CurrentUser {
  id: string;
  createdAt: string;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  __typename: 'User';
}

export interface ChatRestrictionsResponse {
  channel: Channel;
  currentUser: CurrentUser;
}
