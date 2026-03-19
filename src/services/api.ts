import { configErrorMessage } from "../lib/config";
import { getSupabaseClient } from "./supabase";

const EDGE_FUNCTION_TIMEOUT_MS = 12_000;

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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = EDGE_FUNCTION_TIMEOUT_MS) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(
        new ApiError(
          "TON Vault backend is taking too long to respond. Check your connection and try again.",
          504
        )
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });

export const invokeEdge = async <TResponse>(
  name: string,
  options?: {
    body?: Record<string, unknown>;
    token?: string | null;
    timeoutMs?: number;
  }
): Promise<TResponse> => {
  if (configErrorMessage) {
    throw new ApiError(configErrorMessage, 500);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await withTimeout(
    supabase.functions.invoke(name, {
      body: options?.body ?? {},
      headers: options?.token
        ? {
            Authorization: `Bearer ${options.token}`
          }
        : undefined
    }),
    options?.timeoutMs
  );

  if (error) {
    throw await extractFunctionError(error);
  }

  return data as TResponse;
};
