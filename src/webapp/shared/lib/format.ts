export const formatIdentityMessage = (telegramUserId: number | null, isAdmin?: boolean) => {
  if (!telegramUserId) {
    return "Authorized in development bypass mode.";
  }

  return `Authorized as Telegram user ${telegramUserId}${isAdmin ? " (admin)" : ""}.`;
};

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
