import { env } from "../config/env";
import { keywordsRepository } from "./keywords-repository";
import { settingsRepository } from "./settings-repository";
import { telegramSessionsRepository } from "./telegram-sessions-repository";
import { usersRepository } from "./users-repository";

export const bootstrapStorage = () => {
  if (settingsRepository.get("parser.paused") === null) {
    settingsRepository.set("parser.paused", "false");
  }

  if (env.adminTelegramUserId) {
    const owner = usersRepository.ensureFromIdentity({
      telegramUserId: env.adminTelegramUserId,
      source: "dev-bypass",
      isAdmin: true,
    });

    if (owner) {
      const existingSession = telegramSessionsRepository.getByOwnerUserId(owner.id);

      for (const keyword of env.initialIncludeKeywords) {
        keywordsRepository.add(owner.id, "include", keyword);
      }

      for (const keyword of env.initialExcludeKeywords) {
        keywordsRepository.add(owner.id, "exclude", keyword);
      }

      if (env.telegramApiId && env.telegramApiHash && (!existingSession || env.telegramSession)) {
        telegramSessionsRepository.save({
          ownerUserId: owner.id,
          apiId: env.telegramApiId,
          apiHash: env.telegramApiHash,
          phoneNumber: existingSession?.phoneNumber ?? env.telegramPhone ?? null,
          session: env.telegramSession || existingSession?.session || null,
          me: existingSession?.me ?? null,
          authorized: Boolean(env.telegramSession || existingSession?.session),
        });
      }
    }
  }
};
