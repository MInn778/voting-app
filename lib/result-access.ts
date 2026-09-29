import { isOperator } from "./operator-session";
import { hasVoted } from "./voter-cookie";

// Before the Closing Time only Voters who voted (and Operators) may see a Result;
// once Closed, anyone may.
export async function canSeeResult(poll: { id: string; closed: boolean }) {
  return poll.closed || (await hasVoted(poll.id)) || (await isOperator());
}
