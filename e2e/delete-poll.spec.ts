import { expect, test, type Page } from "@playwright/test";
import { createPoll, logIn } from "./helpers";
import { TEST_PREFIX, deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

function uniqueQuestion(label: string) {
  return `${TEST_PREFIX} ${label} ${Date.now()}`;
}

function operatorRow(page: Page, question: string) {
  return page.getByRole("listitem").filter({ hasText: question });
}

test("삭제 확인에서 취소하면 투표가 그대로 남는다", async ({ page, request }) => {
  const question = uniqueQuestion("취소");
  await createPoll(request, question, ["가", "나"]);
  await logIn(page);

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("정말 삭제할까요?");
    return dialog.dismiss();
  });
  await operatorRow(page, question).getByRole("button", { name: "삭제" }).click();

  await page.reload();
  await expect(operatorRow(page, question)).toBeVisible();
});

test("표를 받은 투표를 삭제하면 두 목록에서 사라지고 주소로도 찾을 수 없다", async ({ page, browser, request }) => {
  const question = uniqueQuestion("삭제");
  const pollId = await createPoll(request, question, ["가", "나"]);

  const voter = await browser.newContext();
  const voterPage = await voter.newPage();
  await voterPage.goto(`/polls/${pollId}`);
  await voterPage.getByLabel("가", { exact: true }).check();
  await voterPage.getByRole("button", { name: "투표하기" }).click();
  await expect(voterPage.getByText("총 1표")).toBeVisible();

  await logIn(page);
  await expect(operatorRow(page, question)).toContainText("1표");
  page.once("dialog", (dialog) => dialog.accept());
  await operatorRow(page, question).getByRole("button", { name: "삭제" }).click();
  await expect(operatorRow(page, question)).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByRole("link", { name: question })).toHaveCount(0);

  await voterPage.goto(`/polls/${pollId}`);
  await expect(voterPage.getByText("투표를 찾을 수 없습니다")).toBeVisible();
  await voterPage.goto(`/polls/${pollId}/results`);
  await expect(voterPage.getByText("투표를 찾을 수 없습니다")).toBeVisible();
  await voter.close();
});

test("로그인하지 않은 사람의 삭제 요청은 거부된다", async ({ page, request, playwright }) => {
  const question = uniqueQuestion("비로그인 삭제");
  const pollId = await createPoll(request, question, ["가", "나"]);

  const anonymous = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  expect((await anonymous.delete(`/api/polls/${pollId}`)).status()).toBe(401);
  await anonymous.dispose();

  await page.goto("/");
  await expect(page.getByRole("link", { name: question })).toBeVisible();
});
