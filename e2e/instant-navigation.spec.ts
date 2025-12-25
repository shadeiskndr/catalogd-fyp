import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

test("the Genres shell paints without waiting for the network", async ({ page }) => {
  await page.goto("/dashboard");

  await instant(page, async () => {
    await page.getByRole("link", { name: "Genres", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Genres", level: 1 })).toBeVisible();
  });
});

test("the Reviews shell paints without waiting for the network", async ({ page }) => {
  await page.goto("/dashboard");

  await instant(page, async () => {
    await page.getByRole("link", { name: "Reviews", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Recent Reviews", level: 1 })).toBeVisible();
  });
});
