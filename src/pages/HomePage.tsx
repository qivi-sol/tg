import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { ResourceCard } from "../components/common/ResourceCard";
import { StatusBanner } from "../components/common/StatusBanner";
import { DailyRewardCard } from "../components/home/DailyRewardCard";
import { RewardedAdCard } from "../components/home/RewardedAdCard";
import { useAuth } from "../hooks/useAuth";
import { calculateAirdropScore } from "../lib/airdrop";
import { appConfig } from "../lib/config";
import { useSound } from "../hooks/useSound";
import { formatRelativeDateTime } from "../lib/format";
import { hapticNotice } from "../lib/telegram";
import type { RewardPayload } from "../types/game";
import { adsService } from "../services/ads-service";
import { gameService } from "../services/game-service";

export const HomePage = () => {
  const navigate = useNavigate();
  const { dashboard, sessionToken, updateDashboard } = useAuth();
  const { play } = useSound();
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimingAd, setClaimingAd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<{
    description: string;
    title: string;
  } | null>(null);

  const quickFacts = useMemo(
    () => [
      {
        label: "Vault Level",
        value: `Lv. ${dashboard?.profile.vaultLevel ?? 1}`
      },
      {
        label: "Referral Bonus",
        value: `+${dashboard?.referrals.referralBonusEarned ?? 0} keys`
      },
      {
        label: "Last Claim",
        value: formatRelativeDateTime(dashboard?.dailyReward.lastClaimAt ?? null)
      }
    ],
    [dashboard]
  );
  const airdropScore = useMemo(
    () => (dashboard ? calculateAirdropScore(dashboard) : 0),
    [dashboard]
  );

  if (!dashboard || !sessionToken) {
    return null;
  }

  const openRewardModal = (title: string, reward: RewardPayload, description: string) => {
    setRewardModal({
      description,
      title
    });
  };

  const handleClaim = async () => {
    try {
      setClaimingDaily(true);
      const response = await gameService.claimDailyReward(sessionToken);
      updateDashboard(response.dashboard);
      openRewardModal(
        "Daily reward claimed",
        response.reward,
        `${response.reward.label} has been added to your account.`
      );
      setErrorMessage(null);
      play("success");
      hapticNotice("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Daily reward claim failed.";
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
      updateDashboard(response.dashboard);
      openRewardModal(
        "Rewarded boost claimed",
        response.reward,
        `${response.reward.label} has been granted after the rewarded action cleared.`
      );
      play("success");
      hapticNotice("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rewarded boost claim failed.";
      setErrorMessage(message);
    } finally {
      setClaimingAd(false);
    }
  };

  return (
    <>
      <section className="panel-grid">
        <div className="grid grid-cols-3 gap-3">
          <ResourceCard accent="#F7C96B" label="Coins" value={dashboard.profile.coins} />
          <ResourceCard accent="#4DE6FF" label="Keys" value={dashboard.profile.keys} />
          <ResourceCard accent="#4EF7A7" label="Shards" value={dashboard.profile.shards} />
        </div>

        <Card className="overflow-hidden bg-vault-grid p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
                Main Vault
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Launch a fast 9-cell raid
              </div>
              <p className="mt-3 text-sm leading-6 text-soft">
                Spend 1 Key, dodge the bomb, and bank the loot before greed wins.
              </p>
            </div>
            <div className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
              10-30s loop
            </div>
          </div>
          <PrimaryButton className="mt-5" onClick={() => navigate("/raid")}>
            {dashboard.activeRaid ? "Resume Active Raid" : "Start Raid"}
          </PrimaryButton>
        </Card>

        {dashboard.activeRaid ? (
          <StatusBanner title="Raid Waiting" tone="info">
            Your vault run is still active with {dashboard.activeRaid.temporaryCoins} coins
            and {dashboard.activeRaid.temporaryShards} shards in the bag. Jump back in
            before you lose the momentum.
          </StatusBanner>
        ) : null}

        {errorMessage ? (
          <StatusBanner title="Action Failed" tone="danger">
            {errorMessage}
          </StatusBanner>
        ) : null}

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
              Referral Squad
            </div>
            <div className="mt-3 text-lg font-semibold text-white">
              {dashboard.referrals.totalReferrals} total
            </div>
            <p className="mt-2 text-sm text-soft">
              {dashboard.referrals.activeReferrals} already raiding for rewards.
            </p>
          </Card>
        </div>

        <div className="grid gap-3">
          {/* TODO: Add Daily Mega Vault queueing and entry rules once the special mode ships. */}
          <Card className="rounded-[20px] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                  Daily Mega Vault
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Coming soon
                </div>
                <p className="mt-2 text-sm leading-6 text-soft">
                  A larger limited-time vault with layered bomb traps and leaderboard
                  multipliers.
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/[0.55]">
                Placeholder
              </div>
            </div>
          </Card>

          <Card className="rounded-[20px] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                  Airdrop Score
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {airdropScore}
                </div>
                <p className="mt-2 text-sm leading-6 text-soft">
                  Snapshot system coming soon. This preview score only reflects account
                  activity, raids, shards, and valid referrals for future utility
                  planning.
                </p>
              </div>
              <div className="rounded-full border border-accent-gold/20 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold">
                Coming soon
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Modal
        description={rewardModal?.description ?? ""}
        onClose={() => setRewardModal(null)}
        open={Boolean(rewardModal)}
        title={rewardModal?.title ?? "Reward claimed"}
      />
    </>
  );
};
