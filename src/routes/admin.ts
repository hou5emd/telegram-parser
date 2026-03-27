import { Elysia, t } from "elysia";

import { webAppAuthService } from "../auth/webapp-auth-service";
import { env } from "../config/env";
import { parserService } from "../parser/parser-service";
import { channelsRepository } from "../storage/channels-repository";
import { keywordsRepository } from "../storage/keywords-repository";
import { matchesRepository } from "../storage/matches-repository";
import { usersRepository } from "../storage/users-repository";
import { telegramClientService } from "../telegram/telegram-client-service";

const requireIdentity = (request: Request) => webAppAuthService.authorizeRequest(request);

const requireUser = (request: Request) => {
  const identity = requireIdentity(request);
  const user = usersRepository.ensureFromIdentity(identity);

  if (!user) {
    throw new Error("Could not resolve current user");
  }

  return { identity, user };
};

const requireAdmin = (request: Request) => {
  const { identity, user } = requireUser(request);

  if (!identity.isAdmin) {
    throw new Error("Admin access required");
  }

  return { identity, user };
};

export const adminRoutes = new Elysia({ prefix: "/api" })
  .onError(({ code, error, set }) => {
    const message = error instanceof Error ? error.message : String(error);

    if (code === "VALIDATION") {
      set.status = 400;
    } else if (message === "Admin access required") {
      set.status = 403;
    } else if (message.includes("Unauthorized")) {
      set.status = 401;
    } else {
      set.status = 400;
    }

    return { message };
  })
  .get(
    "/status",
    ({ request }) => {
      const { user } = requireUser(request);

      return {
        parser: parserService.getStatus(user.id),
        telegram: telegramClientService.getStatus(user.id),
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
    ({ request }) => {
      const { identity } = requireUser(request);
      return { identity };
    },
    {
      detail: {
        summary: "Validate Telegram mini app identity",
        tags: ["admin"],
      },
    }
  )
  .get(
    "/auth/debug",
    ({ request }) => ({
      debug: webAppAuthService.getDebugInfo(request),
    }),
    {
      detail: {
        summary: "Debug Telegram web app auth",
        tags: ["admin"],
      },
    }
  )
  .get(
    "/telegram/session/status",
    ({ request }) => {
      const { user } = requireUser(request);
      return telegramClientService.getStatus(user.id);
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
      const { user } = requireUser(request);
      return telegramClientService.startLogin(user.id, body);
    },
    {
      body: t.Object({
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
      const { user } = requireUser(request);
      return telegramClientService.completeCode(user.id, body.code);
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
      const { user } = requireUser(request);
      return telegramClientService.completePassword(user.id, body.password);
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
      const { user } = requireUser(request);
      return { items: channelsRepository.list(user.id) };
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
      const { user } = requireUser(request);
      return telegramClientService.addChannelWithBackfill(user.id, body.identifier, body.backfillLimit ?? 20);
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
      const { user } = requireUser(request);
      channelsRepository.remove(Number(params.id), user.id);
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
      const { user } = requireUser(request);
      return telegramClientService.backfillChannel(user.id, Number(params.id), body.limit ?? 25);
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
      const { user } = requireUser(request);
      return { items: keywordsRepository.list(user.id) };
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
      const { user } = requireUser(request);
      return keywordsRepository.add(user.id, body.type, body.value);
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
      const { user } = requireUser(request);
      keywordsRepository.remove(Number(params.id), user.id);
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
      const { user } = requireUser(request);
      return { items: matchesRepository.list(user.id, Number(query.limit ?? 20)) };
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
