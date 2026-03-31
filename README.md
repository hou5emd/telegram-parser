# telegram_parser

EN | [RU](#ru)

A Telegram parser built with `Bun`, `Elysia`, `React`, `MobX`, `GramJS`, `Telegraf`, `Drizzle ORM`, and SQLite.

This 💩 code was developed jointly with OpenAI Codex.

## EN

### What it does

- opens a Telegram mini app from the bot
- signs in a separate Telegram user session for each Telegram user with GramJS
- lets each Telegram user manage their own tracked channels
- lets each Telegram user manage their own include/exclude keywords
- forwards matched messages back through the bot to the owning user

### Setup

```bash
bun install
cp .env.example .env
```

Before the real Telegram flow, set at least:

- `ADMIN_TELEGRAM_USER_ID`
- `BOT_TOKEN`
- `APP_PUBLIC_URL`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`

### Run

Development mode builds the React mini app into `dist/webapp`, watches it for changes, and runs the Bun server in parallel.

```bash
bun run dev
```

Production-style start builds the mini app once and then launches the server.

```bash
bun run start
```

If you only want to rebuild the frontend bundle manually:

```bash
bun run build:webapp
```

### Main routes

- `GET /` - service entrypoint
- `GET /health` - health check
- `GET /ready` - readiness check
- `GET /openapi` - API docs
- `GET /app` - Telegram mini app admin panel
- `GET /app/*` - built mini app assets

### Admin API

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

### Environment variables

- `PORT` - server port, default `3000`
- `HOST` - bind hostname, default `0.0.0.0`
- `NODE_ENV` - environment label, default `development`
- `APP_PUBLIC_URL` - public HTTPS URL used by the bot mini app button
- `DATABASE_PATH` - SQLite file path
- `ADMIN_TELEGRAM_USER_ID` - only this Telegram user can access admin tools
- `BOT_TOKEN` - Telegram bot token for mini app and notifications
- `BOT_MODE` - `polling` or `webhook`
- `BOT_WEBHOOK_PATH` - webhook endpoint path
- `BOT_WEBHOOK_SECRET` - webhook secret header value
- `TELEGRAM_API_ID` - Telegram application API ID
- `TELEGRAM_API_HASH` - Telegram application API hash
- `PARSER_AUTO_START` - auto-restore Telegram session on boot

Telegram API credentials are created at `https://my.telegram.org` -> `API development tools`.

The current `.env` in this project contains the variables listed above. Keep `.env.example` in sync with that file when configuration changes.

### Project structure

- `index.ts` - root bootstrap file that initializes runtime and starts the Elysia server
- `src/runtime.ts` - runtime initialization for bot, parser notifier, Telegram client, and storage bootstrap
- `src/config/env.ts` - environment config
- `src/app.ts` - Elysia app setup and plugins
- `src/routes/admin.ts` - admin API routes
- `src/routes/bot.ts` - Telegram bot webhook route
- `src/routes/system.ts` - public system routes
- `src/routes/webapp.ts` - built mini app asset delivery under `/app`
- `src/telegram/telegram-client-service.ts` - GramJS login and channel ingestion
- `src/bot/bot-service.ts` - Telegraf bot commands and notifications
- `src/parser/*` - parser state, normalization, and keyword matching
- `src/storage/*` - SQLite bootstrap, schema, and repositories
- `src/auth/webapp-auth-service.ts` - Telegram Web App auth validation
- `src/types/domain.ts` - shared backend domain types
- `src/lib/*` - shared utility helpers and tests
- `drizzle.config.ts` - Drizzle Kit config for schema and migrations
- `src/webapp/*` - React mini app source code
- `dist/webapp/*` - generated frontend assets served by Elysia

### Frontend notes

- the mini app source lives in `src/webapp/`
- the current frontend structure includes `app`, `entities`, `features`, `pages`, `shared`, and `widgets`
- the React entrypoints are `src/webapp/index.html` and `src/webapp/main.tsx`
- Bun builds the frontend into `dist/webapp` with asset URLs scoped to `/app/`
- `src/routes/webapp.ts` serves `index.html` for `/app` and static bundle files for `/app/*`

### Docker

```bash
docker compose up --build
```

The compose setup mounts `./data` into the container so the SQLite database survives restarts.

Notes:

- a newly added channel runs an automatic recent-message backfill, so existing posts can appear in `matches` immediately
- live parsing still works for new incoming channel posts after the channel is tracked

---

## RU

Описание проекта на русском.

Этот 💩 код написан совместно с OpenAI Codex.

### Что делает проект

- открывает Telegram mini app из бота
- авторизует отдельную Telegram-сессию для каждого пользователя через GramJS
- позволяет каждому пользователю управлять своим списком отслеживаемых каналов
- позволяет каждому пользователю управлять своими include/exclude ключевыми словами
- отправляет найденные совпадения обратно пользователю через бота

### Установка

```bash
bun install
cp .env.example .env
```

Перед полноценным запуском Telegram-сценария задайте как минимум:

- `ADMIN_TELEGRAM_USER_ID`
- `BOT_TOKEN`
- `APP_PUBLIC_URL`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`

### Запуск

В режиме разработки React mini app собирается в `dist/webapp`, пересобирается при изменениях, а Bun-сервер запускается параллельно.

```bash
bun run dev
```

Продакшен-запуск один раз собирает mini app и затем поднимает сервер.

```bash
bun run start
```

Если нужно только вручную пересобрать фронтенд:

```bash
bun run build:webapp
```

### Основные маршруты

- `GET /` - точка входа сервиса
- `GET /health` - health check
- `GET /ready` - readiness check
- `GET /openapi` - документация API
- `GET /app` - админ-панель Telegram mini app
- `GET /app/*` - собранные ассеты mini app

### Admin API

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

### Переменные окружения

- `PORT` - порт сервера, по умолчанию `3000`
- `HOST` - hostname для биндинга, по умолчанию `0.0.0.0`
- `NODE_ENV` - метка окружения, по умолчанию `development`
- `APP_PUBLIC_URL` - публичный HTTPS URL, который бот использует для кнопки mini app
- `DATABASE_PATH` - путь к файлу SQLite
- `ADMIN_TELEGRAM_USER_ID` - только этот Telegram-пользователь имеет доступ к админ-инструментам
- `BOT_TOKEN` - токен Telegram-бота для mini app и уведомлений
- `BOT_MODE` - `polling` или `webhook`
- `BOT_WEBHOOK_PATH` - путь webhook endpoint
- `BOT_WEBHOOK_SECRET` - значение секретного заголовка webhook
- `TELEGRAM_API_ID` - API ID Telegram-приложения
- `TELEGRAM_API_HASH` - API hash Telegram-приложения
- `PARSER_AUTO_START` - автоматически восстанавливать Telegram-сессию при старте

Telegram API credentials создаются в `https://my.telegram.org` -> `API development tools`.

Текущий `.env` в проекте содержит именно этот набор переменных. При изменении конфигурации синхронизируйте с ним `.env.example`.

### Структура проекта

- `index.ts` - корневой bootstrap-файл, который инициализирует runtime и запускает Elysia-сервер
- `src/runtime.ts` - инициализация runtime для бота, parser notifier, Telegram-клиента и bootstrap storage
- `src/config/env.ts` - конфигурация окружения
- `src/app.ts` - настройка Elysia-приложения и плагинов
- `src/routes/admin.ts` - маршруты admin API
- `src/routes/bot.ts` - webhook-маршрут Telegram-бота
- `src/routes/system.ts` - публичные системные маршруты
- `src/routes/webapp.ts` - выдача собранных ассетов mini app по `/app`
- `src/telegram/telegram-client-service.ts` - вход через GramJS и загрузка сообщений из каналов
- `src/bot/bot-service.ts` - команды Telegraf-бота и уведомления
- `src/parser/*` - состояние парсера, нормализация и сопоставление по ключевым словам
- `src/storage/*` - bootstrap, SQLite-схема и репозитории
- `src/auth/webapp-auth-service.ts` - валидация Telegram Web App auth
- `src/types/domain.ts` - общие доменные типы backend-части
- `src/lib/*` - общие утилиты и тесты
- `drizzle.config.ts` - конфигурация Drizzle Kit для схемы и миграций
- `src/webapp/*` - исходники React mini app
- `dist/webapp/*` - собранные фронтенд-ассеты, которые раздаёт Elysia

### Заметки по фронтенду

- исходники mini app лежат в `src/webapp/`
- в текущей фронтенд-структуре есть каталоги `app`, `entities`, `features`, `pages`, `shared` и `widgets`
- React entrypoints: `src/webapp/index.html` и `src/webapp/main.tsx`
- Bun собирает фронтенд в `dist/webapp`, а URL ассетов ограничены префиксом `/app/`
- `src/routes/webapp.ts` отдаёт `index.html` для `/app` и статические файлы для `/app/*`

### Docker

```bash
docker compose up --build
```

`docker compose` монтирует `./data` в контейнер, поэтому SQLite-база сохраняется между перезапусками.

Примечания:

- при добавлении нового канала автоматически запускается backfill последних сообщений, поэтому существующие посты могут сразу появиться в `matches`
- после подключения канала парсинг новых входящих сообщений продолжает работать в реальном времени
