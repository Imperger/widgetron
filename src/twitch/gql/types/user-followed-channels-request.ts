export interface Variables {
  limit: number;
  login: string;
  order: 'ASC' | 'DESC';
}

export interface UserFollowedChannels {
  operationName: 'ChannelFollows';
  variables: Variables;
}
