import type {
  WebsocketInterceptorListener,
  WebsocketInterceptorListenerResult,
} from './websocket-interceptor';

import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { splitFirstN } from '@/lib/split-first-n';

export interface Badge {
  title: string;
  discriminator: number;
}

export interface ChatMessage {
  type: 'PRIVMSG';
  id: string;
  roomId: string;
  roomDisplayName: string;
  userId: string;
  displayName: string;
  text: string;
  subscriber: boolean;
  moderator: boolean;
  vip: boolean;
  turbo: boolean;
  returning: boolean;
  firstMessage: boolean;
  badges: Badge[];
  color: string;
  timestamp: number;
}

export interface ClearChatCommand {
  type: 'CLEARCHAT';
  roomId: string;
  roomDisplayName: string;
  targetUserId: string;
  targetUserDisplayName: string;
  banDuration: number;
  timestamp: number;
}

export interface ClearMsgCommand {
  type: 'CLEARMSG';
  roomId: string;
  roomDisplayName: string;
  targetUserDisplayName: string;
  targetMessageId: string;
  messageText: string;
  timestamp: number;
}

export interface UnknownCommand {
  type: 'UNKNOWN';
  data: string;
}

export type ParsedMessageBody = UnknownCommand | ChatMessage | ClearChatCommand | ClearMsgCommand;

interface PacketHeader {
  tagsStr: string;
  source: string;
  command: string;
}

export type ChatInterceptorListener<T extends ParsedMessageBody> = (message: T) => boolean;

interface ChatInterceptorRecord {
  type: ParsedMessageBody['type'];
  listener: ChatInterceptorListener<ParsedMessageBody>;
}

export type ChatInterceptorListenerUnsubscriber = () => void;

export class ChatInterceptor implements WebsocketInterceptorListener {
  private readonly subscribers: ChatInterceptorRecord[] = [];

  async onMessage(message: MessageEvent): Promise<WebsocketInterceptorListenerResult> {
    if (!this.isChatRelatedMessage(message)) {
      return { isIntercepted: false, isBlocked: false };
    }

    const parsedMessage = this.parseMessage(message.data);

    let needBlock = false;
    for (const subscriber of this.subscribers) {
      if (subscriber.type === parsedMessage.type) {
        needBlock ||= subscriber.listener(parsedMessage);
      }
    }

    return {
      isIntercepted: parsedMessage.type !== 'UNKNOWN',
      isBlocked: needBlock,
    };
  }

  subscribe<T extends ParsedMessageBody>(
    type: T['type'],
    listener: ChatInterceptorListener<T>,
  ): ChatInterceptorListenerUnsubscriber {
    this.subscribers.push({
      type,
      listener: reinterpret_cast<ChatInterceptorListener<ParsedMessageBody>>(listener),
    });

    return () => {
      const idx = this.subscribers.findIndex((x) => x.listener === listener);

      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  private isChatRelatedMessage(message: MessageEvent): boolean {
    return message.origin === 'wss://irc-ws.chat.twitch.tv';
  }

  private parseMessage(messageBody: string): ParsedMessageBody {
    const [tagsStr, source, command, unparsed] = splitFirstN(messageBody, ' ', 4);

    switch (command) {
      case 'PRIVMSG':
        return this.parseUserMessage({ tagsStr, source, command }, unparsed);
      case 'CLEARCHAT':
        return this.parseClearCommand({ tagsStr, source, command }, unparsed);
      case 'CLEARMSG':
        return this.parseClearMsgCommand({ tagsStr, source, command }, unparsed);
      default:
        return { type: 'UNKNOWN', data: messageBody };
    }
  }

  private parseTagsStr(tagsStr: string): Map<string, string> {
    if (tagsStr[tagsStr.length - 1] !== ';') {
      tagsStr += ';';
    }

    const result = new Map<string, string>();

    if (tagsStr[0] !== '@') {
      throw new Error("Missing tags str header prefix '@'");
    }

    for (let tagStart = 1; tagStart !== 0 && tagStart < tagsStr.length; ) {
      const keyValueSeparatorIdx = tagsStr.indexOf('=', tagStart);
      const keyValuePairSeparatorIdx = tagsStr.indexOf(';', keyValueSeparatorIdx);

      if (keyValuePairSeparatorIdx !== -1) {
        result.set(
          tagsStr.slice(tagStart, keyValueSeparatorIdx),
          tagsStr.slice(keyValueSeparatorIdx + 1, keyValuePairSeparatorIdx),
        );
      }

      tagStart = keyValuePairSeparatorIdx + 1;
    }

    return result;
  }

  private parseBadges(badgesStr: string): Badge[] {
    if (badgesStr.length === 0) {
      return [];
    }

    return badgesStr.split(',').map((x) => {
      const [title, discriminatorStr] = x.split('/');

      return { title, discriminator: Number.parseInt(discriminatorStr) };
    });
  }

  private parseUserMessage(header: PacketHeader, unparsed: string): ChatMessage {
    const tags = this.parseTagsStr(header.tagsStr);
    const badges = this.parseBadges(tags.get('badges') ?? '');
    const [roomDisplayName, text] = splitFirstN(unparsed, ' :', 2);

    return {
      type: 'PRIVMSG',
      id: tags.get('id') ?? '',
      roomId: tags.get('room-id') ?? '',
      roomDisplayName: roomDisplayName.slice(1),
      userId: tags.get('user-id') ?? '',
      displayName: tags.get('display-name') ?? '',
      text: text.trimEnd(),
      subscriber: tags.get('subscriber') === '1',
      moderator: badges.findIndex((x) => x.title === 'moderator') !== -1,
      vip: tags.get('vip') === '1' || badges.findIndex((x) => x.title === 'vip') !== -1,
      turbo: tags.get('turbo') === '1',
      returning: tags.get('returning-chatter') === '1',
      firstMessage: tags.get('first-msg') === '1',
      badges,
      color: tags.get('color') ?? '',
      timestamp: Number.parseInt(tags.get('tmi-sent-ts') ?? '0'),
    };
  }

  private parseClearCommand(header: PacketHeader, unparsed: string): ClearChatCommand {
    const tags = this.parseTagsStr(header.tagsStr);
    const [roomDisplayName, targetUserDisplayName] = splitFirstN(unparsed, ' :', 2);

    return {
      type: 'CLEARCHAT',
      roomId: tags.get('room-id') ?? '',
      roomDisplayName: roomDisplayName.slice(1),
      targetUserId: tags.get('target-user-id') ?? '',
      targetUserDisplayName: targetUserDisplayName.trimEnd() ?? '',
      banDuration: Number.parseInt(tags.get('ban-duration') ?? '0'),
      timestamp: Number.parseInt(tags.get('tmi-sent-ts') ?? '0'),
    };
  }

  private parseClearMsgCommand(header: PacketHeader, unparsed: string): ClearMsgCommand {
    const tags = this.parseTagsStr(header.tagsStr);
    const [roomDisplayName, messageText] = splitFirstN(unparsed, ' :', 2);

    return {
      type: 'CLEARMSG',
      roomId: tags.get('room-id') ?? '',
      roomDisplayName: roomDisplayName.slice(1),
      targetUserDisplayName: tags.get('login') ?? '',
      targetMessageId: tags.get('target-msg-id') ?? '',
      messageText: messageText.trimEnd(),
      timestamp: Number.parseInt(tags.get('tmi-sent-ts') ?? '0'),
    };
  }
}
