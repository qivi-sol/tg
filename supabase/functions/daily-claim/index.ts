import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDashboard } from "../_shared/dashboard.ts";
import { createServiceClient, serverConfig } from "../_shared/env.ts";
import { errorResponse, formatActionError, json, unwrapRpcRow } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAppUser(request);
    const client = createServiceClient();
    const claimResult = await client.rpc("claim_daily_reward_action", {
      p_cooldown_hours: serverConfig.dailyRewardCooldownHours,
      p_user_id: userId
    });

    const reward = unwrapRpcRow(claimResult.data);

    if (claimResult.error || !reward) {
      throw new Error(claimResult.error?.message ?? "Unable to claim daily reward.");
    }

    const dashboard = await buildDashboard(client, userId);

    return json({
      dashboard,
      reward: {
        label: reward.reward_label,
        type: reward.reward_type,
        value: reward.reward_value
      }
    });
  } catch (error) {
    const { message, status } = formatActionError(error);
    return errorResponse(message, status);
  }
});
