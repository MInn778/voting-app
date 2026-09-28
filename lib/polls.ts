import { neon } from "@neondatabase/serverless";
import type { PollInput } from "./poll-rules";

// The only place in the app that talks to the database.
const sql = neon(process.env.DATABASE_URL!);

export type PollSummary = {
  id: string;
  question: string;
  createdAt: Date;
  totalVotes: number;
};

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql`
    select p.id, p.question, p.created_at, coalesce(sum(o.vote_count), 0)::int as total_votes
    from polls p
    left join options o on o.poll_id = p.id
    group by p.id
    order by p.created_at desc
  `;
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    createdAt: new Date(row.created_at),
    totalVotes: row.total_votes,
  }));
}

// One statement, so the Poll and its Options are saved together or not at all.
export async function createPoll({ question, options }: PollInput): Promise<string> {
  const rows = await sql`
    with new_poll as (
      insert into polls (question) values (${question}) returning id
    ), new_options as (
      insert into options (poll_id, label, position)
      select new_poll.id, o.label, o.position
      from new_poll, unnest(${options}::text[]) with ordinality as o(label, position)
    )
    select id from new_poll
  `;
  return rows[0].id;
}
