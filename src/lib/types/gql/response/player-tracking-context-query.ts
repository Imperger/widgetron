interface User {
  id: string;
  login: string;
  __typename: 'User';
}

interface CurrentUser extends User {
  isStaff: boolean;
  hasTurbo: boolean;
}

interface SubscriptionProduct {
  id: string;
  hasAdFree: boolean;
  __typename: 'SubscriptionProduct';
}

interface Game {
  id: string;
  name: string;
  __typename: 'Game';
}

interface Stream {
  id: string;
  broadcasterSoftware: string;
  game: Game;
  restriction: string | null;
  __typename: 'Stream';
}

interface FollowerEdge {
  followedAt: string;
  __typename: 'FollowerEdge';
}

interface UserSelfConnection {
  follower: FollowerEdge;
  subscriptionBenefit: unknown | null;
  isModerator: boolean;
  __typename: 'UserSelfConnection';
}

interface BroadcastSettings {
  id: string;
  game: Game;
  __typename: 'BroadcastSettings';
}

interface UserDetails extends User {
  isPartner: boolean;
  subscriptionProducts: SubscriptionProduct[];
  stream: Stream;
  self: UserSelfConnection;
  broadcastSettings: BroadcastSettings;
}

interface Data {
  currentUser: CurrentUser;
  user: UserDetails;
}

interface Extensions {
  durationMilliseconds: number;
  operationName: string;
  requestID: string;
}

export interface PlayerTrackingContextQuery {
  data: Data;
  extensions: Extensions;
}
