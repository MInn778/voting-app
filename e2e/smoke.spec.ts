import { expect, test } from "@playwright/test";
import { listPolls } from "@/lib/polls";

test("앱 첫 화면이 열린다", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});

test("투표 모듈이 Neon DB에 연결되어 투표 목록을 읽는다", async () => {
  const polls = await listPolls();
  expect(Array.isArray(polls)).toBe(true);
});
