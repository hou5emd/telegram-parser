import { Elysia } from "elysia";

import { channelsRepository } from "../storage/channels-repository";
import { matchesRepository } from "../storage/matches-repository";

export const systemRoutes = new Elysia()
  .get(
    "/",
    () => ({
      message: "Vacancy parser API is running",
      webApp: "/app",
      docs: "/openapi",
    }),
    {
      detail: {
        summary: "Welcome route",
        tags: ["system"],
      },
    }
  )
  .get(
    "/health",
    () => ({
      status: "ok",
      trackedChannels: channelsRepository.listEnabled().length,
      rawMessages: matchesRepository.countRawMessages(),
      matches: matchesRepository.countMatches(),
    }),
    {
      detail: {
        summary: "Health check",
        tags: ["system"],
      },
    }
  )
  .get(
    "/ready",
    () => ({
      status: "ready",
    }),
    {
      detail: {
        summary: "Readiness check",
        tags: ["system"],
      },
    }
  );
