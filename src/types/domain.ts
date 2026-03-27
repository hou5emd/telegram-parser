export type KeywordType = "include" | "exclude";

export interface AdminIdentity {
  telegramUserId: number | null;
  source: "telegram-webapp" | "dev-bypass";
  username?: string;
  firstName?: string;
}

export interface TrackedChannel {
  id: number;
  peerId: string;
  username: string | null;
  title: string | null;
  accessHash: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordRule {
  id: number;
  type: KeywordType;
  value: string;
  enabled: boolean;
  createdAt: string;
}

export interface RawMessageRecord {
  id: number;
  sourcePeerId: string;
  telegramMessageId: number;
  channelUsername: string | null;
  channelTitle: string | null;
  text: string;
  messageDate: string | null;
  permalink: string | null;
  hash: string;
  matched: boolean;
  createdAt: string;
}

export interface MatchRecord {
  id: number;
  rawMessageId: number;
  matchedKeywords: string[];
  forwardedAt: string | null;
  createdAt: string;
  sourcePeerId: string;
  telegramMessageId: number;
  channelUsername: string | null;
  channelTitle: string | null;
  text: string;
  messageDate: string | null;
  permalink: string | null;
}

export interface ParserInputMessage {
  sourcePeerId: string;
  telegramMessageId: number;
  channelUsername: string | null;
  channelTitle: string | null;
  text: string;
  messageDate: string | null;
  permalink: string | null;
}

export interface ParserStatus {
  paused: boolean;
  includeKeywords: number;
  excludeKeywords: number;
  trackedChannels: number;
  totalMatches: number;
}

export interface TelegramSessionStatus {
  configured: boolean;
  authorized: boolean;
  pendingStep: "idle" | "code" | "password";
  me: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
}
