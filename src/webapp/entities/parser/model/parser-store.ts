import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import type { StatusResponse } from "../../../shared/types/api";

export class ParserStore {
  status: StatusResponse | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async load() {
    this.isLoading = true;

    try {
      this.status = await apiClient.request<StatusResponse>("/api/status");
    } finally {
      this.isLoading = false;
    }
  }

  async pause() {
    await apiClient.request("/api/parser/pause", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await this.load();
  }

  async resume() {
    await apiClient.request("/api/parser/resume", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await this.load();
  }
}
