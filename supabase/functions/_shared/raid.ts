import type { Database } from "./database.types.ts";

type RaidRow = Database["public"]["Tables"]["raids"]["Row"];
type RaidCellRow = Database["public"]["Tables"]["raid_cells"]["Row"];

const SAFE_CELL_TARGET = 8;
const COIN_VALUES = [90, 120, 150, 180, 220, 260];
const MULTIPLIER_VALUES = [1.25, 1.5, 1.75];

export const RAPID_TAP_COOLDOWN_MS = 650;
export const DAILY_REWARD_ROTATION = [
  { dayIndex: 1, rewardType: "keys", rewardValue: 2, label: "+2 Keys" },
  { dayIndex: 2, rewardType: "coins", rewardValue: 500, label: "+500 Coins" },
  { dayIndex: 3, rewardType: "shards", rewardValue: 1, label: "+1 Shard" }
] as const;

const cryptoRandom = () => {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] / 4294967295;
};

const randomInt = (min: number, max: number) =>
  Math.floor(cryptoRandom() * (max - min + 1)) + min;

const randomChoice = <T,>(items: readonly T[]) => items[randomInt(0, items.length - 1)];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }

  return copy;
};

const roundMultiplier = (value: number) => Math.round(value * 100) / 100;

export const createRaidLayout = () => {
  const indexes = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const multiplierCount = cryptoRandom() < 0.58 ? 2 : 1;
  const shardCount = cryptoRandom() < 0.18 ? 1 : 0;
  const cells: Array<Database["public"]["Tables"]["raid_cells"]["Insert"]> = [];

  const bombIndex = indexes.shift()!;
  cells.push({
    cell_index: bombIndex,
    cell_type: "bomb",
    value: 0,
    revealed: false,
    raid_id: ""
  });

  for (let index = 0; index < multiplierCount; index += 1) {
    const cellIndex = indexes.shift()!;
    cells.push({
      cell_index: cellIndex,
      cell_type: "multiplier",
      value: randomChoice(MULTIPLIER_VALUES),
      revealed: false,
      raid_id: ""
    });
  }

  for (let index = 0; index < shardCount; index += 1) {
    const cellIndex = indexes.shift()!;
    cells.push({
      cell_index: cellIndex,
      cell_type: "shard",
      value: 1,
      revealed: false,
      raid_id: ""
    });
  }

  for (const cellIndex of indexes) {
    cells.push({
      cell_index: cellIndex,
      cell_type: "coin",
      value: randomChoice(COIN_VALUES),
      revealed: false,
      raid_id: ""
    });
  }

  return cells.sort((left, right) => left.cell_index - right.cell_index);
};

export const formatCellLabel = (cellType: RaidCellRow["cell_type"], value: number) => {
  if (cellType === "coin") {
    return `+${Math.round(value)} coins`;
  }

  if (cellType === "multiplier") {
    return `x${value.toFixed(2)}`;
  }

  if (cellType === "shard") {
    return `+${Math.round(value)} shard`;
  }

  return "Bomb";
};

export const serializeRaid = (raid: RaidRow, cells: RaidCellRow[]) => ({
  id: raid.id,
  status: raid.status,
  temporaryCoins: Number(raid.temporary_coins),
  temporaryShards: Number(raid.temporary_shards),
  multiplierFactor: Number(raid.multiplier_factor),
  openedCellsCount: raid.opened_cells_count,
  startedAt: raid.started_at,
  endedAt: raid.ended_at,
  canCashOut: raid.status === "active" && raid.opened_cells_count > 0,
  cells: cells
    .slice()
    .sort((left, right) => left.cell_index - right.cell_index)
    .map((cell) => ({
      cellIndex: cell.cell_index,
      revealed: cell.revealed,
      cellType: cell.revealed ? cell.cell_type : undefined,
      value: cell.revealed ? cell.value : undefined,
      label: cell.revealed ? formatCellLabel(cell.cell_type, Number(cell.value)) : undefined
    }))
});

export const getNextDailyReward = (claimCount: number) => {
  return DAILY_REWARD_ROTATION[claimCount % DAILY_REWARD_ROTATION.length];
};

export const getRemainingCooldownMs = (lastActionAt: string | null) => {
  if (!lastActionAt) {
    return 0;
  }

  const elapsed = Date.now() - new Date(lastActionAt).getTime();
  return Math.max(0, RAPID_TAP_COOLDOWN_MS - elapsed);
};

export const applySafeCell = (
  raid: Pick<RaidRow, "multiplier_factor" | "temporary_coins" | "temporary_shards">,
  cell: Pick<RaidCellRow, "cell_type" | "value">
) => {
  let nextCoins = Number(raid.temporary_coins);
  let nextShards = Number(raid.temporary_shards);
  let nextMultiplier = Number(raid.multiplier_factor);

  if (cell.cell_type === "coin") {
    nextCoins += Math.round(Number(cell.value));
  }

  if (cell.cell_type === "multiplier") {
    nextMultiplier = roundMultiplier(Number(raid.multiplier_factor) * Number(cell.value));
    const currentCoins = Number(raid.temporary_coins);
    const boostedCoins = Math.round(currentCoins * Number(cell.value));
    const floorBonus = Math.round(currentCoins + Number(cell.value) * 95);
    nextCoins = Math.max(boostedCoins, floorBonus);
  }

  if (cell.cell_type === "shard") {
    nextShards += Math.round(Number(cell.value));
  }

  return {
    label: formatCellLabel(cell.cell_type, Number(cell.value)),
    nextCoins,
    nextMultiplier,
    nextShards,
    wonRaid: false
  };
};

export const isRaidFullyCleared = (openedCellsCount: number) =>
  openedCellsCount >= SAFE_CELL_TARGET;
