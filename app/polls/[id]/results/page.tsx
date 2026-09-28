import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isOperator } from "@/lib/operator-session";
import { getPollResult } from "@/lib/polls";
import { hasVoted } from "@/lib/voter-cookie";

export const dynamic = "force-dynamic";

export default async function ResultPage(props: PageProps<"/polls/[id]/results">) {
  const { id } = await props.params;
  const result = await getPollResult(id);
  if (!result) notFound();
  if (!(await hasVoted(id)) && !(await isOperator())) redirect(`/polls/${id}`);

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">{result.question}</h1>
      <ul className="mb-4 flex flex-col gap-2">
        {result.options.map((option) => (
          <li key={option.id} className="flex justify-between rounded border p-4">
            <span>{option.label}</span>
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
