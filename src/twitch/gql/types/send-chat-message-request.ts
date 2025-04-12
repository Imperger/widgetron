export interface Input {
  channelID: string;
  message: string;
  nonce: string;
  replyParentMessageID: string | null;
}

export interface Variables {
  input: Input;
}

export interface SendChatMessageRequest {
  operationName: 'sendChatMessage';
  variables: Variables;
}
