import type { AppUser } from "../types/game";

export interface VaultProgressionInput {
  activeDays: number;
  totalCoinsEarned: number;
  totalRaids: number;
  totalShardsEarned: number;
}

export interface VaultProgressionSnapshot {
  coinBonusPercent: number;
  currentLevelFloor: number;
  level: number;
  maxLevel: number;
  points: number;
  pointsPerLevel: number;
  pointsToNextLevel: number;
  progressPercent: number;
}

export const VAULT_PROGRESSION = {
  activeDayWeight: 18,
  coinBucketSize: 175,
  coinBonusPerLevel: 2,
  maxCoinBonusPercent: 20,
  maxLevel: 15,
  pointsPerLevel: 180,
  raidWeight: 26,
  shardWeight: 180
} as const;

export const getVaultPoints = ({
  activeDays,
  totalCoinsEarned,
  totalRaids,
  totalShardsEarned
}: VaultProgressionInput) =>
  Math.max(0, activeDays) * VAULT_PROGRESSION.activeDayWeight +
  Math.max(0, totalRaids) * VAULT_PROGRESSION.raidWeight +
  Math.floor(Math.max(0, totalCoinsEarned) / VAULT_PROGRESSION.coinBucketSize) +
  Math.max(0, totalShardsEarned) * VAULT_PROGRESSION.shardWeight;

export const getVaultProgression = (
  input: VaultProgressionInput | Pick<AppUser, "activeDays" | "totalCoinsEarned" | "totalRaids" | "totalShardsEarned">
): VaultProgressionSnapshot => {
  const points = getVaultPoints(input);
  const level = Math.min(
    VAULT_PROGRESSION.maxLevel,
    Math.floor(points / VAULT_PROGRESSION.pointsPerLevel) + 1
  );
  const currentLevelFloor = (level - 1) * VAULT_PROGRESSION.pointsPerLevel;
  const maxed = level >= VAULT_PROGRESSION.maxLevel;
  const pointsToNextLevel = maxed
    ? 0
    : level * VAULT_PROGRESSION.pointsPerLevel - points;
  const progressPercent = maxed
    ? 100
    : Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((points - currentLevelFloor) / VAULT_PROGRESSION.pointsPerLevel) * 100
          )
        )
      );

  return {
    coinBonusPercent: Math.min(
      VAULT_PROGRESSION.maxCoinBonusPercent,
      Math.max(0, (level - 1) * VAULT_PROGRESSION.coinBonusPerLevel)
    ),
    currentLevelFloor,
    level,
    maxLevel: VAULT_PROGRESSION.maxLevel,
    points,
    pointsPerLevel: VAULT_PROGRESSION.pointsPerLevel,
    pointsToNextLevel,
    progressPercent
  };
};

export const estimateCoinPayoutWithBonus = (
  baseCoins: number,
  coinBonusPercent: number
) =>
  Math.max(
    0,
    Math.round(baseCoins + (Math.max(0, baseCoins) * Math.max(0, coinBonusPercent)) / 100)
  );
