import { getTelegramInitData } from "../lib/telegram";

export class ApiClient {
  async request<T>(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    const initData = getTelegramInitData();

    if (initData) {
      headers.set("x-telegram-init-data", initData);
    }

    if (options.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error((payload as { message?: string })?.message || String(payload) || `Request failed: ${response.status}`);
    }

    return payload as T;
  }
}

export const apiClient = new ApiClient();
