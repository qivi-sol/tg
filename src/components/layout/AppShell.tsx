import { Outlet } from "react-router-dom";
import vaultMark from "../../assets/vault-mark.svg";
import { useAuth } from "../../hooks/useAuth";
import { runtimeWarnings } from "../../lib/config";
import { clampLabel, initialsFromName } from "../../lib/format";
import { Card } from "../common/Card";
import { LoadingScreen } from "../common/LoadingScreen";
import { StatusBanner } from "../common/StatusBanner";
import { BottomNav } from "./BottomNav";

export const AppShell = () => {
  const { dashboard, error, loading, telegram } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !dashboard) {
    return (
      <div className="app-shell mx-auto max-w-[460px]">
        <Card className="mt-10 p-6">
          <img src={vaultMark} alt="TON Vault" className="mb-4 h-14 w-14" />
          <div className="text-2xl font-semibold text-white">TON Vault</div>
          <p className="mt-3 text-sm leading-6 text-soft">
            {error ?? "Unable to load your vault profile."}
          </p>
          <p className="mt-4 text-xs leading-5 text-white/[0.45]">
            Make sure Supabase env vars are configured and Telegram auth is available,
            or enable local dev login in your Edge Function env.
          </p>
        </Card>
      </div>
    );
  }

  const displayName =
    dashboard.profile.firstName ?? dashboard.profile.username ?? "Vault Raider";

  return (
    <div className="app-shell mx-auto max-w-[460px]">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={vaultMark} alt="TON Vault" className="h-12 w-12" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
              TON Vault
            </div>
            <div className="text-lg font-semibold text-white">Raid. Risk. Cash out.</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-2">
          {dashboard.profile.avatarUrl ? (
            <img
              src={dashboard.profile.avatarUrl}
              alt={displayName}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {initialsFromName(displayName)}
            </div>
          )}
          <div className="pr-2">
            <div className="text-sm font-medium text-white">{clampLabel(displayName)}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/[0.45]">
              {telegram.isTelegram ? "Telegram" : "Dev Mode"}
            </div>
          </div>
        </div>
      </header>
      {telegram.authMode === "dev" ? (
        <StatusBanner className="mb-4" title="Dev Auth" tone="info">
          Browser dev auth is enabled. This mode is for local testing only and should
          be disabled before production launch.
        </StatusBanner>
      ) : null}
      {runtimeWarnings.botUsername ? (
        <StatusBanner className="mb-4" title="Config Note" tone="danger">
          {runtimeWarnings.botUsername}
        </StatusBanner>
      ) : null}
      {runtimeWarnings.devAuth ? (
        <StatusBanner className="mb-4" title="Launch Warning" tone="danger">
          {runtimeWarnings.devAuth}
        </StatusBanner>
      ) : null}
      <main className="pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
