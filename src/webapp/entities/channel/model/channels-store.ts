import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import type { ListResponse, TrackedChannel } from "../../../shared/types/api";

export class ChannelsStore {
  items: TrackedChannel[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async load() {
    this.isLoading = true;

    try {
      const response = await apiClient.request<ListResponse<TrackedChannel>>("/api/channels");
      this.items = response.items;
    } finally {
      this.isLoading = false;
    }
  }

  async add(identifier: string) {
    await apiClient.request("/api/channels", {
      method: "POST",
      body: JSON.stringify({ identifier, backfillLimit: 20 }),
    });
    await this.load();
  }

  async remove(id: number) {
    await apiClient.request(`/api/channels/${id}`, { method: "DELETE" });
    await this.load();
  }

  async backfill(id: number) {
    await apiClient.request(`/api/channels/${id}/backfill`, {
      method: "POST",
      body: JSON.stringify({ limit: 25 }),
    });
    await this.load();
  }
}
