import { makeAutoObservable } from "mobx";

import { apiClient } from "../../../shared/api/client";
import { getLocalDebugInfo } from "../../../shared/lib/telegram";
import type { AdminIdentity, AuthDebugResponse, AuthValidateResponse } from "../../../shared/types/api";

export type AuthState = "checking" | "authorized-admin" | "authorized-non-admin" | "unauthorized";

export class AuthStore {
  identity: AdminIdentity | null = null;
  debugInfo: Record<string, unknown> | null = null;
  errorMessage: string | null = null;
  isLoading = true;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthorized() {
    return Boolean(this.identity);
  }

  get isAdmin() {
    return Boolean(this.identity?.isAdmin);
  }

  get authState(): AuthState {
    if (this.isLoading) {
      return "checking";
    }

    if (this.isAdmin) {
      return "authorized-admin";
    }

    if (this.identity) {
      return "authorized-non-admin";
    }

    return "unauthorized";
  }

  async load() {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const [authResult, debugResult] = await Promise.allSettled([
        apiClient.request<AuthValidateResponse>("/api/auth/webapp/validate", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        apiClient.request<AuthDebugResponse>("/api/auth/debug"),
      ]);

      if (debugResult.status === "fulfilled") {
        this.debugInfo = {
          client: getLocalDebugInfo(),
          server: debugResult.value.debug,
        };
      } else {
        this.debugInfo = {
          client: getLocalDebugInfo(),
          serverError: debugResult.reason instanceof Error ? debugResult.reason.message : String(debugResult.reason),
        };
      }

      if (authResult.status === "fulfilled") {
        this.identity = authResult.value.identity;
        return;
      }

      this.identity = null;
      this.errorMessage = authResult.reason instanceof Error ? authResult.reason.message : String(authResult.reason);
    } finally {
      if (!this.debugInfo) {
        this.debugInfo = {
          client: getLocalDebugInfo(),
        };
      }

      this.isLoading = false;
    }
  }
}
