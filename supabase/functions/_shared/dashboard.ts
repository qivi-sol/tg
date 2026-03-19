import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getBotUsername, serverConfig } from "./env.ts";
import { getNextDailyReward, serializeRaid } from "./raid.ts";
import type { Database } from "./database.types.ts";

type ServiceClient = SupabaseClient<Database>;
type UserRow = Database["public"]["Tables"]["users"]["Row"];

const mapUser = (user: UserRow) => ({
  id: user.id,
  telegramId: user.telegram_id,
  username: user.username,
  firstName: user.first_name,
  avatarUrl: user.avatar_url,
  coins: user.coins,
  keys: user.keys,
  lastAdRewardAt: user.last_ad_reward_at,
  shards: user.shards,
  vaultLevel: user.vault_level,
  activeDays: user.active_days,
  totalRaids: user.total_raids,
  totalCoinsEarned: user.total_coins_earned,
  totalShardsEarned: user.total_shards_earned,
  referralCode: user.referral_code,
  referredBy: user.referred_by,
  lastDailyClaimAt: user.last_daily_claim_at,
  createdAt: user.created_at,
  updatedAt: user.updated_at
});

export const buildReferralLink = (referralCode: string) => {
  const botUsername = getBotUsername();

  return botUsername
    ? `https://t.me/${botUsername}?startapp=ref_${referralCode}`
    : null;
};

export const buildDashboard = async (client: ServiceClient, userId: string) => {
  const userPromise = client.from("users").select("*").eq("id", userId).single();
  const claimsCountPromise = client
    .from("daily_claims")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const referralsPromise = client
    .from("referrals")
    .select("invited_user_id", { count: "exact" })
    .eq("inviter_user_id", userId);
  const bonusLogsPromise = client
    .from("economy_logs")
    .select("amount, meta")
    .eq("user_id", userId)
    .eq("type", "referral_bonus")
    .eq("currency", "keys");
  const activeRaidPromise = client
    .from("raids")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const [userResult, claimsCountResult, referralsResult, bonusLogsResult, activeRaidResult] =
    await Promise.all([
      userPromise,
      claimsCountPromise,
      referralsPromise,
      bonusLogsPromise,
      activeRaidPromise
    ]);

  if (userResult.error || !userResult.data) {
    throw new Error(userResult.error?.message ?? "User record not found.");
  }

  if (claimsCountResult.error) {
    throw new Error(claimsCountResult.error.message);
  }

  if (referralsResult.error) {
    throw new Error(referralsResult.error.message);
  }

  if (bonusLogsResult.error) {
    throw new Error(bonusLogsResult.error.message);
  }

  if (activeRaidResult.error) {
    throw new Error(activeRaidResult.error.message);
  }

  const user = userResult.data;
  const claimsCount = claimsCountResult.count ?? 0;
  const nextReward = getNextDailyReward(claimsCount);
  const lastClaimAt = user.last_daily_claim_at;
  const dailyCooldownMs = serverConfig.dailyRewardCooldownHours * 60 * 60 * 1000;
  const nextClaimAt =
    lastClaimAt && new Date(lastClaimAt).getTime() + dailyCooldownMs > Date.now()
      ? new Date(new Date(lastClaimAt).getTime() + dailyCooldownMs).toISOString()
      : null;
  const adRewardCooldownMs = serverConfig.adRewardCooldownMinutes * 60 * 1000;
  const nextAdRewardAt =
    user.last_ad_reward_at &&
    new Date(user.last_ad_reward_at).getTime() + adRewardCooldownMs > Date.now()
      ? new Date(new Date(user.last_ad_reward_at).getTime() + adRewardCooldownMs).toISOString()
      : null;

  const referralIds =
    referralsResult.data?.map((entry) => entry.invited_user_id).filter(Boolean) ?? [];
  let activeReferrals = 0;

  if (referralIds.length > 0) {
    const activeReferralResult = await client
      .from("users")
      .select("id", { count: "exact", head: true })
      .in("id", referralIds)
      .gt("total_raids", 0);

    if (activeReferralResult.error) {
      throw new Error(activeReferralResult.error.message);
    }

    activeReferrals = activeReferralResult.count ?? 0;
  }

  const referralBonusEarned =
    bonusLogsResult.data
      ?.filter((entry) => {
        const meta = entry.meta;
        return (
          meta &&
          typeof meta === "object" &&
          "role" in meta &&
          meta.role === "inviter"
        );
      })
      .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0) ?? 0;

  let activeRaid = null;

  if (activeRaidResult.data) {
    const cellsResult = await client
      .from("raid_cells")
      .select("*")
      .eq("raid_id", activeRaidResult.data.id)
      .order("cell_index", { ascending: true });

    if (cellsResult.error) {
      throw new Error(cellsResult.error.message);
    }

    activeRaid = serializeRaid(activeRaidResult.data, cellsResult.data ?? []);
  }

  return {
    adReward: {
      canClaim: !nextAdRewardAt,
      cooldownMinutes: serverConfig.adRewardCooldownMinutes,
      lastClaimAt: user.last_ad_reward_at,
      nextClaimAt: nextAdRewardAt,
      rewardPreview: {
        label: `+${serverConfig.adRewardKeys} Key`,
        type: "keys",
        value: serverConfig.adRewardKeys
      }
    },
    profile: mapUser(user),
    referrals: {
      totalReferrals: referralsResult.count ?? 0,
      activeReferrals,
      referralBonusEarned,
      referralLink: buildReferralLink(user.referral_code)
    },
    dailyReward: {
      canClaim: !nextClaimAt,
      lastClaimAt,
      nextClaimAt,
      rewardPreview: nextReward
    },
    activeRaid
  };
};
