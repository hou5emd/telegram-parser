import { createHash } from "node:crypto";

import { channelsRepository } from "../storage/channels-repository";
import { keywordsRepository } from "../storage/keywords-repository";
import { matchesRepository } from "../storage/matches-repository";
import { settingsRepository } from "../storage/settings-repository";
import type { MatchRecord, ParserInputMessage, ParserStatus } from "../types/domain";
import { matchKeywords } from "./matcher";
import { normalizeText } from "./normalize";

type MatchNotifier = (match: MatchRecord) => Promise<void>;

export class ParserService {
  private notifier: MatchNotifier | null = null;

  setNotifier(notifier: MatchNotifier) {
    this.notifier = notifier;
  }

  isPaused() {
    return settingsRepository.get("parser.paused") === "true";
  }

  pause() {
    settingsRepository.set("parser.paused", "true");
  }

  resume() {
    settingsRepository.set("parser.paused", "false");
  }

  getStatus(ownerUserId: number): ParserStatus {
    const keywords = keywordsRepository.listEnabled(ownerUserId);

    return {
      paused: this.isPaused(),
      includeKeywords: keywords.filter((item) => item.type === "include").length,
      excludeKeywords: keywords.filter((item) => item.type === "exclude").length,
      trackedChannels: channelsRepository.listEnabled(ownerUserId).length,
      totalMatches: matchesRepository.countMatches(ownerUserId),
    };
  }

  async ingestMessage(message: ParserInputMessage) {
    const normalized = normalizeText(message.text);
    const hash = createHash("sha256").update(normalized).digest("hex");
    const rawRecord = matchesRepository.saveRawMessage({ ...message, hash });

    if (!rawRecord || this.isPaused() || !normalized) {
      return null;
    }

    const result = matchKeywords(normalized, keywordsRepository.listEnabled(message.ownerUserId));

    if (!result.matched) {
      return null;
    }

    const match = matchesRepository.createMatch(message.ownerUserId, rawRecord.id, result.includeMatches);

    if (match && this.notifier) {
      await this.notifier(match);
    }

    return match;
  }
}

export const parserService = new ParserService();
