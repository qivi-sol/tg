import type {
  DailyClaimResponse,
  LeaderboardResponse,
  RaidActionResponse,
  RewardedAdClaimResponse
} from "../types/game";
import { invokeEdge } from "./api";

export const gameService = {
  startRaid: (token: string) =>
    invokeEdge<RaidActionResponse>("raid-start", {
      token
    }),
  revealCell: (token: string, raidId: string, cellIndex: number) =>
    invokeEdge<RaidActionResponse>("raid-reveal", {
      token,
      body: {
        raidId,
        cellIndex
      }
    }),
  cashOutRaid: (token: string, raidId: string) =>
    invokeEdge<RaidActionResponse>("raid-cashout", {
      token,
      body: {
        raidId
      }
    }),
  claimDailyReward: (token: string) =>
    invokeEdge<DailyClaimResponse>("daily-claim", {
      token
    }),
  claimRewardedAd: (token: string) =>
    invokeEdge<RewardedAdClaimResponse>("rewarded-ad-claim", {
      token
    }),
  getLeaderboard: (token: string) =>
    invokeEdge<LeaderboardResponse>("leaderboard", {
      token
    })
};
