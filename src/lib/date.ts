const NUMERIC_DATE_PATTERN = /^\d+$/;
const UNIX_SECONDS_THRESHOLD = 1_000_000_000_000;

export const parseDateValue = (value: string | number | Date | null | undefined) => {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const normalizedValue = value < UNIX_SECONDS_THRESHOLD ? value * 1000 : value;
    const date = new Date(normalizedValue);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (NUMERIC_DATE_PATTERN.test(trimmedValue)) {
    return parseDateValue(Number(trimmedValue));
  }

  const date = new Date(trimmedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};
