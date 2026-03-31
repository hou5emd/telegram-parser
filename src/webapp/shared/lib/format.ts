import { parseDateValue } from "../../../lib/date";
import type { AuthState } from "../../entities/auth/model/auth-store";

export const formatIdentityMessage = (telegramUserId: number | null, isAdmin?: boolean) => {
  if (!telegramUserId) {
    return "Авторизация выполнена через dev-bypass.";
  }

  return `Авторизован как пользователь Telegram ${telegramUserId}${isAdmin ? " (админ)" : ""}.`;
};

export const formatAuthTitle = (authState: AuthState) => {
  switch (authState) {
    case "checking":
      return "Проверяем доступ";
    case "authorized-admin":
      return "Доступ разрешён";
    case "authorized-non-admin":
      return "Доступ запрещён";
    case "unauthorized":
      return "Откройте в Telegram";
  }
};

export const formatAuthStateLabel = (authState: AuthState, source?: string) => {
  if (authState === "authorized-admin" && source) {
    return source;
  }

  switch (authState) {
    case "checking":
      return "Проверка";
    case "authorized-admin":
      return "Авторизован";
    case "authorized-non-admin":
      return "Не админ";
    case "unauthorized":
      return "Нужен Telegram";
  }
};

export const formatAuthDescription = (authState: AuthState, errorMessage?: string | null) => {
  switch (authState) {
    case "checking":
      return "Ждём контекст Telegram Web App и проверяем ваш доступ администратора.";
    case "authorized-admin":
      return "Личность в Telegram подтверждена. Панель администратора готова к загрузке.";
    case "authorized-non-admin":
      return "Ваш аккаунт Telegram распознан, но у него нет админского доступа к этой панели.";
    case "unauthorized":
      return errorMessage || "Для этой сессии отсутствуют или некорректны данные Telegram mini app.";
  }
};

export const formatAuthActionMessage = (authState: AuthState) => {
  switch (authState) {
    case "checking":
      return "Если экран не меняется, заново откройте mini app из Telegram и дождитесь полной загрузки веб-приложения.";
    case "authorized-admin":
      return "Загружаем дашборд с вашими каналами, ключевыми словами, статусом парсера и Telegram-сессией.";
    case "authorized-non-admin":
      return "Попросите владельца панели назначить ваш Telegram-аккаунт администратором и затем откройте mini app заново.";
    case "unauthorized":
      return "Откройте эту страницу из Telegram mini app, а не в обычной вкладке браузера, чтобы к запросам прикладывались init data.";
  }
};

export const formatAuthIdentityHint = (telegramUserId: number | null, username?: string, firstName?: string) => {
  const base = formatIdentityMessage(telegramUserId);

  if (username) {
    return `${base} Вход выполнен как @${username}.`;
  }

  if (firstName) {
    return `${base} Вход выполнен как ${firstName}.`;
  }

  return base;
};

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Дата неизвестна";
  }

  const date = parseDateValue(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
