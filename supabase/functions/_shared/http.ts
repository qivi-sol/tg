import { corsHeaders } from "./cors.ts";

export const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });

export const errorResponse = (message: string, status = 400, details?: unknown) =>
  json(
    {
      error: message,
      details
    },
    status
  );

export const unwrapRpcRow = <T>(data: T | T[] | null | undefined): T | null => {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
};

export const formatActionError = (error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : "Request failed.";
  const [prefix, ...rest] = rawMessage.split(":");
  const normalizedPrefix = rest.length > 0 ? prefix : "";
  const message = rest.length > 0 ? rest.join(":").trim() : rawMessage;

  if (normalizedPrefix === "BAD_REQUEST") {
    return { message, status: 400 };
  }

  if (normalizedPrefix === "NOT_FOUND") {
    return { message, status: 404 };
  }

  if (normalizedPrefix === "CONFLICT") {
    return { message, status: 409 };
  }

  if (normalizedPrefix === "RATE_LIMIT") {
    return { message, status: 429 };
  }

  return { message, status: 500 };
};
