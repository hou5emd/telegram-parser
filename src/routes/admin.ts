import { Elysia, t } from "elysia";

import { webAppAuthService } from "../auth/webapp-auth-service";
import { env } from "../config/env";
import { parserService } from "../parser/parser-service";
import { channelsRepository } from "../storage/channels-repository";
import { keywordsRepository } from "../storage/keywords-repository";
import { matchesRepository } from "../storage/matches-repository";
import { telegramClientService } from "../telegram/telegram-client-service";

const requireAdmin = (request: Request) => webAppAuthService.authorizeRequest(request);

export const adminRoutes = new Elysia({ prefix: "/api" })
  .onError(({ code, error, set }) => {
    set.status = code === "VALIDATION" ? 400 : 400;
    return { message: error instanceof Error ? error.message : String(error) };
  })
  .get(
    "/status",
    ({ request }) => {
      requireAdmin(request);

      return {
        parser: parserService.getStatus(),
        telegram: telegramClientService.getStatus(),
        bot: {
          configured: Boolean(env.botToken),
          mode: env.botMode,
        },
      };
    },
    {
      detail: {
        summary: "Admin dashboard status",
        tags: ["admin"],
      },
    }
  )
  .post(
    "/auth/webapp/validate",
    ({ request }) => ({ identity: requireAdmin(request) }),
    {
      detail: {
        summary: "Validate Telegram mini app identity",
        tags: ["admin"],
      },
    }
  )
  .get(
    "/telegram/session/status",
    ({ request }) => {
      requireAdmin(request);
      return telegramClientService.getStatus();
    },
    {
      detail: {
        summary: "Telegram user session status",
        tags: ["telegram"],
      },
    }
  )
  .post(
    "/telegram/session/start",
    async ({ body, request }) => {
      requireAdmin(request);
      return telegramClientService.startLogin(body);
    },
    {
      body: t.Object({
        apiId: t.Number(),
        apiHash: t.String({ minLength: 8 }),
        phoneNumber: t.String({ minLength: 5 }),
      }),
      detail: {
        summary: "Start Telegram login flow",
        tags: ["telegram"],
      },
    }
  )
  .post(
    "/telegram/session/complete-code",
    async ({ body, request }) => {
      requireAdmin(request);
      return telegramClientService.completeCode(body.code);
    },
    {
      body: t.Object({ code: t.String({ minLength: 2 }) }),
      detail: {
        summary: "Submit Telegram login code",
        tags: ["telegram"],
      },
    }
  )
  .post(
    "/telegram/session/complete-password",
    async ({ body, request }) => {
      requireAdmin(request);
      return telegramClientService.completePassword(body.password);
    },
    {
      body: t.Object({ password: t.String({ minLength: 1 }) }),
      detail: {
        summary: "Submit Telegram 2FA password",
        tags: ["telegram"],
      },
    }
  )
  .get(
    "/channels",
    ({ request }) => {
      requireAdmin(request);
      return { items: channelsRepository.list() };
    },
    {
      detail: {
        summary: "List tracked channels",
        tags: ["channels"],
      },
    }
  )
  .post(
    "/channels",
    async ({ body, request }) => {
      requireAdmin(request);
      return telegramClientService.addChannelWithBackfill(body.identifier, body.backfillLimit ?? 20);
    },
    {
      body: t.Object({
        identifier: t.String({ minLength: 2 }),
        backfillLimit: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
      }),
      detail: {
        summary: "Add tracked Telegram channel",
        tags: ["channels"],
      },
    }
  )
  .delete(
    "/channels/:id",
    ({ params, request, set }) => {
      requireAdmin(request);
      channelsRepository.remove(Number(params.id));
      set.status = 204;
    },
    {
      detail: {
        summary: "Remove tracked channel",
        tags: ["channels"],
      },
    }
  )
  .post(
    "/channels/:id/backfill",
    async ({ params, body, request }) => {
      requireAdmin(request);
      return telegramClientService.backfillChannel(Number(params.id), body.limit ?? 25);
    },
    {
      body: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
      }),
      detail: {
        summary: "Backfill recent messages for a tracked channel",
        tags: ["channels"],
      },
    }
  )
  .get(
    "/keywords",
    ({ request }) => {
      requireAdmin(request);
      return { items: keywordsRepository.list() };
    },
    {
      detail: {
        summary: "List keyword rules",
        tags: ["keywords"],
      },
    }
  )
  .post(
    "/keywords",
    ({ body, request }) => {
      requireAdmin(request);
      return keywordsRepository.add(body.type, body.value);
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("include"), t.Literal("exclude")]),
        value: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: "Add keyword rule",
        tags: ["keywords"],
      },
    }
  )
  .delete(
    "/keywords/:id",
    ({ params, request, set }) => {
      requireAdmin(request);
      keywordsRepository.remove(Number(params.id));
      set.status = 204;
    },
    {
      detail: {
        summary: "Delete keyword rule",
        tags: ["keywords"],
      },
    }
  )
  .get(
    "/matches",
    ({ query, request }) => {
      requireAdmin(request);
      return { items: matchesRepository.list(Number(query.limit ?? 20)) };
    },
    {
      query: t.Object({ limit: t.Optional(t.Numeric()) }),
      detail: {
        summary: "List matched vacancies",
        tags: ["matches"],
      },
    }
  )
  .post(
    "/parser/pause",
    ({ request }) => {
      requireAdmin(request);
      parserService.pause();
      return { paused: true };
    },
    {
      detail: {
        summary: "Pause parser",
        tags: ["parser"],
      },
    }
  )
  .post(
    "/parser/resume",
    ({ request }) => {
      requireAdmin(request);
      parserService.resume();
      return { paused: false };
    },
    {
      detail: {
        summary: "Resume parser",
        tags: ["parser"],
      },
    }
  );
