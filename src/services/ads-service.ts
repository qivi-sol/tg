import { appConfig } from "../lib/config";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const adsService = {
  watchRewardedAd: async () => {
    if (!appConfig.enableDevAdsMock) {
      throw new Error(
        "Rewarded ads are not connected yet. Enable VITE_ENABLE_DEV_ADS_MOCK for local MVP testing."
      );
    }

    // TODO: Replace this mock wait with the real Monetag rewarded-ad lifecycle.
    await wait(1800);

    return {
      rewardType: "keys" as const,
      rewardValue: appConfig.adRewardKeyReward
    };
  }
};
