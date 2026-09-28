import Link from "next/link";

export default function PollNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <p className="mb-4">투표를 찾을 수 없습니다.</p>
      <Link href="/" className="underline">
        목록으로
      </Link>
    </main>
  );
}
