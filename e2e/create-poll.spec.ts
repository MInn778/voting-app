import { expect, test, type Page } from "@playwright/test";
import { logIn, uniqueQuestion } from "./helpers";
import { listPolls } from "@/lib/polls";
import { TEST_PREFIX, deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

async function fillPoll(page: Page, question: string, options: string[]) {
  await page.goto("/operator/new");
  await page.getByLabel("질문").fill(question);
  for (let i = 2; i < options.length; i++) {
    await page.getByRole("button", { name: "선택지 추가" }).click();
  }
  for (const [i, label] of options.entries()) {
    await page.getByLabel(`선택지 ${i + 1}`, { exact: true }).fill(label);
  }
  await page.getByRole("button", { name: "투표 만들기" }).click();
}

test("진행 중인 투표가 없으면 첫 화면에 안내가 보인다", async ({ page }) => {
  await deleteTestPolls();
  // The DB is shared with real use; only checkable while it holds no real polls.
  test.skip((await listPolls()).length > 0, "실제 투표가 있어 빈 목록을 확인할 수 없음");
  await page.goto("/");
  await expect(page.getByText("진행 중인 투표가 없습니다")).toBeVisible();
});

test.describe("로그인한 운영자", () => {
  test.beforeEach(async ({ page }) => logIn(page));

  test("질문과 선택지로 투표를 만들면 운영자 목록과 첫 화면 목록에 보인다", async ({ page }) => {
    const question = uniqueQuestion("점심 메뉴");
    await fillPoll(page, question, ["치킨", "피자", "  짜장면  "]);

    await expect(page).toHaveURL("/operator");
    const operatorRow = page.getByRole("listitem").filter({ hasText: question });
    await expect(operatorRow).toContainText("0표");

    await page.goto("/");
    await expect(page.getByRole("link", { name: question })).toBeVisible();
  });

  test("가장 최근에 만든 투표가 목록 맨 위에 보인다", async ({ page }) => {
    const older = uniqueQuestion("먼저");
    const newer = uniqueQuestion("나중");
    await fillPoll(page, older, ["가", "나"]);
    await fillPoll(page, newer, ["가", "나"]);

    await page.goto("/");
    const questions = await page.getByRole("link").filter({ hasText: TEST_PREFIX }).allTextContents();
    expect(questions.indexOf(newer)).toBeLessThan(questions.indexOf(older));
  });

  test("선택지는 2개보다 적게 줄이거나 10개보다 많이 늘릴 수 없다", async ({ page }) => {
    await page.goto("/operator/new");
    await expect(page.getByRole("button", { name: /선택지 \d+ 삭제/ }).first()).toBeDisabled();
    for (let i = 2; i < 10; i++) {
      await page.getByRole("button", { name: "선택지 추가" }).click();
    }
    await expect(page.getByLabel(/^선택지 \d+$/)).toHaveCount(10);
    await expect(page.getByRole("button", { name: "선택지 추가" })).toBeDisabled();

    await page.getByRole("button", { name: "선택지 10 삭제" }).click();
    await expect(page.getByLabel(/^선택지 \d+$/)).toHaveCount(9);
  });

  test("빈 질문은 거부되고 이유가 보인다", async ({ page }) => {
    await fillPoll(page, "   ", ["가", "나"]);
    await expect(page.getByRole("alert").filter({ hasText: "질문을 입력해 주세요." })).toBeVisible();
    await expect(page).toHaveURL("/operator/new");
  });

  test("빈 선택지는 거부되고 이유가 보인다", async ({ page }) => {
    await fillPoll(page, uniqueQuestion("빈 선택지"), ["가", " "]);
    await expect(page.getByRole("alert").filter({ hasText: "빈 선택지가 있습니다." })).toBeVisible();
    await expect(page).toHaveURL("/operator/new");
  });

  test("API를 직접 호출해도 선택지 개수와 빈 칸 규칙이 지켜진다", async ({ page }) => {
    const post = (data: object) => page.request.post("/api/polls", { data });
    const tooMany = Array.from({ length: 11 }, (_, i) => `선택지${i}`);

    const oneOption = await post({ question: uniqueQuestion("API"), options: ["가"] });
    expect(oneOption.status()).toBe(400);
    expect((await oneOption.json()).error).toBe("선택지는 2~10개여야 합니다.");

    expect((await post({ question: uniqueQuestion("API"), options: tooMany })).status()).toBe(400);
    expect((await post({ question: "", options: ["가", "나"] })).status()).toBe(400);
    expect((await post({ question: uniqueQuestion("API"), options: ["가", ""] })).status()).toBe(400);
    expect((await post({ question: uniqueQuestion("API"), options: "가,나" })).status()).toBe(400);

    const ok = await post({
      question: uniqueQuestion("API 성공"),
      options: ["가", "나"],
      closesAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    expect(ok.status()).toBe(201);
  });
});

test("로그인하지 않은 사람의 투표 생성 요청은 거부된다", async ({ request }) => {
  const response = await request.post("/api/polls", {
    data: { question: uniqueQuestion("비로그인"), options: ["가", "나"] },
  });
  expect(response.status()).toBe(401);
});
