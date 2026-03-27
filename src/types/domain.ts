export type KeywordType = "include" | "exclude";

export interface AdminIdentity {
  telegramUserId: number | null;
  source: "telegram-webapp" | "dev-bypass";
  username?: string;
  firstName?: string;
  isAdmin?: boolean;
}

export interface AppUser {
  id: number;
  telegramUserId: number;
  username: string | null;
  firstName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedChannel {
  id: number;
  ownerUserId: number;
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
  ownerUserId: number;
  type: KeywordType;
  value: string;
  enabled: boolean;
  createdAt: string;
}

export interface RawMessageRecord {
  id: number;
  ownerUserId: number;
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
  ownerUserId: number;
  ownerTelegramUserId: number | null;
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
  ownerUserId: number;
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
