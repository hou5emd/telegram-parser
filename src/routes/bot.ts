import { Elysia } from "elysia";

import { env } from "../config/env";

export const botRoutes = new Elysia().post(env.botWebhookPath, async ({ body, request }) => {
  const { botService } = await import("../runtime");

  await botService.handleWebhook(body, request.headers.get("x-telegram-bot-api-secret-token"));

  return { ok: true };
});
