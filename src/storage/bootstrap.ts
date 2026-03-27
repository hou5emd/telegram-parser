import { env } from "../config/env";
import { keywordsRepository } from "./keywords-repository";
import { settingsRepository } from "./settings-repository";

export const bootstrapStorage = () => {
  if (settingsRepository.get("parser.paused") === null) {
    settingsRepository.set("parser.paused", "false");
  }

  for (const keyword of env.initialIncludeKeywords) {
    keywordsRepository.add("include", keyword);
  }

  for (const keyword of env.initialExcludeKeywords) {
    keywordsRepository.add("exclude", keyword);
  }

  if (env.telegramSession && !settingsRepository.get("telegram.session")) {
    settingsRepository.set("telegram.session", env.telegramSession);
  }

  if (env.telegramApiId && !settingsRepository.get("telegram.apiId")) {
    settingsRepository.set("telegram.apiId", String(env.telegramApiId));
  }

  if (env.telegramApiHash && !settingsRepository.get("telegram.apiHash")) {
    settingsRepository.set("telegram.apiHash", env.telegramApiHash);
  }

  if (env.telegramPhone && !settingsRepository.get("telegram.phone")) {
    settingsRepository.set("telegram.phone", env.telegramPhone);
  }
};
