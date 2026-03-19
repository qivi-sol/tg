import { startTransition, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { ResourceCard } from "../components/common/ResourceCard";
import { StatusBanner } from "../components/common/StatusBanner";
import { DailyRewardCard } from "../components/home/DailyRewardCard";
import { RewardedAdCard } from "../components/home/RewardedAdCard";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useI18n";
import { useSound } from "../hooks/useSound";
import { calculateAirdropScore } from "../lib/airdrop";
import { appConfig } from "../lib/config";
import { formatRelativeDateTime } from "../lib/format";
import {
  estimateCoinPayoutWithBonus,
  getVaultProgression
} from "../lib/progression";
import { hapticNotice } from "../lib/telegram";
import type { DashboardData } from "../types/game";
import { adsService } from "../services/ads-service";
import { gameService } from "../services/game-service";

export const HomePage = () => {
  const navigate = useNavigate();
  const { dashboard, sessionToken, updateDashboard } = useAuth();
  const { copy, locale, language } = useI18n();
  const { play } = useSound();
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimingAd, setClaimingAd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<{
    description: string;
    title: string;
  } | null>(null);

  const progression = useMemo(
    () => (dashboard ? getVaultProgression(dashboard.profile) : null),
    [dashboard]
  );
  const quickFacts = useMemo(
    () =>
      dashboard
        ? [
            {
              label: copy.home.quickFacts.vaultLevel,
              value: `${copy.common.levelShort} ${progression?.level ?? 1}`
            },
            {
              label: copy.home.quickFacts.referralBonus,
              value: copy.home.referralBonusValue(
                dashboard.referrals.referralBonusEarned ?? 0
              )
            },
            {
              label: copy.home.quickFacts.lastClaim,
              value: formatRelativeDateTime(
                dashboard.dailyReward.lastClaimAt ?? null,
                locale
              )
            }
          ]
        : [],
    [copy, dashboard, locale, progression?.level]
  );
  const airdropScore = useMemo(
    () => (dashboard ? calculateAirdropScore(dashboard) : 0),
    [dashboard]
  );

  if (!dashboard || !sessionToken || !progression) {
    return null;
  }

  const buildLevelUpNote = (previousDashboard: DashboardData, nextDashboard: DashboardData) => {
    const previousLevel = getVaultProgression(previousDashboard.profile);
    const nextLevel = getVaultProgression(nextDashboard.profile);

    return nextLevel.level > previousLevel.level
      ? `\n\n${copy.level.modalBody(nextLevel.coinBonusPercent)}`
      : "";
  };

  const openRewardModal = (title: string, description: string) => {
    setRewardModal({
      description,
      title
    });
  };

  const handleClaim = async () => {
    try {
      setClaimingDaily(true);
      const response = await gameService.claimDailyReward(sessionToken);
      startTransition(() => {
        updateDashboard(response.dashboard);
      });
      openRewardModal(
        copy.home.rewardClaimed,
        `${copy.home.rewardClaimedBody(response.reward.label)}${buildLevelUpNote(
          dashboard,
          response.dashboard
        )}`
      );
      setErrorMessage(null);
      play("success");
      hapticNotice("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось забрать ежедневную награду."
            : "Daily reward claim failed.";
      setErrorMessage(message);
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleWatchAd = async () => {
    try {
      setClaimingAd(true);
      setErrorMessage(null);
      await adsService.watchRewardedAd();
      const response = await gameService.claimRewardedAd(sessionToken);
      startTransition(() => {
        updateDashboard(response.dashboard);
      });
      openRewardModal(
        copy.rewards.rewardedClaimed,
        copy.rewards.rewardedClaimedBody(response.reward.label)
      );
      play("success");
      hapticNotice("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось получить рекламный буст."
            : "Rewarded boost claim failed.";
      setErrorMessage(message);
    } finally {
      setClaimingAd(false);
    }
  };

  const estimatedBoostedPayout = estimateCoinPayoutWithBonus(
    250,
    progression.coinBonusPercent
  );

  return (
    <>
      <section className="panel-grid">
        <div className="grid grid-cols-3 gap-3">
          <ResourceCard
            accent="#F7C96B"
            label={copy.common.coins}
            value={dashboard.profile.coins}
          />
          <ResourceCard
            accent="#4DE6FF"
            label={copy.common.keys}
            value={dashboard.profile.keys}
          />
          <ResourceCard
            accent="#4EF7A7"
            label={copy.common.shards}
            value={dashboard.profile.shards}
          />
        </div>

        <Card className="overflow-hidden bg-vault-grid p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
                {copy.home.mainVault}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {copy.home.heroTitle}
              </div>
              <p className="mt-3 text-sm leading-6 text-soft">{copy.home.heroBody}</p>
            </div>
            <div className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
              {copy.home.heroBadge}
            </div>
          </div>
          <PrimaryButton className="mt-5" onClick={() => navigate("/raid")}>
            {dashboard.activeRaid ? copy.home.resumeRaid : copy.home.startRaid}
          </PrimaryButton>
        </Card>

        {dashboard.activeRaid ? (
          <StatusBanner title={copy.home.raidWaitingTitle} tone="info">
            {copy.home.raidWaitingBody(
              dashboard.activeRaid.temporaryCoins,
              dashboard.activeRaid.temporaryShards
            )}
          </StatusBanner>
        ) : null}

        {errorMessage ? (
          <StatusBanner title={copy.common.actionFailed} tone="danger">
            {errorMessage}
          </StatusBanner>
        ) : null}

        <Card className="rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                {copy.level.title}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {copy.common.levelShort} {progression.level}
              </div>
              <p className="mt-2 text-sm leading-6 text-soft">{copy.level.body}</p>
            </div>
            <div className="rounded-full border border-accent-gold/20 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold">
              {copy.level.coinBoost(progression.coinBonusPercent)}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-xs text-white/[0.5]">
              <span>{copy.level.progressLabel(progression.level)}</span>
              <span>
                {progression.pointsToNextLevel > 0
                  ? copy.level.nextLevel(progression.pointsToNextLevel)
                  : copy.level.maxLevel}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-cyan via-accent-green to-accent-gold transition-all duration-500"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-soft">
              {language === "ru"
                ? `Текущий бонус уже превращает условные 250 монет в ${estimatedBoostedPayout} на кэшауте.`
                : `Your current vault bonus already turns a sample 250-coin bag into ${estimatedBoostedPayout} on cashout.`}
            </p>
          </div>
        </Card>

        <div className="grid gap-3">
          <DailyRewardCard
            loading={claimingDaily}
            onClaim={handleClaim}
            status={dashboard.dailyReward}
          />
          <RewardedAdCard
            adsEnabled={appConfig.enableDevAdsMock}
            loading={claimingAd}
            onWatch={handleWatchAd}
            status={dashboard.adReward}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickFacts.map((fact) => (
            <Card key={fact.label} className="rounded-[20px] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                {fact.label}
              </div>
              <div className="mt-3 text-lg font-semibold text-white">{fact.value}</div>
            </Card>
          ))}
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.home.quickFacts.referralSquad}
            </div>
            <div className="mt-3 text-lg font-semibold text-white">
              {copy.home.referralSquadValue(dashboard.referrals.totalReferrals)}
            </div>
            <p className="mt-2 text-sm text-soft">
              {copy.home.referralSquadBody(dashboard.referrals.activeReferrals)}
            </p>
          </Card>
        </div>

        <div className="grid gap-3">
          {/* TODO: Add Daily Mega Vault queueing and entry rules once the special mode ships. */}
          <Card className="rounded-[20px] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                  {copy.home.megaVault.title}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {copy.common.comingSoon}
                </div>
                <p className="mt-2 text-sm leading-6 text-soft">
                  {copy.home.megaVault.body}
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/[0.55]">
                {copy.common.placeholder}
              </div>
            </div>
          </Card>

          <Card className="rounded-[20px] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                  {copy.home.airdrop.title}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">{airdropScore}</div>
                <p className="mt-2 text-sm leading-6 text-soft">{copy.home.airdrop.body}</p>
              </div>
              <div className="rounded-full border border-accent-gold/20 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold">
                {copy.common.comingSoon}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Modal
        description={rewardModal?.description ?? ""}
        onClose={() => setRewardModal(null)}
        open={Boolean(rewardModal)}
        title={rewardModal?.title ?? copy.home.rewardClaimed}
      />
    </>
  );
};
