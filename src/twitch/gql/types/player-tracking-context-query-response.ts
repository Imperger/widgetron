interface CurrentUser {
  id: string;
  login: string;
  isStaff: boolean;
  hasTurbo: boolean;
  __typename: 'User';
}

interface User {
  id: string;
  login: string;
  isPartner: boolean;
  __typename: 'User';
  subscriptionProducts: SubscriptionProduct[];
  stream: Stream;
  self: UserSelfConnection;
  broadcastSettings: BroadcastSettings;
}

interface SubscriptionProduct {
  id: string;
  hasAdFree: boolean;
  __typename: 'SubscriptionProduct';
}

interface Stream {
  id: string;
  broadcasterSoftware: string;
  game: Game;
  restriction: null;
  __typename: 'Stream';
}

interface Game {
  id: string;
  name: string;
  __typename: 'Game';
}

interface Follower {
  followedAt: string;
  __typename: 'FollowerEdge';
}

interface SubscriptionBenefit {
  id: string;
  __typename: 'SubscriptionBenefit';
}

interface UserSelfConnection {
  follower: Follower | null;
  subscriptionBenefit: SubscriptionBenefit | null;
  isModerator: boolean;
  __typename: 'UserSelfConnection';
}

interface BroadcastSettings {
  id: string;
  game: Game;
  __typename: 'BroadcastSettings';
}

export interface PlayerTrackingContextQueryLiveResponse {
  currentUser: CurrentUser;
  user: User;
}
