import { NextResponse, type NextRequest } from "next/server";
import { getPoll, recordVote } from "@/lib/polls";
import { hasVoted, votedCookieName, votedCookieOptions } from "@/lib/voter-cookie";

// A plain HTML form posts here; every outcome a Voter can reach ends in a redirect.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/polls/[id]/vote">) {
  const { id } = await ctx.params;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);

  if (!(await getPoll(id))) return redirectTo(`/polls/${id}`); // renders "not found"
  if (await hasVoted(id)) return redirectTo(`/polls/${id}/results`); // stale form resubmit

  const optionId = String((await request.formData()).get("optionId") ?? "");
  if (!(await recordVote(id, optionId))) {
    return Response.json({ error: "이 투표의 선택지가 아닙니다." }, { status: 400 });
  }

  const response = redirectTo(`/polls/${id}/results`);
  response.cookies.set(votedCookieName(id), optionId, votedCookieOptions);
  return response;
}
