interface FollowerEdgeUserSelfFollower {
  disableNotifications: boolean;
  followedAt: string;
  __typename: 'FollowerEdge';
}

interface FollowerEdgeUserSelf {
  canFollow: boolean;
  follower: FollowerEdgeUserSelfFollower | null;
  __typename: 'UserSelfConnection';
}

interface FollowerEdgeUser {
  id: string;
  bannerImageURL: string | null;
  displayName: string;
  login: string;
  profileImageURL: string;
  self: FollowerEdgeUserSelf;
  __typename: 'User';
}

interface FollowEdge {
  cursor: string;
  node: FollowerEdgeUser;
  __typename: 'FollowEdge';
}

interface PageInfo {
  hasNextPage: boolean;
  __typename: 'PageInfo';
}

interface Follows {
  edges: FollowEdge[];
  pageInfo: PageInfo;
  __typename: 'FollowConnection';
}

interface User {
  id: string;
  follows: Follows;
  __typename: 'User';
}

export interface UserFollowedChannelsResponse {
  user: User;
}
