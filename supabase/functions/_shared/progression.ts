const VAULT_POINTS_PER_LEVEL = 180;
const VAULT_MAX_LEVEL = 15;
const VAULT_MAX_COIN_BONUS_PERCENT = 20;

interface VaultProgressionInput {
  active_days: number;
  total_coins_earned: number;
  total_raids: number;
  total_shards_earned: number;
}

export const getVaultPoints = ({
  active_days,
  total_coins_earned,
  total_raids,
  total_shards_earned
}: VaultProgressionInput) =>
  Math.max(0, active_days) * 18 +
  Math.max(0, total_raids) * 26 +
  Math.floor(Math.max(0, total_coins_earned) / 175) +
  Math.max(0, total_shards_earned) * 180;

export const getVaultProgression = (input: VaultProgressionInput) => {
  const points = getVaultPoints(input);
  const level = Math.min(VAULT_MAX_LEVEL, Math.floor(points / VAULT_POINTS_PER_LEVEL) + 1);
  const coinBonusPercent = Math.min(
    VAULT_MAX_COIN_BONUS_PERCENT,
    Math.max(0, (level - 1) * 2)
  );

  return {
    coinBonusPercent,
    level,
    points
  };
};
