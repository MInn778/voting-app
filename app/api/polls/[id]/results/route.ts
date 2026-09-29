import type { NextRequest } from "next/server";
import { getPollResult } from "@/lib/polls";
import { canSeeResult } from "@/lib/result-access";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/polls/[id]/results">) {
  const { id } = await ctx.params;

  const result = await getPollResult(id);
  if (!result) return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  if (!(await canSeeResult(result))) {
    return Response.json({ error: "투표한 사람만 결과를 볼 수 있습니다." }, { status: 403 });
  }
  return Response.json(result);
}
