import type { NextRequest } from "next/server";
import { isOperator } from "@/lib/operator-session";
import { closePoll } from "@/lib/polls";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/polls/[id]/close">) {
  if (!(await isOperator())) {
    return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const closesAt = await closePoll(id);
  if (!closesAt) return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  return Response.json({ closesAt });
}
