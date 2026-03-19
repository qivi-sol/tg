import { useEffect, useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { Card } from "../common/Card";
import { PrimaryButton } from "../common/PrimaryButton";
import type { RewardedAdStatus } from "../../types/game";
import { formatTimer } from "../../lib/format";

interface RewardedAdCardProps {
  adsEnabled?: boolean;
  loading?: boolean;
  onWatch: () => void;
  status: RewardedAdStatus;
}

export const RewardedAdCard = ({
  adsEnabled = false,
  loading = false,
  onWatch,
  status
}: RewardedAdCardProps) => {
  const [now, setNow] = useState(Date.now());
  const { copy } = useI18n();

  useEffect(() => {
    if (status.canClaim && adsEnabled) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [adsEnabled, status.canClaim]);

  const isActionDisabled = loading || !status.canClaim || !adsEnabled;
  const statusLabel = !adsEnabled
    ? copy.rewards.setupNeeded
    : status.canClaim
      ? copy.rewards.ready
      : formatTimer(status.nextClaimAt, now, copy.rewards.ready);

  return (
    <Card className="bg-vault-grid">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-white/[0.45]">
            {copy.rewards.rewardedBoost}
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {status.rewardPreview.label}
          </div>
          <div className="mt-1 text-sm text-soft">
            {adsEnabled
              ? copy.rewards.rewardedBoostBody(status.cooldownMinutes)
              : copy.rewards.rewardedBoostDisabled}
          </div>
        </div>
        <div className="rounded-full border border-accent-green/20 bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green">
          {statusLabel}
        </div>
      </div>
      <PrimaryButton
        className="mt-4"
        disabled={isActionDisabled}
        onClick={onWatch}
        variant="secondary"
      >
        {loading
          ? copy.rewards.verifyingBoost
          : !adsEnabled
            ? copy.rewards.adsComingSoon
            : status.canClaim
              ? copy.rewards.watchAdFor(status.rewardPreview.label)
              : copy.rewards.adCooldown}
      </PrimaryButton>
    </Card>
  );
};
