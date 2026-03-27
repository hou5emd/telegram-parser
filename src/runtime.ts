import { BotService } from "./bot/bot-service";
import { env } from "./config/env";
import { parserService } from "./parser/parser-service";
import { bootstrapStorage } from "./storage/bootstrap";
import { channelsRepository } from "./storage/channels-repository";
import { matchesRepository } from "./storage/matches-repository";
import { usersRepository } from "./storage/users-repository";
import { telegramClientService } from "./telegram/telegram-client-service";

bootstrapStorage();

export const botService = new BotService({
  getStatus: async () => {
    const ownerUserId = env.adminTelegramUserId ? (usersRepository.getByTelegramUserId(env.adminTelegramUserId)?.id ?? 0) : 0;
    const parserStatus = ownerUserId ? parserService.getStatus(ownerUserId) : { paused: parserService.isPaused(), trackedChannels: 0, totalMatches: 0, includeKeywords: 0, excludeKeywords: 0 };
    const sessionStatus = ownerUserId ? telegramClientService.getStatus(ownerUserId) : { configured: false, authorized: false, pendingStep: "idle", me: null };

    return [
      `Parser paused: ${parserStatus.paused ? "yes" : "no"}`,
      `Tracked channels: ${ownerUserId ? channelsRepository.listEnabled(ownerUserId).length : 0}`,
      `Total matches: ${ownerUserId ? matchesRepository.countMatches(ownerUserId) : 0}`,
      `Telegram session: ${sessionStatus.authorized ? "authorized" : sessionStatus.pendingStep}`,
    ].join("\n");
  },
  pause: async () => {
    parserService.pause();
  },
  resume: async () => {
    parserService.resume();
  },
});

parserService.setNotifier(async (match) => {
  await botService.notifyMatch(match);
});

export const initializeRuntime = async () => {
  await telegramClientService.initialize();

  void botService.launch().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Bot launch skipped: ${message}`);
  });
};
