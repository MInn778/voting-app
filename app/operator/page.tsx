import Link from "next/link";
import { listPolls } from "@/lib/polls";
import { DeletePollButton } from "./delete-poll-button";

export const dynamic = "force-dynamic";

export default async function OperatorPage() {
  const polls = await listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">운영자</h1>
        <form action="/api/logout" method="post">
          <button type="submit" className="rounded border px-3 py-1">
            로그아웃
          </button>
        </form>
      </div>
      <Link href="/operator/new" className="mb-6 inline-block rounded bg-black px-3 py-2 text-white">
        새 투표 만들기
      </Link>
      {polls.length === 0 ? (
        <p className="text-gray-500">아직 만든 투표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {polls.map((poll) => (
            <li key={poll.id} className="flex items-center gap-4 rounded border p-4">
              <span className="flex-1">{poll.question}</span>
              <span className="text-gray-500">{poll.totalVotes}표</span>
              <Link href={`/polls/${poll.id}/results`} className="underline">
                결과 보기
              </Link>
              <DeletePollButton pollId={poll.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
