import Link from "next/link";
import { closingLabel } from "@/lib/closing-time";
import { MAKER_LABEL } from "@/lib/maker";
import { listPolls } from "@/lib/polls";

export const dynamic = "force-dynamic";

export default async function Home() {
  const polls = await listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">진행 중인 투표</h1>
        <Link href="/operator" className="text-sm text-gray-500 underline">
          운영자 로그인
        </Link>
      </div>
      {polls.length === 0 ? (
        <p className="text-gray-500">진행 중인 투표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {polls.map((poll) => (
            <li key={poll.id} className="flex items-center rounded border hover:bg-gray-50">
              <div className="flex-1 p-4">
                <Link href={`/polls/${poll.id}`} className="block">
                  {poll.question}
                </Link>
                <span className="text-xs text-gray-500">{MAKER_LABEL}</span>
              </div>
              <span className={`pr-4 text-sm ${poll.closed ? "text-red-600" : "text-gray-500"}`}>
                {closingLabel(poll)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
