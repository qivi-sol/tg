import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "./database.types.ts";

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
  minimum = 1
) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }

  return parsed;
};

export const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const createServiceClient = () =>
  createClient<Database>(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

export const serverConfig = {
  adRewardCooldownMinutes: parsePositiveInt(
    Deno.env.get("AD_REWARD_COOLDOWN_MINUTES") ?? undefined,
    30
  ),
  adRewardKeys: parsePositiveInt(Deno.env.get("AD_REWARD_KEYS") ?? undefined, 1),
  appEnv: Deno.env.get("APP_ENV") ?? "development",
  dailyRewardCooldownHours: parsePositiveInt(
    Deno.env.get("DAILY_REWARD_COOLDOWN_HOURS") ?? undefined,
    24
  ),
  enableDevLogin: parseBoolean(Deno.env.get("ALLOW_DEV_LOGIN") ?? undefined, false),
  rapidTapCooldownMs: parsePositiveInt(
    Deno.env.get("RAPID_TAP_COOLDOWN_MS") ?? undefined,
    650,
    100
  ),
  telegramBotUsername: Deno.env.get("TELEGRAM_BOT_USERNAME") ?? "YOUR_BOT_USERNAME"
};

export const isProductionApp = () => serverConfig.appEnv === "production";

export const allowDevLogin = () => serverConfig.enableDevLogin && !isProductionApp();

export const getBotUsername = () => {
  const value = serverConfig.telegramBotUsername.trim();
  return value && value !== "YOUR_BOT_USERNAME" ? value : null;
};
