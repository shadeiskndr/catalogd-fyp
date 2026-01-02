import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { $ } from "bun";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    from: { type: "string", default: "1" },
    to: { type: "string", default: "20" },
    "delay-ms": { type: "string", default: "700" },
    log: { type: "string", default: "docs/tmp/sweep-log.jsonl" },
    years: { type: "string" },
    "max-pages": { type: "string", default: "400" },
    "min-overlap": { type: "string", default: "0.25" },
  },
});

type SweepPageResult = {
  page: number;
  received: number;
  saved: number;
  withVector: number;
  newToCatalog: number;
  tagsPerGame: number;
  hasMore: boolean;
};

const from = Number.parseInt(values.from ?? "1", 10);
const to = Number.parseInt(values.to ?? "20", 10);
const delayMs = Number.parseInt(values["delay-ms"] ?? "700", 10);
const log = values.log ?? "docs/tmp/sweep-log.jsonl";

let saved = 0;
let withVector = 0;
let newToCatalog = 0;
let tagSum = 0;
let pages = 0;
const started = Date.now();

const maxPages = Number.parseInt(values["max-pages"] ?? "400", 10);
const minOverlap = Number.parseFloat(values["min-overlap"] ?? "0.25");
const years: Array<number | undefined> =
  values.years === undefined
    ? [undefined]
    : (() => {
        const [start, end] = (values.years ?? "")
          .split("-")
          .map((part) => Number.parseInt(part, 10));
        if (start === undefined || end === undefined) return [undefined];
        const list: number[] = [];
        for (
          let year = start;
          start <= end ? year <= end : year >= end;
          year += start <= end ? 1 : -1
        ) {
          list.push(year);
        }
        return list;
      })();

async function fetchPage(page: number, year: number | undefined): Promise<SweepPageResult | null> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const args = year === undefined ? { page } : { page, year };
      const raw = await $`bunx convex run ingest:sweepPage ${JSON.stringify(args)}`.quiet().text();
      return JSON.parse(raw.slice(raw.indexOf("{"))) as SweepPageResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stderr = (error as { stderr?: { toString(): string } }).stderr?.toString() ?? "";
      if (/404/.test(message + stderr)) {
        return null;
      }
      console.error(
        `page ${page}${year === undefined ? "" : ` (${year})`} failed:`,
        message.slice(0, 200)
      );
      await Bun.sleep(5000);
    }
  }
  return null;
}

outer: for (const year of years) {
  let lowOverlapStreak = 0;
  for (let page = year === undefined ? from : 1; page <= to; page += 1) {
    if (pages >= maxPages) {
      console.log(`reached --max-pages=${maxPages}; stopping.`);
      break outer;
    }
    const result = await fetchPage(page, year);
    if (result === null) {
      console.log(`${year ?? "all"} page ${page}: no further pages.`);
      break;
    }
    appendFileSync(log, `${JSON.stringify({ ...result, year: year ?? null })}\n`);
    pages += 1;
    saved += result.saved;
    withVector += result.withVector;
    newToCatalog += result.newToCatalog;
    tagSum += result.tagsPerGame * result.saved;
    const overlap = result.saved === 0 ? 0 : result.withVector / result.saved;
    console.log(
      `${year ?? "all"} page ${page}: saved=${result.saved} withVector=${result.withVector} new=${result.newToCatalog} overlap=${(100 * overlap).toFixed(0)}% tags/game=${result.tagsPerGame.toFixed(1)} hasMore=${result.hasMore}`
    );
    if (!result.hasMore || result.saved === 0) {
      break;
    }
    lowOverlapStreak = overlap < minOverlap ? lowOverlapStreak + 1 : 0;
    if (year !== undefined && lowOverlapStreak >= 2) {
      console.log(`${year}: overlap below ${minOverlap} on two consecutive pages; next year.`);
      break;
    }
    await Bun.sleep(delayMs);
  }
}

const elapsed = Math.round((Date.now() - started) / 1000);
console.log(
  `\nsummary pages=${pages} saved=${saved} withVector=${withVector} (${((100 * withVector) / Math.max(saved, 1)).toFixed(1)}% corpus overlap) newToCatalog=${newToCatalog} tags/game=${(tagSum / Math.max(saved, 1)).toFixed(1)} elapsed=${elapsed}s`
);
