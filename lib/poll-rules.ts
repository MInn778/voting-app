// Pure rules for a new Poll, shared by the form (fast feedback) and the API (the authority).
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;
export const MAX_OPEN_DAYS = 7;
export const MAX_OPEN_MS = MAX_OPEN_DAYS * 24 * 60 * 60 * 1000;

export type PollInput = { question: string; options: string[]; closesAt: string };

export function validatePollInput(
  question: unknown,
  options: unknown,
  closesAt: unknown,
  now = Date.now(),
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

  const closesAtMs = typeof closesAt === "string" && closesAt ? Date.parse(closesAt) : NaN;
  if (Number.isNaN(closesAtMs)) return { ok: false, error: "마감 시각을 입력해 주세요." };
  if (closesAtMs <= now) return { ok: false, error: "마감 시각은 지금 이후여야 합니다." };
  if (closesAtMs > now + MAX_OPEN_MS) {
    return { ok: false, error: `마감 시각은 최대 ${MAX_OPEN_DAYS}일 뒤까지 정할 수 있습니다.` };
  }

  return {
    ok: true,
    poll: {
      question: trimmedQuestion,
      options: trimmedOptions,
      closesAt: new Date(closesAtMs).toISOString(),
    },
  };
}
