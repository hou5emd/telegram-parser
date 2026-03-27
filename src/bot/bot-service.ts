import { Markup, Telegraf } from "telegraf";

import { env } from "../config/env";
import { matchesRepository } from "../storage/matches-repository";
import type { MatchRecord } from "../types/domain";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export class BotService {
  private readonly bot = env.botToken ? new Telegraf(env.botToken) : null;
  private launched = false;

  constructor(
    private readonly callbacks: {
      getStatus: () => Promise<string>;
      pause: () => Promise<void>;
      resume: () => Promise<void>;
    }
  ) {
    this.registerHandlers();
  }

  async launch() {
    if (!this.bot || this.launched) {
      return;
    }

    if (env.botMode === "polling") {
      await this.bot.launch();
    }

    this.launched = true;
  }

  async handleWebhook(update: unknown, secretToken?: string | null) {
    if (!this.bot) {
      throw new Error("Bot token is not configured");
    }

    if (env.botWebhookSecret && secretToken !== env.botWebhookSecret) {
      throw new Error("Invalid bot webhook secret token");
    }

    await this.bot.handleUpdate(update as Parameters<Telegraf["handleUpdate"]>[0]);
  }

  async notifyMatch(match: MatchRecord) {
    const targetChatId = env.forwardChatId || (env.adminTelegramUserId ? String(env.adminTelegramUserId) : "");

    if (!this.bot || !targetChatId) {
      return;
    }

    const text = [
      "<b>New vacancy match</b>",
      match.channelTitle ? `Source: ${escapeHtml(match.channelTitle)}` : null,
      match.matchedKeywords.length > 0 ? `Keywords: ${escapeHtml(match.matchedKeywords.join(", "))}` : null,
      "",
      escapeHtml(match.text.slice(0, 1200)),
    ]
      .filter(Boolean)
      .join("\n");

    const extra = match.permalink
      ? Markup.inlineKeyboard([[Markup.button.url("Open original", match.permalink)]])
      : undefined;

    await this.bot.telegram.sendMessage(targetChatId, text, {
      parse_mode: "HTML",
      ...(extra ? extra : {}),
    });

    matchesRepository.markForwarded(match.id);
  }

  private registerHandlers() {
    if (!this.bot) {
      return;
    }

    this.bot.start(async (ctx) => {
      if (!this.isAdmin(ctx.from?.id)) {
        await ctx.reply("This bot is restricted to the configured admin account.");
        return;
      }

      const keyboard = env.appPublicUrl
        ? Markup.inlineKeyboard([[Markup.button.webApp("Open control panel", `${env.appPublicUrl}/app`)]])
        : undefined;

      await ctx.reply(
        "Vacancy parser admin bot is online. Use /status, /pause, /resume or open the mini app.",
        keyboard ? keyboard : undefined
      );
    });

    this.bot.command("status", async (ctx) => {
      if (!this.isAdmin(ctx.from?.id)) {
        return;
      }

      await ctx.reply(await this.callbacks.getStatus());
    });

    this.bot.command("pause", async (ctx) => {
      if (!this.isAdmin(ctx.from?.id)) {
        return;
      }

      await this.callbacks.pause();
      await ctx.reply("Parser paused.");
    });

    this.bot.command("resume", async (ctx) => {
      if (!this.isAdmin(ctx.from?.id)) {
        return;
      }

      await this.callbacks.resume();
      await ctx.reply("Parser resumed.");
    });

    this.bot.command("last", async (ctx) => {
      if (!this.isAdmin(ctx.from?.id)) {
        return;
      }

      const items = matchesRepository.list(5);

      if (items.length === 0) {
        await ctx.reply("No matched vacancies yet.");
        return;
      }

      const text = items
        .map((item, index) => `${index + 1}. ${item.channelTitle || item.channelUsername || item.sourcePeerId}\n${item.text.slice(0, 160)}`)
        .join("\n\n");

      await ctx.reply(text);
    });
  }

  private isAdmin(userId: number | undefined) {
    return Boolean(userId && env.adminTelegramUserId && userId === env.adminTelegramUserId);
  }
}
