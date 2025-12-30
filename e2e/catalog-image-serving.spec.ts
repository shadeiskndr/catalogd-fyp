import { expect, type Page, test } from "@playwright/test";

const CATALOG_IMAGE_PATH = /^\/img\/(200|420|600|640|1280|1920)\/[A-Za-z0-9][A-Za-z0-9/._-]*$/;

function watchImages(page: Page) {
  const direct: string[] = [];
  const optimized: string[] = [];

  page.on("request", (request) => {
    if (request.resourceType() !== "image") {
      return;
    }
    const url = new URL(request.url());
    if (url.hostname === "media.rawg.io") {
      direct.push(request.url());
      return;
    }
    if (url.pathname === "/_next/image") {
      optimized.push(url.searchParams.get("url") ?? "");
    }
  });

  return { direct, optimized };
}

const ROUTES = ["/genres", "/dashboard", "/popular"];

for (const route of ROUTES) {
  test(`${route} serves game art from the catalogue backend`, async ({ page }) => {
    const traffic = watchImages(page);

    await page.goto(route);
    await page.waitForLoadState("networkidle");

    expect(traffic.direct).toEqual([]);
    expect(traffic.optimized.length).toBeGreaterThan(0);

    const remoteSources = traffic.optimized.filter((source) => source.startsWith("http"));
    expect(remoteSources.length).toBeGreaterThan(0);
    for (const source of remoteSources) {
      const upstream = new URL(source);
      expect(upstream.hostname).not.toBe("media.rawg.io");
      expect(upstream.pathname).toMatch(CATALOG_IMAGE_PATH);
    }
  });
}
