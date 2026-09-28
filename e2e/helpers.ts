import type { Page } from "@playwright/test";

export const PASSWORD = process.env.OPERATOR_PASSWORD!;

export async function logIn(page: Page, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
}
