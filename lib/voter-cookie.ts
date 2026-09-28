import { cookies } from "next/headers";

// ADR-0001: "this browser voted in this Poll" lives only in a cookie. It gates the Result
// and blocks re-voting from the same browser; another browser can get around it by design.
// The value is the chosen Option's id, so only the Voter's own browser knows their choice.
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

export async function votedOptionId(pollId: string) {
  return (await cookies()).get(votedCookieName(pollId))?.value;
}
