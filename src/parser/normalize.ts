export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[@#][\p{L}\p{N}_-]+/gu, " ")
    .replace(/[^\p{L}\p{N}\s+.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
