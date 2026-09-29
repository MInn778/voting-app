import { isOperator } from "@/lib/operator-session";
import { validatePollInput } from "@/lib/poll-rules";
import { createPoll } from "@/lib/polls";

export async function POST(request: Request) {
  if (!(await isOperator())) {
    return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = validatePollInput(body?.question, body?.options, body?.closesAt);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  const id = await createPoll(result.poll);
  return Response.json({ id }, { status: 201 });
}
