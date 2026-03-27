import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env";
import type { AdminIdentity } from "../types/domain";

interface TelegramWebAppUser {
  id: number;
  username?: string;
  first_name?: string;
}

export class WebAppAuthService {
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

  authorizeInitData(initData?: string | null): AdminIdentity {
    if ((!initData || !env.botToken) && env.devBypassWebAppAuth) {
      return {
        telegramUserId: env.adminTelegramUserId,
        source: "dev-bypass",
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

    if (env.adminTelegramUserId && user.id !== env.adminTelegramUserId) {
      throw new Error("This Telegram user is not allowed to access the admin UI");
    }

    return {
      telegramUserId: user.id,
      source: "telegram-webapp",
      username: user.username,
      firstName: user.first_name,
    };
  }

  authorizeRequest(request: Request) {
    return this.authorizeInitData(request.headers.get("x-telegram-init-data"));
  }
}

export const webAppAuthService = new WebAppAuthService();
