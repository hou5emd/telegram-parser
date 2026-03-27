import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env";
import type { AdminIdentity } from "../types/domain";

interface TelegramWebAppUser {
  id: number;
  username?: string;
  first_name?: string;
}

export class WebAppAuthService {
  private isLocalBypassRequest(request: Request) {
    const { hostname } = new URL(request.url);

    return hostname === "localhost" || hostname === "127.0.0.1";
  }

  private validateHash(initData: string) {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash || !env.botToken) {
      return false;
    }

    const entries = [...params.entries()]
      .filter(([key]) => key !== "hash")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secret = createHmac("sha256", "WebAppData").update(env.botToken).digest();
    const calculated = createHmac("sha256", secret).update(entries).digest();
    const provided = Buffer.from(hash, "hex");

    return calculated.length === provided.length && timingSafeEqual(calculated, provided);
  }

  getDebugInfo(request: Request) {
    const initData = request.headers.get("x-telegram-init-data");
    const allowDevBypass = this.isLocalBypassRequest(request);
    const params = new URLSearchParams(initData || "");
    const rawUser = params.get("user");

    let parsedUser: TelegramWebAppUser | null = null;

    try {
      parsedUser = rawUser ? (JSON.parse(rawUser) as TelegramWebAppUser) : null;
    } catch {
      parsedUser = null;
    }

    return {
      hasInitData: Boolean(initData),
      initDataLength: initData?.length ?? 0,
      hasHash: Boolean(params.get("hash")),
      hashValid: initData ? this.validateHash(initData) : false,
      hasBotToken: Boolean(env.botToken),
      devBypassEnabled: env.devBypassWebAppAuth,
      devBypassAllowedForRequest: allowDevBypass,
      requestUrl: request.url,
      telegramUserIdFromInitData: parsedUser?.id ?? null,
      usernameFromInitData: parsedUser?.username ?? null,
      authDate: params.get("auth_date"),
      queryId: params.get("query_id"),
    };
  }

  authorizeInitData(initData?: string | null, allowDevBypass = false): AdminIdentity {
    if ((!initData || !env.botToken) && env.devBypassWebAppAuth && allowDevBypass) {
      return {
        telegramUserId: env.adminTelegramUserId,
        source: "dev-bypass",
        isAdmin: true,
      };
    }

    if (!initData || !this.validateHash(initData)) {
      throw new Error("Unauthorized web app request");
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get("user") || "null") as TelegramWebAppUser | null;

    if (!user?.id) {
      throw new Error("Web app user payload is missing");
    }

    return {
      telegramUserId: user.id,
      source: "telegram-webapp",
      username: user.username,
      firstName: user.first_name,
      isAdmin: Boolean(env.adminTelegramUserId && user.id === env.adminTelegramUserId),
    };
  }

  authorizeRequest(request: Request) {
    return this.authorizeInitData(request.headers.get("x-telegram-init-data"), this.isLocalBypassRequest(request));
  }
}

export const webAppAuthService = new WebAppAuthService();
