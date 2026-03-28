import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import type { KeywordRule, ListResponse } from "../../../shared/types/api";

export class KeywordsStore {
  items: KeywordRule[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get includeItems() {
    return this.items.filter((item) => item.type === "include");
  }

  get excludeItems() {
    return this.items.filter((item) => item.type === "exclude");
  }

  async load() {
    this.isLoading = true;

    try {
      const response = await apiClient.request<ListResponse<KeywordRule>>("/api/keywords");
      this.items = response.items;
    } finally {
      this.isLoading = false;
    }
  }

  async add(type: "include" | "exclude", value: string) {
    await apiClient.request("/api/keywords", {
      method: "POST",
      body: JSON.stringify({ type, value }),
    });
    await this.load();
  }

  async remove(id: number) {
    await apiClient.request(`/api/keywords/${id}`, { method: "DELETE" });
    await this.load();
  }
}
