import { useEffect, useState } from "react";
import { Card } from "../components/common/Card";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useI18n";
import { formatCompactNumber, initialsFromName } from "../lib/format";
import type { LeaderboardEntry } from "../types/game";
import { gameService } from "../services/game-service";

export const LeaderboardPage = () => {
  const { dashboard, sessionToken } = useAuth();
  const { copy, locale, language } = useI18n();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async (activeFlag?: { active: boolean }) => {
    if (!sessionToken) {
      return;
    }

    try {
      setLoading(true);
      const response = await gameService.getLeaderboard(sessionToken);
      if (activeFlag && !activeFlag.active) {
        return;
      }

      setEntries(response.entries);
      setCurrentUserRank(response.currentUserRank);
      setError(null);
    } catch (leaderboardError) {
      if (activeFlag && !activeFlag.active) {
        return;
      }

      setError(
        leaderboardError instanceof Error
          ? leaderboardError.message
          : copy.leaderboard.unavailable
      );
    } finally {
      if (!activeFlag || activeFlag.active) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const activeFlag = {
      active: true
    };

    void loadLeaderboard(activeFlag);

    return () => {
      activeFlag.active = false;
    };
  }, [sessionToken]);

  return (
    <section className="panel-grid">
      <Card className="bg-vault-grid p-5">
        <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
          {copy.leaderboard.title}
        </div>
        <div className="mt-2 text-2xl font-semibold text-white">
          {copy.leaderboard.heroTitle}
        </div>
        <p className="mt-3 text-sm leading-6 text-soft">{copy.leaderboard.heroBody}</p>
        <div className="mt-4 w-full max-w-[180px]">
          <PrimaryButton
            disabled={loading}
            onClick={() => void loadLeaderboard()}
            variant="secondary"
          >
            {loading ? copy.leaderboard.refreshing : copy.leaderboard.refreshBoard}
          </PrimaryButton>
        </div>
      </Card>

      <Card className="rounded-[24px] p-3">
        {loading ? (
          <div className="p-4 text-sm text-soft">{copy.leaderboard.loading}</div>
        ) : error ? (
          <div className="p-4 text-sm text-accent-danger">{error}</div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-sm text-soft">
            {language === "ru"
              ? "Топ пока пуст. Первый крупный рейд может забрать лидерство."
              : "The board is still empty. Your next strong run could land the first spot."}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const isCurrentUser = entry.userId === dashboard?.profile.id;
              const label =
                entry.firstName ??
                entry.username ??
                (language === "ru" ? "Рейдер Vault" : "Vault Raider");

              return (
                <div
                  key={`${entry.userId}-${entry.rank}`}
                  className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 ${
                    isCurrentUser
                      ? "border-accent-cyan/40 bg-accent-cyan/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="w-8 text-sm font-semibold text-white/[0.65]">
                    #{entry.rank}
                  </div>
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={label}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                      {initialsFromName(label)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">
                      {language === "ru"
                        ? `Vault ур. ${entry.vaultLevel}`
                        : `Vault Lv. ${entry.vaultLevel}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {formatCompactNumber(entry.totalCoinsEarned, locale)}
                    </div>
                    <div className="text-xs text-white/[0.45]">{copy.leaderboard.coins}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {currentUserRank && currentUserRank > 50 ? (
        <Card className="rounded-[20px] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
            {copy.leaderboard.yourRank}
          </div>
          <div className="mt-3 text-xl font-semibold text-white">#{currentUserRank}</div>
        </Card>
      ) : null}
    </section>
  );
};
