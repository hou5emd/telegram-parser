const parsePort = (value: string | undefined, fallback: number) => {
  const port = Number(value);

  if (Number.isInteger(port) && port > 0) {
    return port;
  }

  return fallback;
};

const parseNumber = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value == null) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseCsv = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeMode = (value: string | undefined) => {
  if (value === "webhook") {
    return "webhook" as const;
  }

  return "polling" as const;
};

export const env = {
  port: parsePort(Bun.env.PORT, 3000),
  host: Bun.env.HOST || "0.0.0.0",
  nodeEnv: Bun.env.NODE_ENV || "development",
  appPublicUrl: Bun.env.APP_PUBLIC_URL || "",
  databasePath: Bun.env.DATABASE_PATH || "./data/app.sqlite",
  adminTelegramUserId: parseNumber(Bun.env.ADMIN_TELEGRAM_USER_ID),
  devBypassWebAppAuth: parseBoolean(Bun.env.DEV_BYPASS_WEBAPP_AUTH, false),
  botToken: Bun.env.BOT_TOKEN || "",
  botMode: normalizeMode(Bun.env.BOT_MODE),
  botWebhookPath: Bun.env.BOT_WEBHOOK_PATH || "/telegram/webhook",
  botWebhookSecret: Bun.env.BOT_WEBHOOK_SECRET || "",
  telegramApiId: parseNumber(Bun.env.TELEGRAM_API_ID),
  telegramApiHash: Bun.env.TELEGRAM_API_HASH || "",
  telegramSession: Bun.env.TELEGRAM_SESSION || "",
  telegramPhone: Bun.env.TELEGRAM_PHONE || "",
  telegramPassword: Bun.env.TELEGRAM_PASSWORD || "",
  parserAutoStart: parseBoolean(Bun.env.PARSER_AUTO_START, true),
  forwardChatId: Bun.env.FORWARD_CHAT_ID || "",
  initialIncludeKeywords: parseCsv(Bun.env.KEYWORDS_INCLUDE),
  initialExcludeKeywords: parseCsv(Bun.env.KEYWORDS_EXCLUDE),
} as const;
