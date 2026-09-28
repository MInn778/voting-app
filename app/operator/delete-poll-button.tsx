"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePollButton({ pollId }: { pollId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm("정말 삭제할까요?")) return;
    setDeleting(true);
    const response = await fetch(`/api/polls/${pollId}`, { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      setDeleting(false);
      return window.alert("삭제하지 못했습니다. 다시 시도해 주세요.");
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className="rounded border border-red-600 px-2 py-1 text-red-600 disabled:opacity-50"
    >
      삭제
    </button>
  );
}
