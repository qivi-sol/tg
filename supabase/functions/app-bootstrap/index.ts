import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDashboard } from "../_shared/dashboard.ts";
import { createServiceClient } from "../_shared/env.ts";
import { errorResponse, json } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAppUser(request);
    const client = createServiceClient();
    const dashboard = await buildDashboard(client, userId);

    return json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bootstrap failed.";
    return errorResponse(message, 401);
  }
});
