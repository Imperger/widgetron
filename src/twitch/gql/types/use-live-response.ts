interface Stream {
  createdAt: string;
  id: string;
  __typename: 'Stream';
}

interface User {
  id: string;
  login: string;
  stream: Stream | null;
  __typename: 'User';
}

export interface UseLiveResponse {
  user: User;
}
