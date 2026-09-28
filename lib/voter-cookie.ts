import { cookies } from "next/headers";

// ADR-0001: "this browser voted in this Poll" lives only in a cookie. It gates the Result
// and blocks re-voting from the same browser; another browser can get around it by design.
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function votedCookieName(pollId: string) {
  return `voted_${pollId}`;
}

export const votedCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
};

export async function hasVoted(pollId: string) {
  return (await cookies()).has(votedCookieName(pollId));
}
