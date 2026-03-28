import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import { getLocalDebugInfo } from "../../../shared/lib/telegram";
import type { AdminIdentity, AuthDebugResponse, AuthValidateResponse } from "../../../shared/types/api";

export class AuthStore {
  identity: AdminIdentity | null = null;
  debugInfo: Record<string, unknown> | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async load() {
    this.isLoading = true;

    try {
      const [auth, debug] = await Promise.all([
        apiClient.request<AuthValidateResponse>("/api/auth/webapp/validate", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        apiClient.request<AuthDebugResponse>("/api/auth/debug"),
      ]);

      this.identity = auth.identity;
      this.debugInfo = {
        client: getLocalDebugInfo(),
        server: debug.debug,
      };
    } finally {
      this.isLoading = false;
    }
  }
}
