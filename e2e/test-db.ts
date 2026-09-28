import { neon } from "@neondatabase/serverless";

// Every poll a test creates must start with this prefix, so tests only ever
// touch their own rows in the shared Neon DB.
export const TEST_PREFIX = "[e2e]";

export async function deleteTestPolls() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`delete from polls where question like ${TEST_PREFIX + "%"}`;
}
