import { Api, TelegramClient, utils } from "telegram";
import { LogLevel } from "telegram/extensions/Logger";
import { computeCheck } from "telegram/Password";
import { NewMessage, type NewMessageEvent } from "telegram/events";
import { StringSession } from "telegram/sessions";

import { env } from "../config/env";
import { parserService } from "../parser/parser-service";
import { channelsRepository } from "../storage/channels-repository";
import { settingsRepository } from "../storage/settings-repository";
import type { TelegramSessionStatus, TrackedChannel } from "../types/domain";

interface PendingLogin {
  client: TelegramClient;
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  phoneCodeHash: string;
  requiresPassword: boolean;
}

const normalizeChannelIdentifier = (value: string) =>
  value.trim().replace(/^https?:\/\/t\.me\//, "").replace(/^@/, "").replace(/\/$/, "");

const getPeerIdCandidates = (value: string) => {
  const candidates = new Set<string>([value]);

  if (value.startsWith("-100")) {
    candidates.add(value.slice(4));
  } else if (!value.startsWith("-")) {
    candidates.add(`-100${value}`);
  }

  return [...candidates];
};

const createPermalink = (channel: TrackedChannel | null, messageId: number) => {
  if (channel?.username) {
    return `https://t.me/${channel.username}/${messageId}`;
  }

  return null;
};

const configureClient = (client: TelegramClient) => {
  client.setLogLevel(LogLevel.NONE);
  client.onError = async (error: Error) => {
    if (error.message.includes("TIMEOUT")) {
      return;
    }

    console.error(`Telegram client error: ${error.message}`);
  };
};

const toIsoDate = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
};

export class TelegramClientService {
  private client: TelegramClient | null = null;
  private me: TelegramSessionStatus["me"] = null;
  private pendingLogin: PendingLogin | null = null;
  private listenerAttached = false;

  async initialize() {
    if (!env.parserAutoStart) {
      return;
    }

    const storedApiId = settingsRepository.get("telegram.apiId");
    const storedApiHash = settingsRepository.get("telegram.apiHash");
    const storedSession = settingsRepository.get("telegram.session");

    if (!storedApiId || !storedApiHash || !storedSession) {
      return;
    }

    const apiId = Number(storedApiId);

    if (!Number.isFinite(apiId)) {
      return;
    }

    const client = new TelegramClient(new StringSession(storedSession), apiId, storedApiHash, {
      connectionRetries: 5,
    });

    configureClient(client);

    await client.connect();

    if (!(await client.checkAuthorization())) {
      await client.disconnect();
      return;
    }

    await this.setAuthorizedClient(client, apiId, storedApiHash);
  }

  async startLogin(input: { apiId: number; apiHash: string; phoneNumber: string }) {
    await this.disconnectPendingLogin();

    const client = new TelegramClient(new StringSession(""), input.apiId, input.apiHash, {
      connectionRetries: 5,
    });

    configureClient(client);

    await client.connect();

    const sentCode = (await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: input.phoneNumber,
        apiId: input.apiId,
        apiHash: input.apiHash,
        settings: new Api.CodeSettings({}),
      })
    )) as Api.auth.SentCode;

    this.pendingLogin = {
      client,
      apiId: input.apiId,
      apiHash: input.apiHash,
      phoneNumber: input.phoneNumber,
      phoneCodeHash: sentCode.phoneCodeHash,
      requiresPassword: false,
    };

    return {
      step: "code" as const,
      phoneCodeHash: sentCode.phoneCodeHash,
      timeout: "timeout" in sentCode ? sentCode.timeout ?? null : null,
      codeType: sentCode.type.className,
    };
  }

  async completeCode(phoneCode: string) {
    if (!this.pendingLogin) {
      throw new Error("No Telegram login is waiting for a code");
    }

    try {
      await this.pendingLogin.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: this.pendingLogin.phoneNumber,
          phoneCodeHash: this.pendingLogin.phoneCodeHash,
          phoneCode,
        })
      );

      await this.setAuthorizedClient(this.pendingLogin.client, this.pendingLogin.apiId, this.pendingLogin.apiHash, this.pendingLogin.phoneNumber);
      this.pendingLogin = null;

      return { step: "done" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("SESSION_PASSWORD_NEEDED")) {
        const pendingLogin = this.pendingLogin;

        if (pendingLogin) {
          pendingLogin.requiresPassword = true;
        }

        return { step: "password" as const };
      }

      throw error;
    }
  }

  async completePassword(password: string) {
    if (!this.pendingLogin || !this.pendingLogin.requiresPassword) {
      throw new Error("No Telegram login is waiting for a password");
    }

    const passwordConfig = await this.pendingLogin.client.invoke(new Api.account.GetPassword());
    const passwordInput = await computeCheck(passwordConfig, password);

    await this.pendingLogin.client.invoke(
      new Api.auth.CheckPassword({
        password: passwordInput,
      })
    );

    await this.setAuthorizedClient(this.pendingLogin.client, this.pendingLogin.apiId, this.pendingLogin.apiHash, this.pendingLogin.phoneNumber);
    this.pendingLogin = null;

    return { step: "done" as const };
  }

  getStatus(): TelegramSessionStatus {
    return {
      configured: Boolean(settingsRepository.get("telegram.apiId") && settingsRepository.get("telegram.apiHash")),
      authorized: Boolean(this.client),
      pendingStep: this.pendingLogin ? (this.pendingLogin.requiresPassword ? "password" : "code") : "idle",
      me: this.me,
    };
  }

  async addChannel(identifier: string) {
    const client = this.requireClient();
    const resolved = await client.getEntity(normalizeChannelIdentifier(identifier));

    const peerId = String(await client.getPeerId(resolved));
    const username = "username" in resolved && resolved.username ? String(resolved.username) : null;
    const title = "title" in resolved && resolved.title ? String(resolved.title) : username;
    const accessHash = "accessHash" in resolved && resolved.accessHash ? String(resolved.accessHash) : null;

    if (!peerId) {
      throw new Error("Could not resolve channel identifier");
    }

    return channelsRepository.upsert({
      peerId,
      username,
      title,
      accessHash,
      enabled: true,
    });
  }

  async addChannelWithBackfill(identifier: string, limit = 20) {
    const channel = await this.addChannel(identifier);

    if (!channel) {
      throw new Error("Failed to save tracked channel");
    }

    const backfill = await this.backfillChannel(channel.id, limit);

    return {
      channel,
      backfill,
    };
  }

  async backfillChannel(channelId: number, limit = 25) {
    const client = this.requireClient();
    const channel = channelsRepository.getById(channelId);

    if (!channel) {
      throw new Error("Tracked channel not found");
    }

    const messages = await client.getMessages(channel.username || channel.peerId, { limit });
    let processed = 0;

    for (const message of [...messages].reverse()) {
      if (!message?.id) {
        continue;
      }

      await parserService.ingestMessage({
        sourcePeerId: channel.peerId,
        telegramMessageId: message.id,
        channelUsername: channel.username,
        channelTitle: channel.title,
        text: message.text || message.message || "",
        messageDate: toIsoDate(message.date),
        permalink: createPermalink(channel, message.id),
      });
      processed += 1;
    }

    return { processed };
  }

  private async setAuthorizedClient(client: TelegramClient, apiId: number, apiHash: string, phoneNumber?: string) {
    if (this.client && this.client !== client) {
      await this.client.disconnect();
    }

    this.client = client;
    settingsRepository.set("telegram.apiId", String(apiId));
    settingsRepository.set("telegram.apiHash", apiHash);

    if (phoneNumber) {
      settingsRepository.set("telegram.phone", phoneNumber);
    }

    settingsRepository.set("telegram.session", (client.session as StringSession).save());

    const me = await client.getMe();
    this.me = {
      id: String(me.id),
      username: me.username,
      firstName: me.firstName,
      lastName: me.lastName,
      phone: me.phone,
    };

    this.attachListener();
  }

  private attachListener() {
    if (!this.client || this.listenerAttached) {
      return;
    }

    this.client.addEventHandler((event) => {
      void this.handleNewMessage(event);
    }, new NewMessage({}));
    this.client.addEventHandler((update) => {
      void this.handleRawUpdate(update);
    });
    this.listenerAttached = true;
  }

  private async handleNewMessage(event: NewMessageEvent) {
    const peerId = event.message.peerId ? String(utils.getPeerId(event.message.peerId)) : undefined;
    const chatId = peerId ?? event.message.chatId?.toString();

    if (!chatId) {
      return;
    }

    const channel = getPeerIdCandidates(chatId)
      .map((candidate) => channelsRepository.getByPeerId(candidate))
      .find(Boolean);

    if (!channel?.enabled) {
      return;
    }

    await parserService.ingestMessage({
      sourcePeerId: channel.peerId,
      telegramMessageId: event.message.id,
      channelUsername: channel.username,
      channelTitle: channel.title,
      text: event.message.text || event.message.message || "",
      messageDate: toIsoDate(event.message.date),
      permalink: createPermalink(channel, event.message.id),
    });
  }

  private async handleRawUpdate(update: unknown) {
    if (!(update instanceof Api.UpdateNewChannelMessage) && !(update instanceof Api.UpdateEditChannelMessage)) {
      return;
    }

    const message = update.message;

    if (!(message instanceof Api.Message)) {
      return;
    }

    const peerId = message.peerId ? String(utils.getPeerId(message.peerId)) : undefined;

    if (!peerId) {
      return;
    }

    const channel = getPeerIdCandidates(peerId)
      .map((candidate) => channelsRepository.getByPeerId(candidate))
      .find(Boolean);

    if (!channel?.enabled) {
      return;
    }

    await parserService.ingestMessage({
      sourcePeerId: channel.peerId,
      telegramMessageId: message.id,
      channelUsername: channel.username,
      channelTitle: channel.title,
      text: message.message || "",
      messageDate: toIsoDate(message.date),
      permalink: createPermalink(channel, message.id),
    });
  }

  private requireClient() {
    if (!this.client) {
      throw new Error("Telegram client is not authorized yet");
    }

    return this.client;
  }

  private async disconnectPendingLogin() {
    if (this.pendingLogin) {
      await this.pendingLogin.client.disconnect();
      this.pendingLogin = null;
    }
  }
}

export const telegramClientService = new TelegramClientService();
