import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.OPERATOR_PASSWORD!;
const ONE_DAY_SECONDS = 24 * 60 * 60;

async function logIn(page: Page, password: string) {
  await page.goto("/login");
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
}

test("운영자가 올바른 비밀번호로 로그인하면 운영자 화면으로 간다", async ({ page }) => {
  await logIn(page, PASSWORD);
  await expect(page).toHaveURL("/operator");
  await expect(page.getByRole("heading", { name: "운영자" })).toBeVisible();
});

test("틀린 비밀번호로는 로그인되지 않고 오류가 보인다", async ({ page }) => {
  await logIn(page, PASSWORD + "-wrong");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("alert")).toHaveText("비밀번호가 올바르지 않습니다.");
  await page.goto("/operator");
  await expect(page).toHaveURL(/\/login/);
});

test("로그인하지 않고 운영자 화면에 들어가면 로그인 화면으로 간다", async ({ page }) => {
  await page.goto("/operator");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/operator/new");
  await expect(page).toHaveURL(/\/login/);
});

test("로그인은 1일 동안 유지된다", async ({ page, context }) => {
  await logIn(page, PASSWORD);
  await expect(page).toHaveURL("/operator");
  const [session] = await context.cookies();
  expect(session.httpOnly).toBe(true);
  const secondsLeft = session.expires - Date.now() / 1000;
  expect(secondsLeft).toBeGreaterThan(ONE_DAY_SECONDS - 120);
  expect(secondsLeft).toBeLessThanOrEqual(ONE_DAY_SECONDS);
});

test("로그아웃하면 다시 운영자 화면에 들어갈 수 없다", async ({ page }) => {
  await logIn(page, PASSWORD);
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/operator");
  await expect(page).toHaveURL(/\/login/);
});

test("변조된 세션 쿠키는 로그인으로 인정되지 않는다", async ({ page, context }) => {
  await logIn(page, PASSWORD);
  const [session] = await context.cookies();
  const [expiresAt] = session.value.split(".");
  await context.clearCookies();
  // Push the expiry a year out but keep the old signature.
  const forged = `${Number(expiresAt) + 365 * ONE_DAY_SECONDS * 1000}.${session.value.split(".")[1]}`;
  await context.addCookies([{ ...session, value: forged }]);
  await page.goto("/operator");
  await expect(page).toHaveURL(/\/login/);
});
