import type { DevTelegramProfile, TelegramProfile } from "../types/game";

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

export const sanitizeTelegramProfile = (value: unknown): TelegramProfile | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = raw.id;

  if (typeof id !== "string" && typeof id !== "number") {
    return null;
  }

  return {
    id: String(id),
    first_name: sanitizeString(raw.first_name, 64),
    last_name: sanitizeString(raw.last_name, 64),
    photo_url: sanitizeString(raw.photo_url, 512),
    username: sanitizeString(raw.username, 64)
  };
};

export const createDevTelegramProfile = (input: {
  firstName: string;
  id: string;
  username: string;
}): DevTelegramProfile => ({
  first_name: input.firstName,
  id: input.id,
  isDev: true,
  photo_url: "",
  username: input.username
});
