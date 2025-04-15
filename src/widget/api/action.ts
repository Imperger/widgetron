/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface Action {
  sendMessage(text: string): void;
  deleteMessage(messageId: string): void;
  /**
   * Ban the user on current channel
   * @param bannedUserLogin like displayName but in lowercase
   * @param expiresIn 1s 10s 1m 10m 30m
   * @param reason
   */
  banUser(bannedUserLogin: string, expiresIn: string, reason: string): void;
}
