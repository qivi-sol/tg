import { configErrorMessage } from "../lib/config";
import { getSupabaseClient } from "./supabase";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

const extractFunctionError = async (error: unknown) => {
  if (!error || typeof error !== "object") {
    return new ApiError("Unknown request failure");
  }

  const maybeContext = "context" in error ? error.context : null;

  if (maybeContext instanceof Response) {
    const payload = await maybeContext
      .json()
      .catch(() => ({ error: maybeContext.statusText || "Request failed" }));

    return new ApiError(
      typeof payload?.error === "string" ? payload.error : "Request failed",
      maybeContext.status
    );
  }

  if ("message" in error && typeof error.message === "string") {
    return new ApiError(error.message);
  }

  return new ApiError("Request failed");
};

export const invokeEdge = async <TResponse>(
  name: string,
  options?: {
    body?: Record<string, unknown>;
    token?: string | null;
  }
): Promise<TResponse> => {
  if (configErrorMessage) {
    throw new ApiError(configErrorMessage, 500);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke(name, {
    body: options?.body ?? {},
    headers: options?.token
      ? {
          Authorization: `Bearer ${options.token}`
        }
      : undefined
  });

  if (error) {
    throw await extractFunctionError(error);
  }

  return data as TResponse;
};
