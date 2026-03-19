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
const DASHBOARD_STORAGE_KEY = "ton-vault-dashboard-cache";

const readStoredToken = () => window.localStorage.getItem(SESSION_STORAGE_KEY);

const readStoredDashboard = (): DashboardData | null => {
  const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DashboardData;
  } catch {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    return null;
  }
};

const writeStoredToken = (token: string | null) => {
  if (!token) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
};

const writeStoredDashboard = (dashboard: DashboardData | null) => {
  if (!dashboard) {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashboard));
};

const clearStoredSession = () => {
  writeStoredToken(null);
  writeStoredDashboard(null);
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4 || 4)) % 4)}`;
  return window.atob(padded);
};

const decodeAppToken = (token: string): { exp?: number; telegram_id?: string } | null => {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as { exp?: number; telegram_id?: string };
  } catch {
    return null;
  }
};

const tokenMatchesRuntimeUser = (token: string, telegram: TelegramRuntimeContext) => {
  if (telegram.authMode === "unsupported") {
    return true;
  }

  const runtimeUserId = telegram.user?.id ?? telegram.devUser?.id;

  if (!runtimeUserId) {
    return false;
  }

  const payload = decodeAppToken(token);

  if (!payload?.telegram_id || (payload.exp ?? 0) <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  return String(payload.telegram_id) === String(runtimeUserId);
};

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
  const [dashboard, setDashboardState] = useState<DashboardData | null>(() => {
    const storedToken = readStoredToken();
    return storedToken ? readStoredDashboard() : null;
  });
  const [sessionToken, setSessionToken] = useState<string | null>(() => readStoredToken());
  const [loading, setLoading] = useState(() => !(readStoredToken() && readStoredDashboard()));
  const [error, setError] = useState<string | null>(null);

  const commitDashboard = (nextDashboard: DashboardData | null) => {
    setDashboardState(nextDashboard);
    writeStoredDashboard(nextDashboard);
  };

  const commitSession = (nextToken: string | null, nextDashboard: DashboardData | null) => {
    setSessionToken(nextToken);
    writeStoredToken(nextToken);
    commitDashboard(nextDashboard);
  };

  useEffect(() => {
    let active = true;
    const storedToken = readStoredToken();
    const canReuseStoredToken = storedToken
      ? tokenMatchesRuntimeUser(storedToken, telegram)
      : false;
    const hasWarmDashboard = Boolean(storedToken && dashboard);

    const run = async () => {
      if (!hasWarmDashboard) {
        setLoading(true);
      }

      setError(null);

      if (storedToken && canReuseStoredToken) {
        try {
          const response = await authService.bootstrap(storedToken);
          if (!active) {
            return;
          }

          commitSession(storedToken, response.dashboard);
          setLoading(false);
          return;
        } catch {
          if (!active) {
            return;
          }

          clearStoredSession();
          setSessionToken(null);
        }
      }

      if (telegram.authMode === "unsupported") {
        setError(telegram.unsupportedReason ?? "Open TON Vault inside Telegram.");
        setLoading(false);
        return;
      }

      try {
        const response = await authService.login({
          initData: telegram.initData,
          startParam: telegram.startParam,
          devUser: telegram.devUser
        });

        if (!active) {
          return;
        }

        commitSession(response.token, response.dashboard);
      } catch (authError) {
        if (!active) {
          return;
        }

        const message =
          authError instanceof Error ? authError.message : "Unable to start TON Vault.";

        if (!hasWarmDashboard) {
          setError(message);
          clearStoredSession();
          commitDashboard(null);
          setSessionToken(null);
        } else {
          setError(`Live sync failed. Showing the last cached vault state. ${message}`);
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
  }, [
    telegram.authMode,
    telegram.devUser?.id,
    telegram.initData,
    telegram.startParam,
    telegram.unsupportedReason,
    telegram.user?.id
  ]);

  const refreshDashboard = async () => {
    if (!sessionToken) {
      return;
    }

    const response = await authService.bootstrap(sessionToken);
    commitDashboard(response.dashboard);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      dashboard,
      error,
      loading,
      refreshDashboard,
      sessionToken,
      telegram,
      updateDashboard: commitDashboard
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
