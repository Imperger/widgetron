interface ChannelSelfEdge {
  isAuthorized: boolean;
  restrictionType: string | null;
  __typename: 'ChannelSelfEdge';
}

interface Trailer {
  video: unknown | null;
  __typename: 'Trailer';
}

interface ChannelHome {
  preferences: ChannelHomePreferences;
  __typename: 'ChannelHome';
}

interface ChannelHomePreferences {
  heroPreset: string;
  __typename: 'ChannelHomePreferences';
}

interface Channel {
  id: string;
  self: ChannelSelfEdge;
  trailer: Trailer;
  home: ChannelHome;
  __typename: 'Channel';
}

interface Stream {
  id: string;
  viewersCount: number;
  __typename: 'Stream';
}

interface UserOrError {
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
