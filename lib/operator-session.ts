import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// ADR-0001: every Operator shares one password; the session is a signed expiry, no account.
export const SESSION_COOKIE = "operator_session";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function isOperatorPassword(password: string) {
  return safeEqual(password, process.env.OPERATOR_PASSWORD!);
}

export function createSessionToken(now = Date.now()) {
  const expiresAt = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidSessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || !safeEqual(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > now;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// For Route Handlers and pages: re-verify the session instead of trusting the proxy alone.
export async function isOperator() {
  return isValidSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
