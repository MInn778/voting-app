import type { APIRequestContext, Page } from "@playwright/test";

export const PASSWORD = process.env.OPERATOR_PASSWORD!;

export async function logIn(page: Page, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
}

// Creates a Poll through the public API as a logged-in Operator; returns its id.
export async function createPoll(request: APIRequestContext, question: string, options: string[]) {
  await request.post("/api/login", { form: { password: PASSWORD }, maxRedirects: 0 });
  const response = await request.post("/api/polls", { data: { question, options } });
  if (response.status() !== 201) throw new Error(`createPoll failed: ${response.status()}`);
  return (await response.json()).id as string;
}
