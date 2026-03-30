import { Api, TelegramClient, utils } from "telegram";
import { NewMessage, type NewMessageEvent } from "telegram/events";
import { LogLevel } from "telegram/extensions/Logger";
import { computeCheck } from "telegram/Password";
import { StringSession } from "telegram/sessions";

import { env } from "../config/env";
import { parseDateValue } from "../lib/date";
import { parserService } from "../parser/parser-service";
import { channelsRepository } from "../storage/channels-repository";
import { telegramSessionsRepository } from "../storage/telegram-sessions-repository";
import type { TelegramSessionStatus, TrackedChannel } from "../types/domain";

interface PendingLogin {
  client: TelegramClient;
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  phoneCodeHash: string;
  requiresPassword: boolean;
}

interface ActiveClientState {
  client: TelegramClient;
  me: TelegramSessionStatus["me"];
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
  if (value instanceof Date || typeof value === "string" || typeof value === "number") {
    const date = parseDateValue(value);

    return date ? date.toISOString() : null;
  }

  return null;
};

export class TelegramClientService {
  private readonly activeClients = new Map<number, ActiveClientState>();
  private readonly pendingLogins = new Map<number, PendingLogin>();
  private readonly attachedClients = new WeakSet<TelegramClient>();

  async initialize() {
    if (!env.parserAutoStart) {
      return;
    }

    for (const session of telegramSessionsRepository.listAuthorized()) {
      if (!session.session) {
        continue;
      }

      const client = new TelegramClient(new StringSession(session.session), session.apiId, session.apiHash, {
        connectionRetries: 5,
      });

      configureClient(client);

      try {
        await client.connect();

        if (!(await client.checkAuthorization())) {
          await client.disconnect();
          telegramSessionsRepository.clear(session.ownerUserId);
          continue;
        }

        await this.setAuthorizedClient(session.ownerUserId, client, session.apiId, session.apiHash, session.phoneNumber ?? undefined);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Telegram session restore failed for user ${session.ownerUserId}: ${message}`);
        await client.disconnect();
      }
    }
  }

  getStatus(ownerUserId: number): TelegramSessionStatus {
    const session = telegramSessionsRepository.getByOwnerUserId(ownerUserId);
    const active = this.activeClients.get(ownerUserId);
    const pending = this.pendingLogins.get(ownerUserId);
    const apiId = session?.apiId ?? env.telegramApiId;
    const apiHash = session?.apiHash ?? env.telegramApiHash;

    return {
      configured: Boolean(apiId && apiHash),
      authorized: Boolean(active),
      pendingStep: pending ? (pending.requiresPassword ? "password" : "code") : "idle",
      me: active?.me ?? session?.me ?? null,
    };
  }

  async startLogin(ownerUserId: number, input: { phoneNumber: string }) {
    await this.disconnectPendingLogin(ownerUserId);

    const { apiId, apiHash } = this.getApiCredentials(ownerUserId);
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
    });

    configureClient(client);
    await client.connect();

    const sentCode = (await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: input.phoneNumber,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({}),
      })
    )) as Api.auth.SentCode;

    this.pendingLogins.set(ownerUserId, {
      client,
      apiId,
      apiHash,
      phoneNumber: input.phoneNumber,
      phoneCodeHash: sentCode.phoneCodeHash,
      requiresPassword: false,
    });

    telegramSessionsRepository.save({
      ownerUserId,
      apiId,
      apiHash,
      phoneNumber: input.phoneNumber,
      session: null,
      me: null,
      authorized: false,
    });

    return {
      step: "code" as const,
      phoneCodeHash: sentCode.phoneCodeHash,
      timeout: "timeout" in sentCode ? sentCode.timeout ?? null : null,
      codeType: sentCode.type.className,
    };
  }

  async completeCode(ownerUserId: number, phoneCode: string) {
    const pending = this.pendingLogins.get(ownerUserId);

    if (!pending) {
      throw new Error("No Telegram login is waiting for a code");
    }

    try {
      await pending.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: pending.phoneNumber,
          phoneCodeHash: pending.phoneCodeHash,
          phoneCode,
        })
      );

      await this.setAuthorizedClient(ownerUserId, pending.client, pending.apiId, pending.apiHash, pending.phoneNumber);
      this.pendingLogins.delete(ownerUserId);

      return { step: "done" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("SESSION_PASSWORD_NEEDED")) {
        pending.requiresPassword = true;
        return { step: "password" as const };
      }

      throw error;
    }
  }

  async completePassword(ownerUserId: number, password: string) {
    const pending = this.pendingLogins.get(ownerUserId);

    if (!pending || !pending.requiresPassword) {
      throw new Error("No Telegram login is waiting for a password");
    }

    const passwordConfig = await pending.client.invoke(new Api.account.GetPassword());
    const passwordInput = await computeCheck(passwordConfig, password);

    await pending.client.invoke(
      new Api.auth.CheckPassword({
        password: passwordInput,
      })
    );

    await this.setAuthorizedClient(ownerUserId, pending.client, pending.apiId, pending.apiHash, pending.phoneNumber);
    this.pendingLogins.delete(ownerUserId);

    return { step: "done" as const };
  }

  async addChannel(ownerUserId: number, identifier: string) {
    const client = this.requireClient(ownerUserId);
    const resolved = await client.getEntity(normalizeChannelIdentifier(identifier));

    const peerId = String(await client.getPeerId(resolved));
    const username = "username" in resolved && resolved.username ? String(resolved.username) : null;
    const title = "title" in resolved && resolved.title ? String(resolved.title) : username;
    const accessHash = "accessHash" in resolved && resolved.accessHash ? String(resolved.accessHash) : null;

    if (!peerId) {
      throw new Error("Could not resolve channel identifier");
    }

    return channelsRepository.upsert({
      ownerUserId,
      peerId,
      username,
      title,
      accessHash,
      enabled: true,
    });
  }

  async addChannelWithBackfill(ownerUserId: number, identifier: string, limit = 20) {
    const channel = await this.addChannel(ownerUserId, identifier);

    if (!channel) {
      throw new Error("Failed to save tracked channel");
    }

    const backfill = await this.backfillChannel(ownerUserId, channel.id, limit);

    return { channel, backfill };
  }

  async backfillChannel(ownerUserId: number, channelId: number, limit = 25) {
    const client = this.requireClient(ownerUserId);
    const channel = channelsRepository.getById(channelId, ownerUserId);

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
        ownerUserId,
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

  private getApiCredentials(ownerUserId: number) {
    const session = telegramSessionsRepository.getByOwnerUserId(ownerUserId);
    const apiId = session?.apiId ?? env.telegramApiId;
    const apiHash = session?.apiHash ?? env.telegramApiHash;

    if (!apiId || !apiHash) {
      throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured in env");
    }

    return { apiId, apiHash };
  }

  private async setAuthorizedClient(ownerUserId: number, client: TelegramClient, apiId: number, apiHash: string, phoneNumber?: string) {
    const existing = this.activeClients.get(ownerUserId);

    if (existing && existing.client !== client) {
      await existing.client.disconnect();
    }

    const me = await client.getMe();
    const meInfo: TelegramSessionStatus["me"] = {
      id: String(me.id),
      username: me.username,
      firstName: me.firstName,
      lastName: me.lastName,
      phone: me.phone,
    };

    this.activeClients.set(ownerUserId, { client, me: meInfo });
    telegramSessionsRepository.save({
      ownerUserId,
      apiId,
      apiHash,
      phoneNumber: phoneNumber ?? me.phone ?? null,
      session: (client.session as StringSession).save(),
      me: meInfo,
      authorized: true,
    });

    this.attachListener(ownerUserId, client);
  }

  private attachListener(ownerUserId: number, client: TelegramClient) {
    if (this.attachedClients.has(client)) {
      return;
    }

    client.addEventHandler((event) => {
      void this.handleNewMessage(ownerUserId, event);
    }, new NewMessage({}));
    client.addEventHandler((update) => {
      void this.handleRawUpdate(ownerUserId, update);
    });
    this.attachedClients.add(client);
  }

  private async handleNewMessage(ownerUserId: number, event: NewMessageEvent) {
    const peerId = event.message.peerId ? String(utils.getPeerId(event.message.peerId)) : undefined;
    const chatId = peerId ?? event.message.chatId?.toString();

    if (!chatId) {
      return;
    }

    const channel = getPeerIdCandidates(chatId)
      .map((candidate) => channelsRepository.getByPeerId(candidate, ownerUserId))
      .find(Boolean);

    if (!channel?.enabled) {
      return;
    }

    await parserService.ingestMessage({
      ownerUserId,
      sourcePeerId: channel.peerId,
      telegramMessageId: event.message.id,
      channelUsername: channel.username,
      channelTitle: channel.title,
      text: event.message.text || event.message.message || "",
      messageDate: toIsoDate(event.message.date),
      permalink: createPermalink(channel, event.message.id),
    });
  }

  private async handleRawUpdate(ownerUserId: number, update: unknown) {
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
      .map((candidate) => channelsRepository.getByPeerId(candidate, ownerUserId))
      .find(Boolean);

    if (!channel?.enabled) {
      return;
    }

    await parserService.ingestMessage({
      ownerUserId,
      sourcePeerId: channel.peerId,
      telegramMessageId: message.id,
      channelUsername: channel.username,
      channelTitle: channel.title,
      text: message.message || "",
      messageDate: toIsoDate(message.date),
      permalink: createPermalink(channel, message.id),
    });
  }

  private requireClient(ownerUserId: number) {
    const state = this.activeClients.get(ownerUserId);

    if (!state) {
      throw new Error("Telegram client is not authorized yet");
    }

    return state.client;
  }

  private async disconnectPendingLogin(ownerUserId: number) {
    const pending = this.pendingLogins.get(ownerUserId);

    if (!pending) {
      return;
    }

    await pending.client.disconnect();
    this.pendingLogins.delete(ownerUserId);
  }
}

export const telegramClientService = new TelegramClientService();
