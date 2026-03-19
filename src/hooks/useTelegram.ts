import { useEffect, useMemo } from "react";
import { initializeTelegramChrome, resolveTelegramContext } from "../lib/telegram";

export const useTelegram = () => {
  const context = useMemo(() => resolveTelegramContext(), []);

  useEffect(() => {
    if (context.webAppAvailable) {
      initializeTelegramChrome(window.Telegram?.WebApp ?? null);
    }
  }, [context.webAppAvailable]);

  return context;
};
