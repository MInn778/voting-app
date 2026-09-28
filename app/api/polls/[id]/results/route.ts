import type { NextRequest } from "next/server";
import { isOperator } from "@/lib/operator-session";
import { getPollResult } from "@/lib/polls";
import { hasVoted } from "@/lib/voter-cookie";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/polls/[id]/results">) {
  const { id } = await ctx.params;

  if (!(await hasVoted(id)) && !(await isOperator())) {
    return Response.json({ error: "투표한 사람만 결과를 볼 수 있습니다." }, { status: 403 });
  }

  const result = await getPollResult(id);
  if (!result) return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  return Response.json(result);
}
