import { makeAutoObservable } from "mobx";

import { AuthStore } from "../../entities/auth/model/auth-store";
import { ChannelsStore } from "../../entities/channel/model/channels-store";
import { KeywordsStore } from "../../entities/keyword/model/keywords-store";
import { MatchesStore } from "../../entities/match/model/matches-store";
import { ParserStore } from "../../entities/parser/model/parser-store";
import { TelegramSessionStore } from "../../entities/telegram-session/model/telegram-session-store";
import { ToastStore } from "../../shared/model/toast-store";
import { initializeTelegramWebApp } from "../../shared/lib/telegram";

export class RootStore {
  readonly toastStore = new ToastStore();
  readonly authStore = new AuthStore();
  readonly parserStore = new ParserStore();
  readonly telegramSessionStore = new TelegramSessionStore();
  readonly channelsStore = new ChannelsStore();
  readonly keywordsStore = new KeywordsStore();
  readonly matchesStore = new MatchesStore();

  isReady = false;
  isRefreshing = false;
  private initializePromise: Promise<void> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      initializeTelegramWebApp();

      try {
        await this.refreshDashboard();
        this.isReady = true;
      } catch (error) {
        this.toastStore.showError(error);
      }
    })();

    return this.initializePromise;
  }

  async refreshDashboard() {
    this.isRefreshing = true;

    try {
      const results = await Promise.allSettled([
        this.authStore.load(),
        this.parserStore.load(),
        this.telegramSessionStore.load(),
        this.channelsStore.load(),
        this.keywordsStore.load(),
        this.matchesStore.load(),
      ]);

      const rejected = results.find((result) => result.status === "rejected");

      if (rejected?.status === "rejected") {
        throw rejected.reason;
      }
    } finally {
      this.isRefreshing = false;
    }
  }
}
