import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireAppUser(request);

    return json(
      {
        message:
          "Telegram Stars payment verification placeholder. Final implementation should verify provider payloads idempotently before crediting inventory."
      },
      501
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return errorResponse(message, 401);
  }
});
