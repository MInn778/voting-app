import { expect, test, type Browser, type Page } from "@playwright/test";
import { createPoll, logIn } from "./helpers";
import { TEST_PREFIX, deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

function uniqueQuestion(label: string) {
  return `${TEST_PREFIX} ${label} ${Date.now()}`;
}

async function vote(page: Page, pollId: string, option: string) {
  await page.goto(`/polls/${pollId}`);
  await page.getByLabel(option, { exact: true }).check();
  await page.getByRole("button", { name: "투표하기" }).click();
}

// A fresh browser context has no cookies: a different anonymous Voter.
async function voteAsNewVoter(browser: Browser, pollId: string, option: string) {
  const context = await browser.newContext();
  await vote(await context.newPage(), pollId, option);
  await context.close();
}

function resultRow(page: Page, label: string) {
  return page.getByRole("listitem").filter({ hasText: label });
}

test("투표자는 목록에서 투표를 골라 선택지 하나에 투표하고 결과를 본다", async ({ page, request }) => {
  const question = uniqueQuestion("점심");
  const pollId = await createPoll(request, question, ["치킨", "피자", "짜장면"]);

  await page.goto("/");
  await page.getByRole("link", { name: question }).click();
  await expect(page.getByRole("heading", { name: question })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(3);
  expect(await page.locator("form label").allTextContents()).toEqual(["치킨", "피자", "짜장면"]);

  await page.getByRole("button", { name: "투표하기" }).click();
  await expect(page).toHaveURL(`/polls/${pollId}`); // nothing picked: not submitted

  await page.getByLabel("피자", { exact: true }).check();
  await page.getByRole("button", { name: "투표하기" }).click();

  await expect(page).toHaveURL(`/polls/${pollId}/results`);
  await expect(resultRow(page, "피자")).toContainText("1표 · 100%");
  await expect(resultRow(page, "치킨")).toContainText("0표 · 0%");
  await expect(page.getByText("총 1표")).toBeVisible();
  await expect(page.getByRole("link", { name: "목록으로" })).toHaveAttribute("href", "/");
});

test("여러 투표자의 표가 득표수와 비율로 집계된다", async ({ browser, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("집계"), ["가", "나", "다"]);
  await voteAsNewVoter(browser, pollId, "가");
  await voteAsNewVoter(browser, pollId, "가");

  const context = await browser.newContext();
  const page = await context.newPage();
  await vote(page, pollId, "나");

  await expect(resultRow(page, "가")).toContainText("2표 · 67%");
  await expect(resultRow(page, "나")).toContainText("1표 · 33%");
  await expect(resultRow(page, "다")).toContainText("0표 · 0%");
  await expect(page.getByText("총 3표")).toBeVisible();
  await context.close();
});

test("같은 브라우저에서는 다시 투표할 수 없고 결과 화면으로 간다", async ({ page, context, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("재투표"), ["가", "나"]);

  // A second tab opened before voting holds a stale form.
  const staleTab = await context.newPage();
  await staleTab.goto(`/polls/${pollId}`);

  await vote(page, pollId, "가");
  await page.goto(`/polls/${pollId}`);
  await expect(page).toHaveURL(`/polls/${pollId}/results`);

  await staleTab.getByLabel("나", { exact: true }).check();
  await staleTab.getByRole("button", { name: "투표하기" }).click();
  await expect(staleTab).toHaveURL(`/polls/${pollId}/results`);
  await expect(staleTab.getByText("총 1표")).toBeVisible();
  await expect(resultRow(staleTab, "나")).toContainText("0표");
});

test("투표하지 않은 사람은 결과를 볼 수 없다", async ({ page, request, playwright }) => {
  const pollId = await createPoll(request, uniqueQuestion("게이팅"), ["가", "나"]);

  await page.goto(`/polls/${pollId}/results`);
  await expect(page).toHaveURL(`/polls/${pollId}`);

  const anonymous = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  expect((await anonymous.get(`/api/polls/${pollId}/results`)).status()).toBe(403);
  await anonymous.dispose();
});

test("운영자는 투표하지 않고도 결과를 볼 수 있다", async ({ page, request }) => {
  const question = uniqueQuestion("운영자 결과");
  const pollId = await createPoll(request, question, ["가", "나"]);

  await logIn(page);
  await page
    .getByRole("listitem")
    .filter({ hasText: question })
    .getByRole("link", { name: "결과 보기" })
    .click();
  await expect(page).toHaveURL(`/polls/${pollId}/results`);
  await expect(resultRow(page, "가")).toContainText("0표 · 0%");
  await expect(page.getByText("총 0표")).toBeVisible();

  const api = await page.request.get(`/api/polls/${pollId}/results`);
  expect(api.status()).toBe(200);
  expect((await api.json()).totalVotes).toBe(0);
});

test("다른 투표의 선택지로는 투표할 수 없다", async ({ page, request }) => {
  const pollA = await createPoll(request, uniqueQuestion("A"), ["가", "나"]);
  const pollB = await createPoll(request, uniqueQuestion("B"), ["다", "라"]);

  await page.goto(`/polls/${pollB}`);
  const optionOfB = await page.getByLabel("다", { exact: true }).getAttribute("value");

  const response = await page.request.post(`/api/polls/${pollA}/vote`, {
    form: { optionId: optionOfB! },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(400);
});

test("한 투표자가 여러 투표에 각각 한 번씩 투표할 수 있다", async ({ page, request }) => {
  const pollA = await createPoll(request, uniqueQuestion("여러 A"), ["가", "나"]);
  const pollB = await createPoll(request, uniqueQuestion("여러 B"), ["다", "라"]);

  await vote(page, pollA, "가");
  await expect(page).toHaveURL(`/polls/${pollA}/results`);
  await vote(page, pollB, "라");
  await expect(page).toHaveURL(`/polls/${pollB}/results`);
  await expect(resultRow(page, "라")).toContainText("1표");
});

test("없는 투표의 주소로 들어가면 안내가 보인다", async ({ page }) => {
  for (const id of ["00000000-0000-0000-0000-000000000000", "not-a-poll"]) {
    await page.goto(`/polls/${id}`);
    await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
    await page.goto(`/polls/${id}/results`);
    await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
  }
});
