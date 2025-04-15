interface User {
  id: string;
  login: string;
  displayName: string;
  __typename: 'User';
}

interface ChatRoomBanStatus {
  bannedUser: User;
  createdAt: string; // ISO date string
  expiresAt: string; // ISO date string
  isPermanent: boolean;
  moderator: User;
  reason: string;
  __typename: 'ChatRoomBanStatus';
}

interface BanUserFromChatRoomPayload {
  ban: ChatRoomBanStatus | null;
  error: null;
  __typename: 'BanUserFromChatRoomPayload';
}

export interface BanUserResponse {
  banUserFromChatRoom: BanUserFromChatRoomPayload;
}
