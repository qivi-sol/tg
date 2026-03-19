/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  readonly VITE_DEV_TELEGRAM_ID?: string;
  readonly VITE_DEV_TELEGRAM_USERNAME?: string;
  readonly VITE_DEV_FIRST_NAME?: string;
  readonly VITE_ENABLE_DEV_AUTH?: string;
  readonly VITE_ENABLE_DEV_ADS_MOCK?: string;
  readonly VITE_AD_REWARD_COOLDOWN_MINUTES?: string;
  readonly VITE_AD_REWARD_KEY_REWARD?: string;
  readonly VITE_DAILY_REWARD_COOLDOWN_HOURS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
