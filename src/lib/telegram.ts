import { appConfig, botUsernameConfigured } from "./config";
import { createDevTelegramProfile, sanitizeTelegramProfile } from "./telegram-user";
import type {
  DevTelegramProfile,
  TelegramProfile,
  TelegramRuntimeContext
} from "../types/game";

interface TelegramWebAppUser extends TelegramProfile {}

interface TelegramWebApp {
  colorScheme?: "light" | "dark";
  initData: string;
  initDataUnsafe?: {
    start_param?: string;
    user?: TelegramWebAppUser;
  };
  platform?: string;
  ready: () => void;
  expand: () => void;
  setBackgroundColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (style: "success" | "warning" | "error") => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const DEV_STORAGE_KEY = "ton-vault-dev-user-id";

const getStableDevId = () => {
  const existing = window.localStorage.getItem(DEV_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const next = appConfig.devTelegramId;
  window.localStorage.setItem(DEV_STORAGE_KEY, next);
  return next;
};

export const getTelegramWebApp = () => window.Telegram?.WebApp ?? null;

export const initializeTelegramChrome = (webApp: TelegramWebApp | null) => {
  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
  webApp.setBackgroundColor?.("#090d18");
  webApp.setHeaderColor?.("#090d18");
};

export const resolveTelegramContext = (): TelegramRuntimeContext => {
  const webApp = getTelegramWebApp();

  if (webApp?.initData) {
    return {
      authMode: "telegram",
      botUsernameConfigured,
      initData: webApp.initData,
      isDevMode: false,
      isTelegram: true,
      platform: webApp.platform ?? "telegram",
      startParam: webApp.initDataUnsafe?.start_param ?? null,
      user: sanitizeTelegramProfile(webApp.initDataUnsafe?.user) ?? null,
      webAppAvailable: true
    };
  }

  if (appConfig.enableDevAuth) {
    const devUser: DevTelegramProfile = createDevTelegramProfile({
      firstName: appConfig.devFirstName,
      id: getStableDevId(),
      username: appConfig.devTelegramUsername
    });

    return {
      authMode: "dev",
      botUsernameConfigured,
      devUser,
      initData: "",
      isDevMode: true,
      isTelegram: false,
      platform: "browser-dev",
      startParam: new URLSearchParams(window.location.search).get("startapp"),
      user: devUser,
      webAppAvailable: false
    };
  }

  return {
    authMode: "unsupported",
    botUsernameConfigured,
    initData: "",
    isDevMode: false,
    isTelegram: false,
    platform: "browser",
    startParam: new URLSearchParams(window.location.search).get("startapp"),
    unsupportedReason:
      "Open TON Vault inside Telegram. For local browser testing only, enable VITE_ENABLE_DEV_AUTH and ALLOW_DEV_LOGIN.",
    user: null,
    webAppAvailable: false
  };
};

export const hapticImpact = (style: "light" | "medium" | "heavy") => {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(style);
};

export const hapticNotice = (style: "success" | "warning" | "error") => {
  getTelegramWebApp()?.HapticFeedback?.notificationOccurred(style);
};

export const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export const openTelegramShare = (url: string) => {
  if (!url) {
    throw new Error("Referral link is not available until the Telegram bot username is configured.");
  }

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}`;
  const webApp = getTelegramWebApp();

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(shareUrl);
    return;
  }

  window.open(shareUrl, "_blank", "noopener,noreferrer");
};
