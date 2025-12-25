import { expect, type Page, test } from "@playwright/test";

const RAWG_RESIZE = /^https:\/\/media\.rawg\.io\/media\/resize\/(200|420|600|640|1280|1920)\/-\//;

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
  test(`${route} routes every RAWG image through the Next optimizer`, async ({ page }) => {
    const traffic = watchImages(page);

    await page.goto(route);
    await page.waitForLoadState("networkidle");

    expect(traffic.direct).toEqual([]);
    expect(traffic.optimized.length).toBeGreaterThan(0);

    const rawgSources = traffic.optimized.filter((src) => src.startsWith("https://media.rawg.io/"));
    expect(rawgSources.length).toBeGreaterThan(0);
    for (const source of rawgSources) {
      expect(source).toMatch(RAWG_RESIZE);
    }
  });
}
