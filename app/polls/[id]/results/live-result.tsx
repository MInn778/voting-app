"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PollResult } from "@/lib/polls";

const POLL_INTERVAL_MS = 5_000;

// Starts from the server-rendered Result, then re-fetches it every 5s while mounted.
export function LiveResult({ initial, myOptionId }: { initial: PollResult; myOptionId?: string }) {
  const [result, setResult] = useState(initial);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = setInterval(async () => {
      const response = await fetch(`/api/polls/${initial.id}/results`, { cache: "no-store" }).catch(
        () => null,
      );
      if (response?.status === 404) {
        setGone(true);
        clearInterval(timer);
      } else if (response?.ok) {
        setResult(await response.json());
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [initial.id]);

  if (gone) {
    return (
      <main className="mx-auto w-full max-w-2xl p-8">
        <p className="mb-4">투표를 찾을 수 없습니다.</p>
        <Link href="/" className="underline">
          목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">{result.question}</h1>
      <ul className="mb-4 flex flex-col gap-2">
        {result.options.map((option) => (
          <li
            key={option.id}
            className={`flex justify-between rounded border p-4 ${
              option.id === myOptionId ? "border-green-600 bg-green-50 font-semibold" : ""
            }`}
          >
            <span>
              {option.label}
              {option.id === myOptionId && <span className="ml-2 text-green-700">✓ 내 선택</span>}
            </span>
            <span>
              {option.votes}표 · {option.percent}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mb-6 font-semibold">총 {result.totalVotes}표</p>
      <Link href="/" className="underline">
        목록으로
      </Link>
    </main>
  );
}
