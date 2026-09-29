import { expect, test } from "@playwright/test";
import { ONE_DAY_MS, createPoll, inFromNow, logIn, uniqueQuestion } from "./helpers";
import { deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

const KOREAN_TIME = /\d+월 \d+일 \d{2}:\d{2}/;

test("투표 만들기 화면의 마감 시각은 기본 24시간 뒤이고 최대 7일 뒤까지 고를 수 있다", async ({ page }) => {
  await logIn(page);
  await page.goto("/operator/new");
  const input = page.getByLabel(/마감 시각/);
  await expect(input).not.toHaveValue("");

  const [value, min, max] = await input.evaluate((el: HTMLInputElement) => [el.value, el.min, el.max]);
  const hoursAhead = (new Date(value).getTime() - Date.now()) / 3_600_000;
  expect(hoursAhead).toBeGreaterThan(23.9);
  expect(hoursAhead).toBeLessThanOrEqual(24);
  const openDays = (new Date(max).getTime() - new Date(min).getTime()) / ONE_DAY_MS;
  expect(Math.round(openDays)).toBe(7);
});

test("화면에서 지난 마감 시각을 고르면 거부되고 이유가 보인다", async ({ page }) => {
  await logIn(page);
  await page.goto("/operator/new");
  await page.getByLabel("질문").fill(uniqueQuestion("지난 마감"));
  await page.getByLabel("선택지 1", { exact: true }).fill("가");
  await page.getByLabel("선택지 2", { exact: true }).fill("나");
  await page.getByLabel(/마감 시각/).fill("2020-01-01T09:00");
  await page.getByRole("button", { name: "투표 만들기" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "마감 시각은 지금 이후여야 합니다." })).toBeVisible();
});

test("API에서도 마감 시각 규칙이 지켜진다", async ({ page }) => {
  await logIn(page);
  const post = (closesAt?: string) =>
    page.request.post("/api/polls", {
      data: { question: uniqueQuestion("마감 API"), options: ["가", "나"], closesAt },
    });

  const missing = await post(undefined);
  expect(missing.status()).toBe(400);
  expect((await missing.json()).error).toBe("마감 시각을 입력해 주세요.");

  const past = await post(inFromNow(-60_000));
  expect((await past.json()).error).toBe("마감 시각은 지금 이후여야 합니다.");

  const tooLate = await post(inFromNow(7 * ONE_DAY_MS + 60 * 60_000));
  expect(tooLate.status()).toBe(400);
  expect((await tooLate.json()).error).toBe("마감 시각은 최대 7일 뒤까지 정할 수 있습니다.");

  expect((await post(inFromNow(7 * ONE_DAY_MS - 60_000))).status()).toBe(201);
});

test("마감 전에는 목록과 투표 화면에 마감 시각이 보인다", async ({ page, request }) => {
  const question = uniqueQuestion("마감 표시");
  const pollId = await createPoll(request, question, ["가", "나"]);

  await page.goto("/");
  const row = page.getByRole("listitem").filter({ hasText: question });
  await expect(row).toContainText(new RegExp(`마감: ${KOREAN_TIME.source}`));
  await expect(row).not.toContainText("마감됨");

  await page.goto(`/polls/${pollId}`);
  await expect(page.getByText(new RegExp(`^마감: ${KOREAN_TIME.source}$`))).toBeVisible();
});

test("마감 시각이 지나면 투표는 막히고 결과는 누구나 볼 수 있다", async ({ page, context, browser, request }) => {
  const question = uniqueQuestion("자동 마감");
  const pollId = await createPoll(request, question, ["가", "나"], inFromNow(5_000));

  // Opened before closing: a stale form.
  await page.goto(`/polls/${pollId}`);
  await expect(page.getByRole("button", { name: "투표하기" })).toBeVisible();
  await page.waitForTimeout(6_000);

  await page.getByLabel("가", { exact: true }).check();
  await page.getByRole("button", { name: "투표하기" }).click();
  await expect(page).toHaveURL(`/polls/${pollId}/results`);
  await expect(page.getByText("총 0표")).toBeVisible();
  await expect(page.getByText(new RegExp(`^마감됨 · ${KOREAN_TIME.source}$`))).toBeVisible();
  expect(await context.cookies()).not.toContainEqual(expect.objectContaining({ name: `voted_${pollId}` }));

  // A Voter who never voted is sent straight to the Result, via page and API.
  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await strangerPage.goto(`/polls/${pollId}`);
  await expect(strangerPage).toHaveURL(`/polls/${pollId}/results`);
  expect((await strangerPage.request.get(`/api/polls/${pollId}/results`)).status()).toBe(200);
  await strangerPage.goto("/");
  await expect(strangerPage.getByRole("listitem").filter({ hasText: question })).toContainText("마감됨 · ");
  await stranger.close();

  await logIn(page);
  await expect(page.getByRole("listitem").filter({ hasText: question })).toContainText("마감됨 · ");
});
