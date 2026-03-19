import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/env.ts";
import { errorResponse, json } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAppUser(request);
    const client = createServiceClient();

    const [topUsersResult, currentUserResult] = await Promise.all([
      client
        .from("users")
        .select("id, first_name, username, avatar_url, total_coins_earned, vault_level")
        .order("total_coins_earned", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(50),
      client.from("users").select("id, total_coins_earned").eq("id", userId).single()
    ]);

    if (topUsersResult.error) {
      throw new Error(topUsersResult.error.message);
    }

    if (currentUserResult.error || !currentUserResult.data) {
      throw new Error(currentUserResult.error?.message ?? "Current user not found.");
    }

    const entries = (topUsersResult.data ?? []).map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      firstName: user.first_name,
      username: user.username,
      avatarUrl: user.avatar_url,
      totalCoinsEarned: user.total_coins_earned,
      vaultLevel: user.vault_level
    }));

    const higherEarners = await client
      .from("users")
      .select("id", { count: "exact", head: true })
      .gt("total_coins_earned", currentUserResult.data.total_coins_earned);

    if (higherEarners.error) {
      throw new Error(higherEarners.error.message);
    }

    return json({
      entries,
      currentUserRank: (higherEarners.count ?? 0) + 1
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load leaderboard.";
    return errorResponse(message, 500);
  }
});
