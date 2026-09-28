// Pure rules for a new Poll, shared by the form (fast feedback) and the API (the authority).
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export type PollInput = { question: string; options: string[] };

export function validatePollInput(
  question: unknown,
  options: unknown,
): { ok: true; poll: PollInput } | { ok: false; error: string } {
  const trimmedQuestion = typeof question === "string" ? question.trim() : "";
  if (!trimmedQuestion) return { ok: false, error: "질문을 입력해 주세요." };

  if (
    !Array.isArray(options) ||
    options.length < MIN_OPTIONS ||
    options.length > MAX_OPTIONS
  ) {
    return { ok: false, error: `선택지는 ${MIN_OPTIONS}~${MAX_OPTIONS}개여야 합니다.` };
  }

  const trimmedOptions = options.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (trimmedOptions.some((o) => !o)) return { ok: false, error: "빈 선택지가 있습니다." };

  return { ok: true, poll: { question: trimmedQuestion, options: trimmedOptions } };
}
