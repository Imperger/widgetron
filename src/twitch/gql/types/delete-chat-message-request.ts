export interface Input {
  channelID: string;
  messageID: string;
}

export interface Variables {
  input: Input;
}

export interface DeleteChatMessageRequest {
  operationName: 'Chat_DeleteChatMessage';
  variables: Variables;
}
