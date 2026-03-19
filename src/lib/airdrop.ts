import type { DashboardData } from "../types/game";

export const calculateAirdropScore = (dashboard: DashboardData) => {
  const { profile, referrals } = dashboard;

  return (
    profile.activeDays * 8 +
    profile.totalRaids * 3 +
    profile.totalShardsEarned * 40 +
    referrals.activeReferrals * 60 +
    referrals.totalReferrals * 20
  );
};
