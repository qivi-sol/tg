import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { DashboardData, TelegramRuntimeContext } from "../types/game";
import { authService } from "../services/auth-service";
import { useTelegram } from "./useTelegram";

const SESSION_STORAGE_KEY = "ton-vault-session-token";

interface AuthContextValue {
  dashboard: DashboardData | null;
  error: string | null;
  loading: boolean;
  refreshDashboard: () => Promise<void>;
  sessionToken: string | null;
  telegram: TelegramRuntimeContext;
  updateDashboard: (dashboard: DashboardData) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const telegram = useTelegram();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    window.localStorage.getItem(SESSION_STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const storedToken = window.localStorage.getItem(SESSION_STORAGE_KEY);

    const run = async () => {
      if (telegram.authMode === "unsupported") {
        if (storedToken) {
          try {
            const response = await authService.bootstrap(storedToken);
            if (!active) {
              return;
            }

            setDashboard(response.dashboard);
            setSessionToken(storedToken);
            setError(null);
          } catch {
            if (!active) {
              return;
            }

            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            setSessionToken(null);
            setError(telegram.unsupportedReason ?? "Open TON Vault inside Telegram.");
          } finally {
            if (active) {
              setLoading(false);
            }
          }

          return;
        }

        setError(telegram.unsupportedReason ?? "Open TON Vault inside Telegram.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await authService.login({
          initData: telegram.initData,
          startParam: telegram.startParam,
          devUser: telegram.devUser
        });

        if (!active) {
          return;
        }

        setSessionToken(response.token);
        setDashboard(response.dashboard);
        window.localStorage.setItem(SESSION_STORAGE_KEY, response.token);
      } catch (authError) {
        if (!active) {
          return;
        }

        const message =
          authError instanceof Error ? authError.message : "Unable to start TON Vault.";
        setError(message);

        if (storedToken) {
          try {
            const response = await authService.bootstrap(storedToken);
            if (!active) {
              return;
            }

            setDashboard(response.dashboard);
            setError(null);
            setSessionToken(storedToken);
          } catch {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            setSessionToken(null);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [telegram.authMode, telegram.devUser?.id, telegram.initData, telegram.startParam, telegram.unsupportedReason]);

  const refreshDashboard = async () => {
    if (!sessionToken) {
      return;
    }

    const response = await authService.bootstrap(sessionToken);
    setDashboard(response.dashboard);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      dashboard,
      error,
      loading,
      refreshDashboard,
      sessionToken,
      telegram,
      updateDashboard: setDashboard
    }),
    [dashboard, error, loading, refreshDashboard, sessionToken, telegram]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
