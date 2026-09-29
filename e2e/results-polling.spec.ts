import { expect, test, type Page } from "@playwright/test";
import { createPoll, uniqueQuestion, vote, voteAsNewVoter } from "./helpers";
import { deletePollDirectly, deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

const POLL_INTERVAL_MS = 5_000;

// Marks the loaded document; the mark survives only if the page is never reloaded.
async function markDocument(page: Page) {
  await page.evaluate(() => ((window as unknown as { __mark: boolean }).__mark = true));
}
async function isSameDocument(page: Page) {
  return page.evaluate(() => (window as unknown as { __mark?: boolean }).__mark === true);
}

test("결과 화면을 연 채로 다른 사람이 투표하면 새로고침 없이 숫자가 바뀐다", async ({ page, browser, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("실시간"), ["가", "나"]);
  await vote(page, pollId, "가");
  await expect(page.getByText("총 1표")).toBeVisible();
  await markDocument(page);

  await voteAsNewVoter(browser, pollId, "나");

  await expect(page.getByText("총 2표")).toBeVisible({ timeout: POLL_INTERVAL_MS * 3 });
  await expect(page.getByRole("listitem").filter({ hasText: "나" })).toContainText("1표 · 50%");
  expect(await isSameDocument(page)).toBe(true);
});

test("결과 화면을 떠나면 폴링이 멈춘다", async ({ page, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("폴링 중지"), ["가", "나"]);
  await vote(page, pollId, "가");

  let resultRequests = 0;
  page.on("request", (req) => {
    if (req.url().includes(`/api/polls/${pollId}/results`)) resultRequests++;
  });
  await page.getByRole("link", { name: "목록으로" }).click();
  await expect(page).toHaveURL("/");
  await page.waitForTimeout(POLL_INTERVAL_MS * 2);
  expect(resultRequests).toBe(0);
});

test("폴링 중에 투표가 삭제되면 안내가 보인다", async ({ page, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("폴링 중 삭제"), ["가", "나"]);
  await vote(page, pollId, "가");
  await markDocument(page);

  await deletePollDirectly(pollId);

  await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible({ timeout: POLL_INTERVAL_MS * 3 });
  expect(await isSameDocument(page)).toBe(true);
});
