import { neon } from "@neondatabase/serverless";

// The only place in the app that talks to the database.
const sql = neon(process.env.DATABASE_URL!);

export type PollSummary = {
  id: string;
  question: string;
  createdAt: Date;
};

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql`
    select id, question, created_at from polls order by created_at desc
  `;
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    createdAt: new Date(row.created_at),
  }));
}
