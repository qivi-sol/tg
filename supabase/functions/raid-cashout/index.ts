import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDashboard } from "../_shared/dashboard.ts";
import { createServiceClient, serverConfig } from "../_shared/env.ts";
import { errorResponse, formatActionError, json, unwrapRpcRow } from "../_shared/http.ts";

interface RequestBody {
  raidId?: string;
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAppUser(request);
    const { raidId } = (await request.json().catch(() => ({}))) as RequestBody;

    if (!raidId) {
      return errorResponse("raidId is required.", 400);
    }

    const client = createServiceClient();
    const actionResult = await client.rpc("cash_out_raid_action", {
      p_cooldown_ms: serverConfig.rapidTapCooldownMs,
      p_raid_id: raidId,
      p_user_id: userId
    });

    const action = unwrapRpcRow(actionResult.data);

    if (actionResult.error || !action) {
      throw new Error(actionResult.error?.message ?? "Unable to cash out.");
    }

    const dashboard = await buildDashboard(client, userId);

    return json({
      dashboard,
      creditedCoins: Number(action.credited_coins ?? 0),
      creditedShards: Number(action.credited_shards ?? 0),
      raid: null,
      status: "cashed_out",
      message: "Raid reward banked."
    });
  } catch (error) {
    const { message, status } = formatActionError(error);
    return errorResponse(message, status);
  }
});
