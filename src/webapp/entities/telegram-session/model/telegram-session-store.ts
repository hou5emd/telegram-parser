import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import type { TelegramSessionStatus } from "../../../shared/types/api";

export class TelegramSessionStore {
  status: TelegramSessionStatus | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthorized() {
    return Boolean(this.status?.authorized);
  }

  async load() {
    this.isLoading = true;

    try {
      this.status = await apiClient.request<TelegramSessionStatus>("/api/telegram/session/status");
    } finally {
      this.isLoading = false;
    }
  }

  async startLogin(phoneNumber: string) {
    await apiClient.request("/api/telegram/session/start", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
    await this.load();
  }

  async submitCode(code: string) {
    await apiClient.request("/api/telegram/session/complete-code", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    await this.load();
  }

  async submitPassword(password: string) {
    await apiClient.request("/api/telegram/session/complete-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    await this.load();
  }
}
