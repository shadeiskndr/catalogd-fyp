import { expect, test as setup } from "@playwright/test";

const STORAGE_STATE = "e2e/.auth/user.json";

const email = process.env["E2E_EMAIL"] ?? "e2e-catalogd@example.test";
const password = process.env["E2E_PASSWORD"] ?? "e2e-Catalogd-Pa55!";
const name = process.env["E2E_NAME"] ?? "E2E Runner";

setup("authenticate", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  const signedIn = await page
    .waitForURL("**/dashboard", { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  if (!signedIn) {
    await page.goto("/");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Full Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
  }

  await expect(page.getByRole("link", { name: "Genres" })).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
