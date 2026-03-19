import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { StatusBanner } from "../components/common/StatusBanner";
import { BombBlastOverlay } from "../components/raid/BombBlastOverlay";
import { RaidGrid } from "../components/raid/RaidGrid";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useI18n";
import { useSound } from "../hooks/useSound";
import { cn } from "../lib/cn";
import {
  estimateCoinPayoutWithBonus,
  getVaultProgression
} from "../lib/progression";
import { hapticImpact, hapticNotice } from "../lib/telegram";
import type { ActiveRaid, DashboardData } from "../types/game";
import { gameService } from "../services/game-service";

interface ResultState {
  description: string;
  open: boolean;
  title: string;
}

export const RaidPage = () => {
  const { dashboard, sessionToken, updateDashboard } = useAuth();
  const { copy, language } = useI18n();
  const { play } = useSound();
  const [busy, setBusy] = useState(false);
  const [pendingRevealIndex, setPendingRevealIndex] = useState<number | null>(null);
  const [bombBlastVisible, setBombBlastVisible] = useState(false);
  const [notice, setNotice] = useState<{
    body: string;
    tone: "info" | "success" | "danger";
  } | null>(null);
  const [result, setResult] = useState<ResultState>({
    description: "",
    open: false,
    title: ""
  });
  const bombTimeoutRef = useRef<number | null>(null);

  const activeRaid = dashboard?.activeRaid ?? null;
  const progression = useMemo(
    () => (dashboard ? getVaultProgression(dashboard.profile) : null),
    [dashboard]
  );

  useEffect(() => {
    return () => {
      if (bombTimeoutRef.current) {
        window.clearTimeout(bombTimeoutRef.current);
      }
    };
  }, []);

  const raidStats = useMemo(() => {
    if (!activeRaid) {
      return [];
    }

    return [
      { label: copy.raid.stats.coinsInBag, value: `${activeRaid.temporaryCoins}` },
      { label: copy.raid.stats.shardsInBag, value: `${activeRaid.temporaryShards}` },
      { label: copy.raid.stats.multiplier, value: `x${activeRaid.multiplierFactor.toFixed(2)}` },
      { label: copy.raid.stats.safeOpens, value: `${activeRaid.openedCellsCount}/8` }
    ];
  }, [activeRaid, copy]);

  if (!dashboard || !sessionToken || !progression) {
    return null;
  }

  const openResult = (title: string, description: string) => {
    setResult({ description, open: true, title });
  };

  const buildLevelUpNote = (previousDashboard: DashboardData, nextDashboard: DashboardData) => {
    const previousLevel = getVaultProgression(previousDashboard.profile);
    const nextLevel = getVaultProgression(nextDashboard.profile);

    return nextLevel.level > previousLevel.level
      ? `\n\n${copy.level.modalBody(nextLevel.coinBonusPercent)}`
      : "";
  };

  const describeBonus = (baseCoins: number, creditedCoins: number) => {
    const bonusCoins = Math.max(0, creditedCoins - baseCoins);

    if (bonusCoins < 1) {
      return "";
    }

    return language === "ru"
      ? `\n\nБонус уровня добавил еще ${bonusCoins} монет сверху.`
      : `\n\nYour vault level added ${bonusCoins} extra coins on top.`;
  };

  const handleStartRaid = async () => {
    try {
      setBusy(true);
      setNotice(null);
      const response = await gameService.startRaid(sessionToken);
      startTransition(() => {
        updateDashboard(response.dashboard);
      });

      const levelUpNote = buildLevelUpNote(dashboard, response.dashboard);
      setNotice({
        body: `${copy.raid.started}${levelUpNote}`,
        tone: "info"
      });
      hapticImpact("medium");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось начать рейд."
            : "Unable to start raid.";
      setNotice({
        body: message,
        tone: "danger"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReveal = async (cellIndex: number) => {
    if (!activeRaid) {
      return;
    }

    try {
      setBusy(true);
      setPendingRevealIndex(cellIndex);
      setNotice({
        body: copy.raid.scanning,
        tone: "info"
      });
      const response = await gameService.revealCell(sessionToken, activeRaid.id, cellIndex);
      startTransition(() => {
        updateDashboard(response.dashboard);
      });
      play(response.status === "lost" ? "fail" : "reveal");

      if (response.rewardDelta) {
        setNotice({
          body: copy.raid.revealed(
            response.rewardDelta.label,
            response.raid?.temporaryCoins ?? response.temporaryCoins ?? 0,
            response.raid?.temporaryShards ?? response.temporaryShards ?? 0
          ),
          tone: response.status === "won" ? "success" : "info"
        });
      }

      if (response.status === "lost") {
        hapticNotice("error");
        setBombBlastVisible(true);
        setNotice({
          body: copy.raid.bombBody,
          tone: "danger"
        });

        if (bombTimeoutRef.current) {
          window.clearTimeout(bombTimeoutRef.current);
        }

        bombTimeoutRef.current = window.setTimeout(() => {
          openResult(copy.raid.bombTitle, copy.raid.bombModal);
          setBombBlastVisible(false);
        }, 720);
      }

      if (response.status === "won") {
        hapticNotice("success");
        const creditedCoins = response.creditedCoins ?? response.temporaryCoins ?? 0;
        const creditedShards = response.creditedShards ?? response.temporaryShards ?? 0;
        setNotice({
          body:
            creditedCoins > 0 || creditedShards > 0
              ? language === "ru"
                ? `Все безопасные клетки открыты. На баланс ушло ${creditedCoins} монет и ${creditedShards} шардов.`
                : `Every safe cell is clear. ${creditedCoins} coins and ${creditedShards} shards were auto-banked.`
              : copy.raid.wonBody,
          tone: "success"
        });
        openResult(
          copy.raid.wonTitle,
          `${language === "ru"
            ? `Ты открыл все безопасные клетки и зафиксировал ${creditedCoins} монет и ${creditedShards} шардов.`
            : `You opened every safe cell and secured ${creditedCoins} coins and ${creditedShards} shards.`}${describeBonus(
            response.temporaryCoins ?? creditedCoins,
            creditedCoins
          )}${buildLevelUpNote(dashboard, response.dashboard)}`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось открыть клетку."
            : "Cell reveal failed.";
      setNotice({
        body: message,
        tone: "danger"
      });
    } finally {
      setBusy(false);
      setPendingRevealIndex(null);
    }
  };

  const handleCashOut = async (raid: ActiveRaid) => {
    try {
      setBusy(true);
      setNotice({
        body: copy.raid.cashingOut,
        tone: "info"
      });
      const response = await gameService.cashOutRaid(sessionToken, raid.id);
      startTransition(() => {
        updateDashboard(response.dashboard);
      });
      play("success");
      hapticNotice("success");

      const creditedCoins = response.creditedCoins ?? raid.temporaryCoins;
      const creditedShards = response.creditedShards ?? raid.temporaryShards;

      setNotice({
        body: copy.raid.cashedOut(creditedCoins, creditedShards),
        tone: "success"
      });
      openResult(
        copy.raid.bankedTitle,
        `${copy.raid.bankedModal(creditedCoins, creditedShards)}${describeBonus(
          raid.temporaryCoins,
          creditedCoins
        )}${buildLevelUpNote(dashboard, response.dashboard)}`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось зафиксировать награду."
            : "Cash out failed.";
      setNotice({
        body: message,
        tone: "danger"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRiskMore = () => {
    document.getElementById("raid-grid")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    hapticImpact("light");
  };

  const boostedCashoutCoins = activeRaid
    ? estimateCoinPayoutWithBonus(activeRaid.temporaryCoins, progression.coinBonusPercent)
    : 0;

  return (
    <>
      <BombBlastOverlay label={copy.raid.blast} open={bombBlastVisible} />

      <section className={cn("panel-grid", bombBlastVisible && "vault-shake")}>
        <Card className="overflow-hidden bg-vault-grid p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
                {copy.raid.loop}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {copy.raid.heroTitle}
              </div>
              <p className="mt-3 text-sm leading-6 text-soft">{copy.raid.heroBody}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-full border border-accent-gold/20 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold">
                {dashboard.profile.keys} {copy.common.keys.toLowerCase()}
              </div>
              <div className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
                {copy.level.coinBoost(progression.coinBonusPercent)}
              </div>
            </div>
          </div>
          <PrimaryButton
            className="mt-5"
            disabled={busy || dashboard.profile.keys < 1 || Boolean(activeRaid)}
            onClick={handleStartRaid}
          >
            {busy && !activeRaid
              ? copy.raid.spendingKey
              : dashboard.profile.keys < 1
                ? copy.raid.noKeys
                : activeRaid
                  ? copy.raid.raidInProgress
                  : copy.raid.spendKey}
          </PrimaryButton>
          {dashboard.profile.keys < 1 ? (
            <p className="mt-3 text-sm text-accent-danger">{copy.raid.noKeysHint}</p>
          ) : null}
        </Card>

        {notice ? (
          <StatusBanner title={copy.raid.feed} tone={notice.tone}>
            {notice.body}
          </StatusBanner>
        ) : null}

        {activeRaid ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {raidStats.map((item) => (
                <Card key={item.label} className="rounded-[20px] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                    {item.label}
                  </div>
                  <div className="mt-3 text-xl font-semibold text-white">{item.value}</div>
                </Card>
              ))}
            </div>

            <div id="raid-grid">
              <RaidGrid
                disabled={busy}
                onReveal={handleReveal}
                pendingCellIndex={pendingRevealIndex}
                raid={activeRaid}
              />
            </div>

            <Card className="rounded-[24px] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                    {copy.raid.decisionPoint}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {copy.raid.decisionTitle}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    {copy.raid.decisionBody}
                  </p>
                </div>
                <div className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
                  {copy.common.liveRaid}
                </div>
              </div>
              {activeRaid.temporaryCoins > 0 ? (
                <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-soft">
                  {language === "ru"
                    ? `Текущий бонус хранилища превратит ${activeRaid.temporaryCoins} монет в ${boostedCashoutCoins} при кэшауте.`
                    : `Your current vault bonus turns ${activeRaid.temporaryCoins} coins into ${boostedCashoutCoins} on cashout.`}
                </div>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <PrimaryButton
                  disabled={busy || activeRaid.openedCellsCount < 1}
                  onClick={() => handleCashOut(activeRaid)}
                >
                  {busy ? copy.raid.lockingReward : copy.raid.takeReward}
                </PrimaryButton>
                <PrimaryButton disabled={busy} onClick={handleRiskMore} variant="secondary">
                  {copy.raid.riskMore}
                </PrimaryButton>
              </div>
            </Card>
          </>
        ) : (
          <Card className="rounded-[24px] p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.raid.howItWorks}
            </div>
            <div className="mt-3 text-lg font-semibold text-white">{copy.raid.howTitle}</div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-soft">
              <p>{copy.raid.howCoin}</p>
              <p>{copy.raid.howMultiplier}</p>
              <p>{copy.raid.howShard}</p>
              <p>{copy.raid.howBomb}</p>
            </div>
          </Card>
        )}
      </section>

      <Modal
        description={result.description}
        onClose={() => setResult((current) => ({ ...current, open: false }))}
        open={result.open}
        title={result.title}
      />
    </>
  );
};
