export interface Input {
  bannedUserLogin: string;
  channelID: string;
  expiresIn: string;
  reason: string;
}

export interface Variables {
  input: Input;
}

export interface BanUserRequest {
  operationName: 'Chat_BanUserFromChatRoom';
  variables: Variables;
}
