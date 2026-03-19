const sanitizeString = (value: unknown, maxLength = 128) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
};

export interface TelegramUser {
  first_name?: string;
  id: string;
  last_name?: string;
  photo_url?: string;
  username?: string;
}

export const normalizeTelegramUser = (value: unknown): TelegramUser | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = raw.id;

  if (typeof id !== "string" && typeof id !== "number") {
    return null;
  }

  return {
    first_name: sanitizeString(raw.first_name, 64),
    id: String(id),
    last_name: sanitizeString(raw.last_name, 64),
    photo_url: sanitizeString(raw.photo_url, 512),
    username: sanitizeString(raw.username, 64)
  };
};
