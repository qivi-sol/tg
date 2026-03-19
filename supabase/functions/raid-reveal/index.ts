import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDashboard } from "../_shared/dashboard.ts";
import { createServiceClient, serverConfig } from "../_shared/env.ts";
import { errorResponse, formatActionError, json, unwrapRpcRow } from "../_shared/http.ts";

interface RequestBody {
  cellIndex?: number;
  raidId?: string;
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAppUser(request);
    const { raidId, cellIndex } = (await request.json().catch(() => ({}))) as RequestBody;

    if (!raidId || typeof cellIndex !== "number") {
      return errorResponse("raidId and cellIndex are required.", 400);
    }

    const client = createServiceClient();
    const actionResult = await client.rpc("reveal_raid_cell_action", {
      p_cell_index: cellIndex,
      p_cooldown_ms: serverConfig.rapidTapCooldownMs,
      p_raid_id: raidId,
      p_user_id: userId
    });

    const action = unwrapRpcRow(actionResult.data);

    if (actionResult.error || !action) {
      throw new Error(actionResult.error?.message ?? "Unable to reveal cell.");
    }

    const dashboard = await buildDashboard(client, userId);

    return json({
      dashboard,
      raid: action.raid_status === "active" ? dashboard.activeRaid : null,
      rewardDelta: {
        label: action.reward_label,
        type: action.reward_type,
        value: action.reward_value
      },
      status: action.raid_status,
      message:
        action.raid_status === "lost"
          ? "Bomb hit."
          : action.raid_status === "won"
            ? "Raid fully cleared."
            : "Cell revealed."
    });
  } catch (error) {
    const { message, status } = formatActionError(error);
    return errorResponse(message, status);
  }
});
