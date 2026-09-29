import { expect, test } from "@playwright/test";
import { createPoll, logIn, uniqueQuestion, vote } from "./helpers";
import { deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

const MAKER = "제작: 김민혁";

test("모든 화면 맨 아래에 제작자 이름이 보인다", async ({ page }) => {
  for (const path of ["/", "/login", "/polls/not-a-poll"]) {
    await page.goto(path);
    await expect(page.getByRole("contentinfo")).toHaveText(MAKER);
  }
  await logIn(page);
  await expect(page.getByRole("contentinfo")).toHaveText(MAKER);
});

test("투표마다 목록, 투표 화면, 결과 화면에 만든 사람이 보인다", async ({ page, request }) => {
  const question = uniqueQuestion("만든 사람");
  const pollId = await createPoll(request, question, ["가", "나"]);
  const inMain = page.getByRole("main");

  await page.goto("/");
  await expect(inMain.getByRole("listitem").filter({ hasText: question })).toContainText(MAKER);

  await page.goto(`/polls/${pollId}`);
  await expect(inMain.getByText(MAKER)).toBeVisible();

  await vote(page, pollId, "가");
  await expect(inMain.getByText(MAKER)).toBeVisible();

  await logIn(page);
  await expect(inMain.getByRole("listitem").filter({ hasText: question })).toContainText(MAKER);
});
