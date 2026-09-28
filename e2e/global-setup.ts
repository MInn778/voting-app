import { deleteTestPolls } from "./test-db";

// Clear leftovers from a previous run that failed before its own cleanup.
export default async function globalSetup() {
  await deleteTestPolls();
}
