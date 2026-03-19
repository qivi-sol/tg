import { normalizeTelegramUser, type TelegramUser } from "./telegram-user.ts";

const encoder = new TextEncoder();

const toBytes = (value: string | Uint8Array) =>
  typeof value === "string" ? encoder.encode(value) : value;

const hmacSha256 = async (key: string | Uint8Array, message: string | Uint8Array) => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBytes(key),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, toBytes(message))
  );
};

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

interface TelegramValidationResult {
  authDate: number;
  startParam: string | null;
  user: TelegramUser | null;
}

export const validateTelegramInitData = async (
  initData: string,
  botToken: string
): Promise<TelegramValidationResult> => {
  // Production note:
  // This HMAC verification must always happen on the server with the real bot token.
  // The client should never be trusted to provide a raw telegram_id on its own.
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Telegram hash is missing.");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = await hmacSha256("WebAppData", botToken);
  const computedHash = toHex(await hmacSha256(secret, dataCheckString));

  if (computedHash !== hash) {
    throw new Error("Telegram init data validation failed.");
  }

  const authDate = Number(params.get("auth_date") ?? "0");

  if (!authDate || Number.isNaN(authDate)) {
    throw new Error("Telegram auth_date is missing.");
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;

  if (ageSeconds > 60 * 10) {
    throw new Error("Telegram init data is too old.");
  }

  const userJson = params.get("user");
  const parsedUser = userJson ? normalizeTelegramUser(JSON.parse(userJson)) : null;

  if (userJson && !parsedUser) {
    throw new Error("Telegram user payload is malformed.");
  }

  return {
    authDate,
    startParam: params.get("start_param"),
    user: parsedUser
  };
};
