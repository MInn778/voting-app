"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_OPTIONS, MIN_OPTIONS, validatePollInput } from "@/lib/poll-rules";

let nextKey = 0;
const newOption = () => ({ key: nextKey++, label: "" });

export default function NewPollPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(() => [newOption(), newOption()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validatePollInput(question, options.map((o) => o.label));
    if (!result.ok) return setError(result.error);

    setSubmitting(true);
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.poll),
    });
    if (!response.ok) {
      setSubmitting(false);
      return setError((await response.json()).error ?? "투표를 만들지 못했습니다.");
    }
    router.push("/operator");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">새 투표 만들기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          질문
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1">
            선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
          </legend>
          {options.map((option, i) => (
            <div key={option.key} className="flex gap-2">
              <input
                aria-label={`선택지 ${i + 1}`}
                value={option.label}
                onChange={(e) =>
                  setOptions(
                    options.map((o) => (o.key === option.key ? { ...o, label: e.target.value } : o)),
                  )
                }
                className="flex-1 rounded border px-3 py-2"
              />
              <button
                type="button"
                aria-label={`선택지 ${i + 1} 삭제`}
                disabled={options.length <= MIN_OPTIONS}
                onClick={() => setOptions(options.filter((o) => o.key !== option.key))}
                className="rounded border px-3 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={options.length >= MAX_OPTIONS}
            onClick={() => setOptions([...options, newOption()])}
            className="self-start rounded border px-3 py-1 disabled:opacity-30"
          >
            선택지 추가
          </button>
        </fieldset>

        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          투표 만들기
        </button>
      </form>
    </main>
  );
}
