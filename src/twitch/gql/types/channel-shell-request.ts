export interface Variables {
  isDVR: boolean;
  login: string;
}

export interface ChannelShellRequest {
  operationName: 'ChannelShell';
  variables: Variables;
}
