# vacancy_parser

A single-admin Telegram vacancy parser built with `Bun`, `Elysia`, `GramJS`, `Telegraf`, and SQLite.

What it does:

- opens a Telegram mini app from the admin bot
- signs in a Telegram user session with GramJS
- tracks selected channels as a Telegram client
- filters messages by include/exclude keywords
- forwards matched vacancies back through the bot

## Setup

```bash
bun install
cp .env.example .env
```

Before the real Telegram flow, set at least:

- `ADMIN_TELEGRAM_USER_ID`
- `BOT_TOKEN`
- `APP_PUBLIC_URL`

For local browser development without Telegram Web App auth:

```bash
DEV_BYPASS_WEBAPP_AUTH=true
```

## Run

```bash
bun run dev
```

or

```bash
bun run start
```

## Main routes

- `GET /` - service entrypoint
- `GET /health` - health check
- `GET /ready` - readiness check
- `GET /openapi` - API docs
- `GET /app` - Telegram mini app admin panel

## Admin API

- `POST /api/auth/webapp/validate`
- `GET /api/status`
- `GET /api/telegram/session/status`
- `POST /api/telegram/session/start`
- `POST /api/telegram/session/complete-code`
- `POST /api/telegram/session/complete-password`
- `GET /api/channels`
- `POST /api/channels`
- `POST /api/channels/:id/backfill`
- `GET /api/keywords`
- `POST /api/keywords`
- `GET /api/matches`
- `POST /api/parser/pause`
- `POST /api/parser/resume`

## Environment variables

- `PORT` - server port, default `3000`
- `HOST` - bind hostname, default `0.0.0.0`
- `NODE_ENV` - environment label, default `development`
- `APP_PUBLIC_URL` - public HTTPS URL used by the bot mini app button
- `DATABASE_PATH` - SQLite file path
- `ADMIN_TELEGRAM_USER_ID` - only this Telegram user can access admin tools
- `DEV_BYPASS_WEBAPP_AUTH` - local development bypass for `/app`
- `BOT_TOKEN` - Telegram bot token for mini app and notifications
- `BOT_MODE` - `polling` or `webhook`
- `BOT_WEBHOOK_PATH` - webhook endpoint path
- `BOT_WEBHOOK_SECRET` - optional webhook secret header value
- `TELEGRAM_API_ID` - Telegram application API ID
- `TELEGRAM_API_HASH` - Telegram application API hash
- `TELEGRAM_SESSION` - saved GramJS string session
- `TELEGRAM_PHONE` - optional initial phone value
- `PARSER_AUTO_START` - auto-restore Telegram session on boot
- `KEYWORDS_INCLUDE` - initial include keywords CSV
- `KEYWORDS_EXCLUDE` - initial exclude keywords CSV

Telegram API credentials are created at `https://my.telegram.org` -> `API development tools`.

## Project structure

- `index.ts` - application entrypoint
- `src/config/env.ts` - environment config
- `src/app.ts` - Elysia app setup and plugins
- `src/routes/admin.ts` - admin API routes
- `src/routes/system.ts` - public system routes
- `src/routes/webapp.ts` - mini app assets
- `src/telegram/telegram-client-service.ts` - GramJS login and channel ingestion
- `src/bot/bot-service.ts` - Telegraf bot commands and notifications
- `src/parser/*` - normalization and keyword matching
- `src/storage/*` - SQLite schema and repositories
- `src/webapp/*` - mini app frontend

## Docker

```bash
docker compose up --build
```

The compose setup mounts `./data` into the container so the SQLite database survives restarts.

Notes:

- a newly added channel now runs an automatic recent-message backfill, so existing posts can appear in `matches` immediately
- live parsing still works for new incoming channel posts after the channel is tracked
