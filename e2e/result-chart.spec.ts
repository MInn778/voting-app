import { expect, test, type Page } from "@playwright/test";
import { createPoll, uniqueQuestion, vote, voteAsNewVoter } from "./helpers";
import { deleteTestPolls } from "./test-db";

test.afterAll(deleteTestPolls);

function bar(page: Page, label: string) {
  return page.getByRole("listitem").filter({ hasText: label }).locator("[data-bar]");
}

test("결과 화면에 득표 비율만큼 채워진 가로 막대가 보이고 갱신된다", async ({ page, browser, request }) => {
  const pollId = await createPoll(request, uniqueQuestion("그래프"), ["가", "나", "다"]);
  await voteAsNewVoter(browser, pollId, "가");
  await voteAsNewVoter(browser, pollId, "가");
  await vote(page, pollId, "나");

  await expect(bar(page, "가")).toHaveAttribute("style", /width: ?67%/);
  await expect(bar(page, "나")).toHaveAttribute("style", /width: ?33%/);
  await expect(bar(page, "다")).toHaveAttribute("style", /width: ?0%/);
  await expect(bar(page, "나")).toHaveClass(/green/); // my choice
  await expect(bar(page, "가")).not.toHaveClass(/green/);
  await expect(bar(page, "가").locator("..")).toHaveAttribute("aria-hidden", "true");

  await voteAsNewVoter(browser, pollId, "다");
  await expect(bar(page, "다")).toHaveAttribute("style", /width: ?25%/, { timeout: 15_000 });
  await expect(bar(page, "가")).toHaveAttribute("style", /width: ?50%/);
});
