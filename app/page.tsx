import Link from "next/link";
import { listPolls } from "@/lib/polls";

export const dynamic = "force-dynamic";

export default async function Home() {
  const polls = await listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">진행 중인 투표</h1>
      {polls.length === 0 ? (
        <p className="text-gray-500">진행 중인 투표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link href={`/polls/${poll.id}`} className="block rounded border p-4 hover:bg-gray-50">
                {poll.question}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
