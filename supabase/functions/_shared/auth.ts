import { getRequiredEnv } from "./env.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBytes = (value: string | Uint8Array) =>
  typeof value === "string" ? encoder.encode(value) : value;

const toBase64Url = (value: string | Uint8Array) => {
  const bytes = toBytes(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4 || 4)) % 4)}`;
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const timingSafeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
};

const hmacSha256 = async (key: string | Uint8Array, message: string | Uint8Array) => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBytes(key),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, toBytes(message))
  );
};

interface AppTokenPayload {
  exp: number;
  iat: number;
  sub: string;
  telegram_id: string;
}

export const signAppToken = async (payload: {
  sub: string;
  telegram_id: string;
}) => {
  const secret = getRequiredEnv("APP_JWT_SECRET");
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AppTokenPayload = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(fullPayload));
  const signature = await hmacSha256(secret, `${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${toBase64Url(signature)}`;
};

export const verifyAppToken = async (token: string): Promise<AppTokenPayload> => {
  const secret = getRequiredEnv("APP_JWT_SECRET");
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Malformed session token.");
  }

  const expectedSignature = await hmacSha256(
    secret,
    `${encodedHeader}.${encodedPayload}`
  );
  const receivedSignature = fromBase64Url(encodedSignature);

  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new Error("Invalid session token signature.");
  }

  const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload))) as AppTokenPayload;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Session token expired.");
  }

  return payload;
};

export const requireAppUser = async (request: Request) => {
  const authorization = request.headers.get("Authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Missing Authorization bearer token.");
  }

  const token = authorization.slice("Bearer ".length).trim();
  const payload = await verifyAppToken(token);
  return {
    telegramId: payload.telegram_id,
    userId: payload.sub
  };
};
