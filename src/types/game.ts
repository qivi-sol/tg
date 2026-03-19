export type Currency = "coins" | "keys" | "shards";
export type RaidStatus = "active" | "lost" | "cashed_out" | "won";
export type CellType = "coin" | "multiplier" | "bomb" | "shard";
export type AuthMode = "telegram" | "dev" | "unsupported";

export interface TelegramProfile {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export interface DevTelegramProfile extends TelegramProfile {
  isDev: true;
}

export interface AppUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  avatarUrl: string | null;
  coins: number;
  keys: number;
  lastAdRewardAt: string | null;
  shards: number;
  vaultLevel: number;
  activeDays: number;
  totalRaids: number;
  totalCoinsEarned: number;
  totalShardsEarned: number;
  referralCode: string;
  referredBy: string | null;
  lastDailyClaimAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralSummary {
  totalReferrals: number;
  activeReferrals: number;
  referralBonusEarned: number;
  referralLink: string | null;
}

export interface DailyRewardPreview {
  dayIndex: number;
  rewardType: Currency;
  rewardValue: number;
  label: string;
}

export interface DailyRewardStatus {
  canClaim: boolean;
  lastClaimAt: string | null;
  nextClaimAt: string | null;
  rewardPreview: DailyRewardPreview;
}

export interface RewardedAdStatus {
  canClaim: boolean;
  cooldownMinutes: number;
  lastClaimAt: string | null;
  nextClaimAt: string | null;
  rewardPreview: {
    label: string;
    type: Currency;
    value: number;
  };
}

export interface RaidCellView {
  cellIndex: number;
  revealed: boolean;
  cellType?: CellType;
  value?: number;
  label?: string;
}

export interface ActiveRaid {
  id: string;
  status: RaidStatus;
  temporaryCoins: number;
  temporaryShards: number;
  multiplierFactor: number;
  openedCellsCount: number;
  startedAt: string;
  endedAt: string | null;
  cells: RaidCellView[];
  canCashOut: boolean;
}

export interface DashboardData {
  adReward: RewardedAdStatus;
  profile: AppUser;
  referrals: ReferralSummary;
  dailyReward: DailyRewardStatus;
  activeRaid: ActiveRaid | null;
}

export interface AuthResponse {
  token: string;
  dashboard: DashboardData;
  devMode: boolean;
  isTelegram: boolean;
}

export interface DashboardResponse {
  dashboard: DashboardData;
}

export interface RewardPayload {
  type: Currency;
  value: number;
  label: string;
}

export interface DailyClaimResponse {
  dashboard: DashboardData;
  reward: RewardPayload;
}

export interface RewardedAdClaimResponse {
  dashboard: DashboardData;
  reward: RewardPayload;
}

export interface RaidActionResponse {
  dashboard: DashboardData;
  raid: ActiveRaid | null;
  rewardDelta?: RewardPayload;
  status: RaidStatus;
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string | null;
  username: string | null;
  avatarUrl: string | null;
  totalCoinsEarned: number;
  vaultLevel: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
}

export interface TelegramRuntimeContext {
  authMode: AuthMode;
  botUsernameConfigured: boolean;
  devUser?: DevTelegramProfile;
  initData: string;
  isDevMode: boolean;
  isTelegram: boolean;
  platform: string;
  startParam: string | null;
  unsupportedReason?: string;
  user: TelegramProfile | null;
  webAppAvailable: boolean;
}
