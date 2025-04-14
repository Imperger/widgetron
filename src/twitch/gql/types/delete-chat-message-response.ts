interface User {
  id: string;
  login: string;
  displayName: string;
  __typename: 'User';
}

interface RoomMessageContent {
  text: string;
  __typename: 'RoomMessageContent';
}

interface DeletedMessage {
  id: string;
  sender: User;
  content: RoomMessageContent;
  __typename: 'DeletedMessage';
}

interface DeleteChatMessagePayload {
  responseCode: string;
  message: DeletedMessage;
  __typename: 'DeleteChatMessagePayload';
}

export interface DeleteChatMessageResponse {
  deleteChatMessage: DeleteChatMessagePayload;
}
