import type { NextRequest } from "next/server";
import { isOperator } from "@/lib/operator-session";
import { deletePoll } from "@/lib/polls";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/polls/[id]">) {
  if (!(await isOperator())) {
    return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!(await deletePoll(id))) {
    return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
