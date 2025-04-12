export interface ChannelSelfEdge {
  isAuthorized: boolean;
  restrictionType: string | null;
  __typename: 'ChannelSelfEdge';
}

export interface Trailer {
  video: unknown | null;
  __typename: 'Trailer';
}

export interface ChannelHome {
  preferences: ChannelHomePreferences;
  __typename: 'ChannelHome';
}

export interface ChannelHomePreferences {
  heroPreset: string;
  __typename: 'ChannelHomePreferences';
}

export interface Channel {
  id: string;
  self: ChannelSelfEdge;
  trailer: Trailer;
  home: ChannelHome;
  __typename: 'Channel';
}

export interface Stream {
  id: string;
  viewersCount: number;
  __typename: 'Stream';
}

export interface UserOrError {
  id: string;
  login: string;
  displayName: string;
  primaryColorHex: string | null;
  profileImageURL: string;
  stream: Stream | null;
  __typename: 'User';
  bannerImageURL: string | null;
  channel: Channel;
}

export interface ChannelShellResponse {
  userOrError: UserOrError;
}
