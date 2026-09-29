"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { closingLabel } from "@/lib/closing-time";
import { MAKER_LABEL } from "@/lib/maker";
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
      <h1 className="mb-2 text-2xl font-bold">{result.question}</h1>
      <p className="text-sm text-gray-500">{MAKER_LABEL}</p>
      <p className="mb-6 text-sm text-gray-500">{closingLabel(result)}</p>
      <ul className="mb-4 flex flex-col gap-2">
        {result.options.map((option) => {
          const mine = option.id === myOptionId;
          return (
            <li
              key={option.id}
              className={`rounded border p-4 ${mine ? "border-green-600 bg-green-50 font-semibold" : ""}`}
            >
              <div className="flex justify-between">
                <span>
                  {option.label}
                  {mine && <span className="ml-2 text-green-700">✓ 내 선택</span>}
                </span>
                <span>
                  {option.votes}표 · {option.percent}%
                </span>
              </div>
              {/* The numbers above already say this; the bar is visual only. */}
              <div aria-hidden="true" className="mt-2 h-3 overflow-hidden rounded bg-gray-200">
                <div
                  data-bar
                  className={`h-full rounded transition-all duration-500 ${mine ? "bg-green-600" : "bg-blue-500"}`}
                  style={{ width: `${option.percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mb-6 font-semibold">총 {result.totalVotes}표</p>
      <Link href="/" className="underline">
        목록으로
      </Link>
    </main>
  );
}
