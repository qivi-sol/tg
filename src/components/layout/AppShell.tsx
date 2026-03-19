import { Outlet } from "react-router-dom";
import vaultMark from "../../assets/vault-mark.svg";
import { useAuth } from "../../hooks/useAuth";
import { useI18n, type Language } from "../../hooks/useI18n";
import { runtimeWarnings } from "../../lib/config";
import { clampLabel, initialsFromName } from "../../lib/format";
import { Card } from "../common/Card";
import { LoadingScreen } from "../common/LoadingScreen";
import { StatusBanner } from "../common/StatusBanner";
import { BottomNav } from "./BottomNav";

export const AppShell = () => {
  const { dashboard, error, loading, telegram } = useAuth();
  const { copy, language, setLanguage } = useI18n();

  const languageOptions: Language[] = ["en", "ru"];

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboard) {
    return (
      <div className="app-shell mx-auto max-w-[460px]">
        <Card className="mt-10 p-6">
          <img src={vaultMark} alt="TON Vault" className="mb-4 h-14 w-14" />
          <div className="text-2xl font-semibold text-white">TON Vault</div>
          <p className="mt-3 text-sm leading-6 text-soft">
            {error ??
              (language === "ru"
                ? "Не удалось загрузить профиль TON Vault."
                : "Unable to load your vault profile.")}
          </p>
          <p className="mt-4 text-xs leading-5 text-white/[0.45]">
            {copy.common.configHint}
          </p>
        </Card>
      </div>
    );
  }

  const displayName =
    dashboard.profile.firstName ??
    dashboard.profile.username ??
    (language === "ru" ? "Рейдер Vault" : "Vault Raider");

  return (
    <div className="app-shell mx-auto max-w-[460px]">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={vaultMark} alt="TON Vault" className="h-12 w-12" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
              {copy.app.title}
            </div>
            <div className="text-lg font-semibold text-white">{copy.app.tagline}</div>
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
              {telegram.isTelegram ? copy.common.telegram : copy.common.devMode}
            </div>
          </div>
        </div>
      </header>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          <span className="px-2 text-[10px] uppercase tracking-[0.18em] text-white/[0.4]">
            {copy.app.languageLabel}
          </span>
          {languageOptions.map((option) => (
            <button
              key={option}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                language === option
                  ? "bg-white text-surface-950"
                  : "text-white/[0.55] hover:text-white"
              }`}
              onClick={() => setLanguage(option)}
              type="button"
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {telegram.authMode === "dev" ? (
        <StatusBanner className="mb-4" title={copy.app.devAuthTitle} tone="info">
          {copy.app.devAuthBody}
        </StatusBanner>
      ) : null}
      {error ? (
        <StatusBanner className="mb-4" title={copy.common.syncNoticeTitle} tone="info">
          {error}
        </StatusBanner>
      ) : null}
      {runtimeWarnings.botUsername ? (
        <StatusBanner className="mb-4" title={copy.app.configNoteTitle} tone="danger">
          {runtimeWarnings.botUsername}
        </StatusBanner>
      ) : null}
      {runtimeWarnings.devAuth ? (
        <StatusBanner className="mb-4" title={copy.app.launchWarningTitle} tone="danger">
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
