/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface Action {
  sendMessage(text: string): void;
  deleteMessage(messageId: string): void;
}
