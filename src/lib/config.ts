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

const isPlaceholderBotUsername = (value: string) =>
  value.trim().length === 0 || value === "YOUR_BOT_USERNAME";

const isPlaceholderSupabaseUrl = (value: string) =>
  value.trim().length === 0 || value === "https://your-project.supabase.co";

const isPlaceholderAnonKey = (value: string) =>
  value.trim().length === 0 || value === "your-public-anon-key";

export const appConfig = {
  adRewardCooldownMinutes: parsePositiveInt(
    import.meta.env.VITE_AD_REWARD_COOLDOWN_MINUTES,
    30
  ),
  adRewardKeyReward: parsePositiveInt(import.meta.env.VITE_AD_REWARD_KEY_REWARD, 1),
  dailyRewardCooldownHours: parsePositiveInt(
    import.meta.env.VITE_DAILY_REWARD_COOLDOWN_HOURS,
    24
  ),
  devFirstName: import.meta.env.VITE_DEV_FIRST_NAME ?? "Vault",
  devTelegramId: import.meta.env.VITE_DEV_TELEGRAM_ID ?? "900000001",
  devTelegramUsername: import.meta.env.VITE_DEV_TELEGRAM_USERNAME ?? "vault_tester",
  enableDevAdsMock: parseBoolean(import.meta.env.VITE_ENABLE_DEV_ADS_MOCK, import.meta.env.DEV),
  enableDevAuth: parseBoolean(import.meta.env.VITE_ENABLE_DEV_AUTH, import.meta.env.DEV),
  envMode: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  telegramBotUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "YOUR_BOT_USERNAME"
};

export const hasSupabaseConfig =
  !isPlaceholderSupabaseUrl(appConfig.supabaseUrl) &&
  !isPlaceholderAnonKey(appConfig.supabaseAnonKey);

export const botUsernameConfigured = !isPlaceholderBotUsername(
  appConfig.telegramBotUsername
);

export const configErrorMessage = hasSupabaseConfig
  ? null
  : "Supabase is not configured: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY still use placeholder values in .env.";

export const runtimeWarnings = {
  botUsername:
    botUsernameConfigured
      ? null
      : "Telegram bot username is not configured yet. Referral deep links and future Stars payments will stay in placeholder mode.",
  devAuth:
    appConfig.enableDevAuth && !appConfig.isDevelopment
      ? "Browser dev auth is enabled in a non-development build. Disable VITE_ENABLE_DEV_AUTH before production launch."
      : null
};
