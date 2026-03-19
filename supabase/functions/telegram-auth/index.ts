import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { signAppToken } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDashboard } from "../_shared/dashboard.ts";
import type { Database } from "../_shared/database.types.ts";
import { allowDevLogin, createServiceClient, getRequiredEnv } from "../_shared/env.ts";
import { errorResponse, json, unwrapRpcRow } from "../_shared/http.ts";
import { validateTelegramInitData } from "../_shared/telegram.ts";

type ServiceClient = SupabaseClient<Database>;

interface RequestBody {
  devUser?: {
    first_name?: string;
    id?: number | string;
    photo_url?: string;
    username?: string;
  };
  initData?: string;
  startParam?: string | null;
}

const normalizeReferralCode = (code: string) =>
  code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);

const randomCodeFragment = (length: number) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
};

const randomReferralCode = () =>
  normalizeReferralCode(`${randomCodeFragment(4)}${Date.now().toString(36).slice(-4)}`);

const generateReferralCode = async (client: ServiceClient) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomReferralCode();
    const { data, error } = await client
      .from("users")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique referral code.");
};

const applyReferralBonus = async (
  client: ServiceClient,
  inviteeUserId: string,
  inviterCode: string
) => {
  const referralResult = await client.rpc("apply_referral_bonus_on_signup", {
    p_invitee_user_id: inviteeUserId,
    p_inviter_code: normalizeReferralCode(inviterCode)
  });

  if (referralResult.error) {
    throw new Error(referralResult.error.message);
  }

  return unwrapRpcRow(referralResult.data);
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const client = createServiceClient();
    const body = (await request.json().catch(() => ({}))) as RequestBody;

    let devMode = false;
    let telegramUser: RequestBody["devUser"] | null = null;
    let startParam = body.startParam ?? null;

    if (body.initData) {
      const validation = await validateTelegramInitData(
        body.initData,
        getRequiredEnv("TELEGRAM_BOT_TOKEN")
      );
      telegramUser = validation.user;
      startParam = startParam ?? validation.startParam ?? null;
    } else if (allowDevLogin() && body.devUser) {
      devMode = true;
      telegramUser = body.devUser;
    } else if (body.devUser) {
      return errorResponse(
        "Development login is disabled for this environment. Open TON Vault inside Telegram instead.",
        401
      );
    } else {
      return errorResponse("Telegram init data is required.", 401);
    }

    if (!telegramUser?.id) {
      return errorResponse("Telegram user payload is missing.", 401);
    }

    const telegramId = String(telegramUser.id);
    const userResult = await client
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (userResult.error) {
      throw new Error(userResult.error.message);
    }

    let user = userResult.data;
    let isNewUser = false;

    if (user) {
      const updates = {
        avatar_url: telegramUser.photo_url ?? user.avatar_url,
        first_name: telegramUser.first_name ?? user.first_name,
        username: telegramUser.username ?? user.username
      };

      const updateResult = await client
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateResult.error) {
        throw new Error(updateResult.error.message);
      }

      user = updateResult.data ?? user;
    } else {
      isNewUser = true;
      const insertResult = await client
        .from("users")
        .insert({
          avatar_url: telegramUser.photo_url ?? null,
          coins: 0,
          first_name: telegramUser.first_name ?? null,
          keys: 5,
          referral_code: await generateReferralCode(client),
          shards: 0,
          telegram_id: telegramId,
          total_coins_earned: 0,
          total_raids: 0,
          total_shards_earned: 0,
          username: telegramUser.username ?? null,
          vault_level: 1
        })
        .select("*")
        .single();

      if (insertResult.error || !insertResult.data) {
        throw new Error(insertResult.error?.message ?? "Failed to create user.");
      }

      user = insertResult.data;
    }

    if (!user) {
      throw new Error("Unable to resolve user.");
    }

    if (isNewUser && startParam?.startsWith("ref_")) {
      await applyReferralBonus(client, user.id, startParam.slice(4));
    }

    const token = await signAppToken({
      sub: user.id,
      telegram_id: telegramId
    });
    const dashboard = await buildDashboard(client, user.id);

    return json({
      token,
      dashboard,
      devMode,
      isTelegram: !devMode
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return errorResponse(message, 500);
  }
});
