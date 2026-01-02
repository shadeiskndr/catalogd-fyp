import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

const AGENT_TIMEOUT = 90_000;

test("the AI Recommender shell paints without waiting for the network", async ({ page }) => {
  await page.goto("/dashboard");
  const link = page.getByRole("link", { name: "AI Recommender", exact: true });
  await link.hover();
  await page.waitForLoadState("networkidle");

  await instant(page, async () => {
    await page.getByRole("link", { name: "AI Recommender", exact: true }).click();
    await expect(page.getByRole("heading", { name: "AI Recommender", level: 1 })).toBeVisible();
  });
});

test("an empty prompt is rejected", async ({ page }) => {
  await page.goto("/ai-rec");
  const textarea = page.getByRole("textbox", { name: "Message the recommender" });
  await expect(textarea).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  await textarea.fill("   ");
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test("a prompt produces a streamed reply and at least one game card", async ({ page }) => {
  test.setTimeout(AGENT_TIMEOUT + 60_000);
  await page.goto("/ai-rec");
  const textarea = page.getByRole("textbox", { name: "Message the recommender" });
  await expect(textarea).toBeVisible();

  await expect(page.locator("[aria-busy='true']")).toHaveCount(0, { timeout: 45_000 });
  const newConversation = page.getByRole("button", { name: "New conversation" });
  if (await newConversation.isVisible().catch(() => false)) {
    await newConversation.click();
    await expect(page.getByText("What are you in the mood for?")).toBeVisible();
  }

  const prompt = "Find me games similar to Stardew Valley";
  await textarea.fill(prompt);
  await page.getByRole("button", { name: "Submit" }).click();

  const log = page.getByRole("log");
  await expect(log.getByText(prompt)).toBeVisible({ timeout: 45_000 });
  await expect(log.getByRole("button", { name: /Completed/ }).first()).toBeVisible({
    timeout: AGENT_TIMEOUT,
  });
  await expect(log.getByRole("link", { name: /.+/ }).first()).toBeVisible({
    timeout: AGENT_TIMEOUT,
  });
  await expect(
    log
      .locator("p")
      .filter({ hasText: /\w{3,}/ })
      .last()
  ).toBeVisible({
    timeout: AGENT_TIMEOUT,
  });
  await expect(page.getByRole("button", { name: "Submit" })).toHaveAttribute("type", "submit", {
    timeout: AGENT_TIMEOUT,
  });
});

test("More like this appears on a warm game", async ({ page }) => {
  await page.goto("/game/stardew-valley");
  await expect(page.getByRole("heading", { name: "More like this", level: 2 })).toBeVisible();
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "More like this" }),
  });
  await expect(section.getByRole("link").first()).toBeVisible({ timeout: 45_000 });
});
