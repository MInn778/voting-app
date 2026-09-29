"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// An Operator action that asks first, calls the API, then re-renders the operator list.
export function ConfirmActionButton({
  label,
  confirmMessage,
  url,
  method,
  className,
}: {
  label: string;
  confirmMessage: string;
  url: string;
  method: "POST" | "DELETE";
  className: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    const response = await fetch(url, { method });
    // 404: someone else already deleted it; refreshing shows the truth either way.
    if (!response.ok && response.status !== 404) {
      setBusy(false);
      return window.alert("처리하지 못했습니다. 다시 시도해 주세요.");
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`rounded border px-2 py-1 disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}
