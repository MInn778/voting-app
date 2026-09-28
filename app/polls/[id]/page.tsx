import { notFound, redirect } from "next/navigation";
import { getPoll } from "@/lib/polls";
import { hasVoted } from "@/lib/voter-cookie";

export const dynamic = "force-dynamic";

export default async function PollPage(props: PageProps<"/polls/[id]">) {
  const { id } = await props.params;
  const poll = await getPoll(id);
  if (!poll) notFound();
  if (await hasVoted(id)) redirect(`/polls/${id}/results`);

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">{poll.question}</h1>
      <form action={`/api/polls/${id}/vote`} method="post" className="flex flex-col gap-3">
        {poll.options.map((option) => (
          <label key={option.id} className="flex items-center gap-3 rounded border p-4">
            <input type="radio" name="optionId" value={option.id} required />
            {option.label}
          </label>
        ))}
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          투표하기
        </button>
      </form>
    </main>
  );
}
