import { expect, test, type Page } from "@playwright/test";
import { createPoll, logIn, uniqueQuestion } from "./helpers";
import { deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

function row(page: Page, question: string) {
  return page.getByRole("listitem").filter({ hasText: question });
}

function currentKoreanMinute() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return `${parts.month} ${parts.day}일 ${parts.hour}:${parts.minute}`;
}

test("확인에서 취소하면 투표는 마감되지 않는다", async ({ page, request }) => {
  const question = uniqueQuestion("마감 취소");
  await createPoll(request, question, ["가", "나"]);
  await logIn(page);

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("지금 마감할까요?");
    return dialog.dismiss();
  });
  await row(page, question).getByRole("button", { name: "지금 마감" }).click();

  await page.reload();
  await expect(row(page, question)).toContainText("마감: ");
  await expect(row(page, question)).not.toContainText("마감됨");
});

test("운영자가 직접 마감하면 마감 시각이 그 순간으로 바뀌고 투표가 막힌다", async ({ page, browser, request }) => {
  const question = uniqueQuestion("직접 마감");
  const pollId = await createPoll(request, question, ["가", "나"]);
  await logIn(page);

  page.once("dialog", (dialog) => dialog.accept());
  const before = currentKoreanMinute();
  await row(page, question).getByRole("button", { name: "지금 마감" }).click();
  await expect(row(page, question)).toContainText("마감됨 · ");
  // The click may straddle a minute boundary.
  const closedAround = new RegExp(`마감됨 · (${before}|${currentKoreanMinute()})`);

  await expect(row(page, question)).toContainText(closedAround);
  await expect(row(page, question).getByRole("button", { name: "지금 마감" })).toHaveCount(0);

  const voter = await browser.newContext();
  const voterPage = await voter.newPage();
  await voterPage.goto("/");
  await expect(row(voterPage, question)).toContainText(closedAround);
  await voterPage.goto(`/polls/${pollId}`);
  await expect(voterPage).toHaveURL(`/polls/${pollId}/results`);
  await voter.close();
});

test("이미 마감된 투표를 다시 마감해도 마감 시각은 바뀌지 않는다", async ({ page, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("재마감"), ["가", "나"]);
  await logIn(page);

  const first = await page.request.post(`/api/polls/${pollId}/close`);
  expect(first.status()).toBe(200);
  const { closesAt } = await first.json();

  await page.waitForTimeout(1_100);
  const second = await page.request.post(`/api/polls/${pollId}/close`);
  expect(second.status()).toBe(200);
  expect((await second.json()).closesAt).toBe(closesAt);
});

test("로그인하지 않은 사람의 마감 요청은 거부된다", async ({ page, request, playwright }) => {
  const question = uniqueQuestion("비로그인 마감");
  const pollId = await createPoll(request, question, ["가", "나"]);

  const anonymous = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  expect((await anonymous.post(`/api/polls/${pollId}/close`)).status()).toBe(401);
  await anonymous.dispose();

  await page.goto("/");
  await expect(row(page, question)).not.toContainText("마감됨");
});
