import { useEffect, useState } from "react";
import { Card } from "../common/Card";
import { PrimaryButton } from "../common/PrimaryButton";
import type { DailyRewardStatus } from "../../types/game";
import { formatTimer } from "../../lib/format";

interface DailyRewardCardProps {
  loading?: boolean;
  onClaim: () => void;
  status: DailyRewardStatus;
}

export const DailyRewardCard = ({
  loading = false,
  onClaim,
  status
}: DailyRewardCardProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status.canClaim) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status.canClaim]);

  return (
    <Card className="bg-vault-grid">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-white/[0.45]">
            Daily Reward
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Day {status.rewardPreview.dayIndex}
          </div>
          <div className="mt-1 text-sm text-soft">{status.rewardPreview.label}</div>
        </div>
        <div className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
          {status.canClaim ? "Ready" : formatTimer(status.nextClaimAt, now)}
        </div>
      </div>
      <PrimaryButton
        className="mt-4"
        disabled={!status.canClaim || loading}
        onClick={onClaim}
      >
        {status.canClaim ? "Claim Daily Reward" : "On Cooldown"}
      </PrimaryButton>
    </Card>
  );
};
