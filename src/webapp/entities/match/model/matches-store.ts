import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import type { ListResponse, MatchRecord } from "../../../shared/types/api";

export class MatchesStore {
  items: MatchRecord[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async load(limit = 20) {
    this.isLoading = true;

    try {
      const response = await apiClient.request<ListResponse<MatchRecord>>(`/api/matches?limit=${limit}`);
      this.items = response.items;
    } finally {
      this.isLoading = false;
    }
  }
}
