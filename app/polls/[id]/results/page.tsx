import { notFound, redirect } from "next/navigation";
import { getPollResult } from "@/lib/polls";
import { canSeeResult } from "@/lib/result-access";
import { votedOptionId } from "@/lib/voter-cookie";
import { LiveResult } from "./live-result";

export const dynamic = "force-dynamic";

export default async function ResultPage(props: PageProps<"/polls/[id]/results">) {
  const { id } = await props.params;
  const result = await getPollResult(id);
  if (!result) notFound();
  if (!(await canSeeResult(result))) redirect(`/polls/${id}`);

  return <LiveResult initial={result} myOptionId={await votedOptionId(id)} />;
}
