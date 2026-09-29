import { expect, test } from "@playwright/test";
import { logIn } from "./helpers";

test("모든 화면 맨 아래에 제작자 이름이 보인다", async ({ page }) => {
  for (const path of ["/", "/login", "/polls/not-a-poll"]) {
    await page.goto(path);
    await expect(page.getByRole("contentinfo")).toHaveText("제작: 김민혁");
  }
  await logIn(page);
  await expect(page.getByRole("contentinfo")).toHaveText("제작: 김민혁");
});
