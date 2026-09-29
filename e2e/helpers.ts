import { expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { TEST_PREFIX } from "./test-db";

export const PASSWORD = process.env.OPERATOR_PASSWORD!;

// Every test Poll carries TEST_PREFIX so cleanup only ever touches test rows.
export function uniqueQuestion(label: string) {
  return `${TEST_PREFIX} ${label} ${Date.now()}`;
}

export async function logIn(page: Page, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
}

export const inFromNow = (ms: number) => new Date(Date.now() + ms).toISOString();
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Creates a Poll through the public API as a logged-in Operator; returns its id.
export async function createPoll(
  request: APIRequestContext,
  question: string,
  options: string[],
  closesAt = inFromNow(ONE_DAY_MS),
) {
  await request.post("/api/login", { form: { password: PASSWORD }, maxRedirects: 0 });
  const response = await request.post("/api/polls", { data: { question, options, closesAt } });
  if (response.status() !== 201) throw new Error(`createPoll failed: ${response.status()}`);
  return (await response.json()).id as string;
}

export async function vote(page: Page, pollId: string, option: string) {
  await page.goto(`/polls/${pollId}`);
  await page.getByLabel(option, { exact: true }).check();
  await page.getByRole("button", { name: "투표하기" }).click();
  await expect(page).toHaveURL(`/polls/${pollId}/results`);
}

// A fresh browser context has no cookies: a different anonymous Voter.
export async function voteAsNewVoter(browser: Browser, pollId: string, option: string) {
  const context = await browser.newContext();
  await vote(await context.newPage(), pollId, option);
  await context.close();
}
