import { Database } from "bun:sqlite";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { hashDocument } from "../lib/rag-document";
import { bedrockEmbedImage } from "../lib/rag-image-embed";
import { INDEX_PURPOSE, TEMPLATE_VERSION } from "../lib/rag-models";
import { normalizeRawgMediaPath, RAWG_MEDIA_PREFIX } from "../lib/rawg-image-path";

const DEFAULT_DB = "/home/siskandar/Downloads/p/videogames_with_embeddings.db";
const COVER_WIDTH = 640;
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 600;
const ROUND_DECIMALS = 6;
const IMAGE_COST_USD = 0.0001;

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    db: { type: "string", default: DEFAULT_DB },
    out: { type: "string", default: "docs/tmp/coverVectors.jsonl" },
    limit: { type: "string" },
    concurrency: { type: "string", default: "8" },
    resume: { type: "boolean", default: false },
  },
});

type Row = { id: number; background_image: string | null };

const out = values.out ?? "docs/tmp/coverVectors.jsonl";
const checkpointPath = `${out}.done`;
const limit = values.limit === undefined ? undefined : Number.parseInt(values.limit, 10);
const concurrency = Number.parseInt(values.concurrency ?? "8", 10);

const db = new Database(values.db ?? DEFAULT_DB, { readonly: true });
const rows = db
  .query(
    `SELECT id, background_image FROM games ORDER BY id${limit === undefined ? "" : ` LIMIT ${limit}`}`
  )
  .all() as Row[];

const done = new Set<number>();
if (values.resume && existsSync(checkpointPath)) {
  for (const line of readFileSync(checkpointPath, "utf8").split("\n")) {
    if (line.length > 0) done.add(Number.parseInt(line, 10));
  }
}

const work: Array<{ rawgId: number; path: string }> = [];
let noImage = 0;
for (const row of rows) {
  if (done.has(row.id)) continue;
  const path = row.background_image === null ? null : normalizeRawgMediaPath(row.background_image);
  if (path === null) {
    noImage += 1;
    continue;
  }
  work.push({ rawgId: row.id, path });
}
console.log(
  `rows=${rows.length} toEmbed=${work.length} noImage=${noImage} alreadyDone=${done.size}`
);

let completed = 0;
let failures = 0;
let fetchFailures = 0;
let bytesTotal = 0;
let tokens = 0;
const started = Date.now();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCover(path: string): Promise<Uint8Array | null> {
  const url = `${RAWG_MEDIA_PREFIX}resize/${COVER_WIDTH}/-/${path}`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return new Uint8Array(await response.arrayBuffer());
    } catch {
      await sleep(400 * attempt);
    }
  }
  return null;
}

async function embedOne(item: { rawgId: number; path: string }): Promise<void> {
  const bytes = await fetchCover(item.path);
  if (bytes === null) {
    fetchFailures += 1;
    appendFileSync(checkpointPath, `${item.rawgId}\n`);
    return;
  }
  bytesTotal += bytes.length;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await bedrockEmbedImage(bytes, INDEX_PURPOSE);
      tokens += result.inputTokens;
      const row = {
        rawgId: item.rawgId,
        modality: "image",
        embedding: result.embedding.map((value) => Number(value.toFixed(ROUND_DECIMALS))),
        docHash: hashDocument(`image:${item.path}`),
        templateVersion: TEMPLATE_VERSION,
        source: "corpus",
        embeddedAt: Date.now(),
      };
      appendFileSync(out, `${JSON.stringify(row)}\n`);
      appendFileSync(checkpointPath, `${item.rawgId}\n`);
      completed += 1;
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /Throttling|429|5\d\d|ECONNRESET|timeout|fetch failed/i.test(message);
      if (attempt === MAX_ATTEMPTS || !retryable) {
        failures += 1;
        console.error(`FAILED rawgId=${item.rawgId}: ${message.slice(0, 200)}`);
        appendFileSync(checkpointPath, `${item.rawgId}\n`);
        return;
      }
      await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.random() * 300);
    }
  }
}

let cursor = 0;
async function worker(): Promise<void> {
  while (cursor < work.length) {
    const item = work[cursor];
    cursor += 1;
    if (item === undefined) return;
    await embedOne(item);
    if (completed % 250 === 0 && completed > 0) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = completed / Math.max(elapsed, 1);
      console.log(
        `${completed}/${work.length} cost=$${(completed * IMAGE_COST_USD).toFixed(2)} failures=${failures} fetchFailures=${fetchFailures} ${rate.toFixed(1)}/s eta=${Math.round((work.length - completed) / Math.max(rate, 0.01))}s`
      );
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
console.log(
  `done: embedded=${completed} failures=${failures} fetchFailures=${fetchFailures} imageTokens=${tokens} avgBytes=${Math.round(bytesTotal / Math.max(completed, 1))} cost=$${(completed * IMAGE_COST_USD).toFixed(2)} elapsed=${Math.round((Date.now() - started) / 1000)}s`
);
