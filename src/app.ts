import { Elysia } from "elysia";

import { adminRoutes } from "./routes/admin";
import { systemRoutes } from "./routes/system";
import { webAppRoutes } from "./routes/webapp";
import openapi from '@elysiajs/openapi';

export const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          title: "Vacancy Parser API",
          version: "0.1.0",
          description: "Elysia-based admin API for Telegram vacancy parsing with GramJS and a bot-driven mini app.",
        },
        tags: [
          { name: "system", description: "System endpoints" },
          { name: "admin", description: "Mini app admin auth and dashboard" },
          { name: "telegram", description: "Telegram user-session management" },
          { name: "channels", description: "Tracked Telegram channels" },
          { name: "keywords", description: "Keyword matching rules" },
          { name: "matches", description: "Matched vacancy feed" },
          { name: "parser", description: "Parser execution controls" },
        ],
      },
    })
  )
  .use(systemRoutes)
  .use(webAppRoutes)
  .use(adminRoutes);
