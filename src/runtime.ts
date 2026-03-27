import { BotService } from "./bot/bot-service";
import { parserService } from "./parser/parser-service";
import { bootstrapStorage } from "./storage/bootstrap";
import { channelsRepository } from "./storage/channels-repository";
import { matchesRepository } from "./storage/matches-repository";
import { telegramClientService } from "./telegram/telegram-client-service";

bootstrapStorage();

export const botService = new BotService({
  getStatus: async () => {
    const parserStatus = parserService.getStatus();
    const sessionStatus = telegramClientService.getStatus();

    return [
      `Parser paused: ${parserStatus.paused ? "yes" : "no"}`,
      `Tracked channels: ${channelsRepository.listEnabled().length}`,
      `Total matches: ${matchesRepository.countMatches()}`,
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
