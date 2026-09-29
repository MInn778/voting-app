import { neon } from "@neondatabase/serverless";
import type { PollInput } from "./poll-rules";

// The only place in the app that talks to the database.
const sql = neon(process.env.DATABASE_URL!);

// Closed-ness is decided by the database clock (closes_at <= now()), never the app server's.
type ClosingState = { closesAt: string; closed: boolean };

export type PollSummary = ClosingState & {
  id: string;
  question: string;
  createdAt: Date;
  totalVotes: number;
};

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql`
    select p.id, p.question, p.created_at, p.closes_at, p.closes_at <= now() as closed,
      coalesce(sum(o.vote_count), 0)::int as total_votes
    from polls p
    left join options o on o.poll_id = p.id
    group by p.id
    order by p.created_at desc
  `;
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    createdAt: new Date(row.created_at),
    closesAt: new Date(row.closes_at).toISOString(),
    closed: row.closed,
    totalVotes: row.total_votes,
  }));
}

export type Poll = ClosingState & {
  id: string;
  question: string;
  options: { id: string; label: string }[];
};

export type PollResult = ClosingState & {
  id: string;
  question: string;
  totalVotes: number;
  options: { id: string; label: string; votes: number; percent: number }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findPollRows(id: string) {
  if (!UUID.test(id)) return [];
  return sql`
    select p.id, p.question, p.closes_at, p.closes_at <= now() as closed,
      o.id as option_id, o.label, o.vote_count
    from polls p
    join options o on o.poll_id = p.id
    where p.id = ${id}
    order by o.position
  `;
}

function closingState(row: Record<string, unknown>): ClosingState {
  return { closesAt: new Date(row.closes_at as string).toISOString(), closed: row.closed as boolean };
}

export async function getPoll(id: string): Promise<Poll | null> {
  const rows = await findPollRows(id);
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    question: rows[0].question,
    ...closingState(rows[0]),
    options: rows.map((row) => ({ id: row.option_id, label: row.label })),
  };
}

export async function getPollResult(id: string): Promise<PollResult | null> {
  const rows = await findPollRows(id);
  if (rows.length === 0) return null;
  const totalVotes = rows.reduce((sum, row) => sum + row.vote_count, 0);
  return {
    id: rows[0].id,
    question: rows[0].question,
    ...closingState(rows[0]),
    totalVotes,
    options: rows.map((row) => ({
      id: row.option_id,
      label: row.label,
      votes: row.vote_count,
      percent: totalVotes === 0 ? 0 : Math.round((row.vote_count / totalVotes) * 100),
    })),
  };
}

// Returns false when the Option does not belong to this Poll or the Poll is Closed. Both
// checks and the increment are one statement, so a Vote can't slip in after closing and
// concurrent Votes never overwrite each other.
export async function recordVote(pollId: string, optionId: string): Promise<boolean> {
  if (!UUID.test(pollId) || !UUID.test(optionId)) return false;
  const rows = await sql`
    update options o set vote_count = o.vote_count + 1
    from polls p
    where o.id = ${optionId} and o.poll_id = ${pollId}
      and p.id = o.poll_id and p.closes_at > now()
    returning o.id
  `;
  return rows.length === 1;
}

// Closing now means moving the Closing Time to now; an already Closed Poll keeps its time.
// Returns the resulting Closing Time, or null when there is no such Poll.
export async function closePoll(id: string): Promise<string | null> {
  if (!UUID.test(id)) return null;
  const rows = await sql`
    update polls set closes_at = least(closes_at, now()) where id = ${id} returning closes_at
  `;
  return rows.length === 1 ? new Date(rows[0].closes_at).toISOString() : null;
}

// Options (and their vote counts) go with the Poll via "on delete cascade".
export async function deletePoll(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const rows = await sql`delete from polls where id = ${id} returning id`;
  return rows.length === 1;
}

// One statement, so the Poll and its Options are saved together or not at all.
export async function createPoll({ question, options, closesAt }: PollInput): Promise<string> {
  const rows = await sql`
    with new_poll as (
      insert into polls (question, closes_at) values (${question}, ${closesAt}) returning id
    ), new_options as (
      insert into options (poll_id, label, position)
      select new_poll.id, o.label, o.position
      from new_poll, unnest(${options}::text[]) with ordinality as o(label, position)
    )
    select id from new_poll
  `;
  return rows[0].id;
}
