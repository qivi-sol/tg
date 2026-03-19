import { useEffect, useState } from "react";
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
    ? "Setup needed"
    : status.canClaim
      ? "Ready"
      : formatTimer(status.nextClaimAt, now);

  return (
    <Card className="bg-vault-grid">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-white/[0.45]">
            Rewarded Boost
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {status.rewardPreview.label}
          </div>
          <div className="mt-1 text-sm text-soft">
            {adsEnabled
              ? `One rewarded claim every ${status.cooldownMinutes} minutes in MVP mode.`
              : "Rewarded ad claims are scaffolded, but the live ad provider is not connected in this build."}
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
          ? "Verifying Boost..."
          : !adsEnabled
            ? "Ads Coming Soon"
            : status.canClaim
              ? `Watch Ad for ${status.rewardPreview.label}`
              : "Ad Cooldown"}
      </PrimaryButton>
    </Card>
  );
};
