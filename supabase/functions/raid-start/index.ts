import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDashboard } from "../_shared/dashboard.ts";
import { createServiceClient } from "../_shared/env.ts";
import { errorResponse, formatActionError, json, unwrapRpcRow } from "../_shared/http.ts";
import { createRaidLayout } from "../_shared/raid.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAppUser(request);
    const client = createServiceClient();

    const startResult = await client.rpc("start_raid_session", {
      p_cells: createRaidLayout(),
      p_user_id: userId
    });

    if (startResult.error) {
      const formatted = formatActionError(startResult.error);

      if (formatted.status === 409) {
        const dashboard = await buildDashboard(client, userId);
        return json({
          dashboard,
          raid: dashboard.activeRaid,
          status: "active",
          message: "Active raid resumed."
        });
      }

      return errorResponse(formatted.message, formatted.status);
    }

    if (!unwrapRpcRow(startResult.data)) {
      throw new Error("Failed to create raid.");
    }

    const dashboard = await buildDashboard(client, userId);

    return json({
      dashboard,
      raid: dashboard.activeRaid,
      status: "active",
      message: "Raid started."
    });
  } catch (error) {
    const { message, status } = formatActionError(error);
    return errorResponse(message, status);
  }
});
