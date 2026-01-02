import { Database } from "bun:sqlite";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { embed } from "ai";
import { buildGameDocument, hashDocument, splitCommaList } from "../lib/rag-document";
import {
  EMBEDDING_DIMENSION,
  embeddingProviderOptions,
  getEmbeddingModel,
  INDEX_PURPOSE,
  TEMPLATE_VERSION,
} from "../lib/rag-models";

const DEFAULT_DB = "/home/siskandar/Downloads/p/videogames_with_embeddings.db";
const MAX_ATTEMPTS = 6;
const BACKOFF_BASE_MS = 500;
const ROUND_DECIMALS = 6;

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    db: { type: "string", default: DEFAULT_DB },
    out: { type: "string", default: "docs/tmp/gameVectors.jsonl" },
    limit: { type: "string" },
    concurrency: { type: "string", default: "8" },
    resume: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

type CorpusRow = {
  id: number;
  slug: string | null;
  name: string | null;
  released: string | null;
  genres: string | null;
  platforms: string | null;
  tags: string | null;
  developers: string | null;
  publishers: string | null;
  description: string | null;
};

const out = values.out ?? "docs/tmp/gameVectors.jsonl";
const checkpointPath = `${out}.done`;
const limit = values.limit === undefined ? undefined : Number.parseInt(values.limit, 10);
const concurrency = Number.parseInt(values.concurrency ?? "8", 10);

const db = new Database(values.db ?? DEFAULT_DB, { readonly: true });
const sql = `SELECT id, slug, name, released, genres, platforms, tags, developers, publishers, description FROM games ORDER BY id${limit === undefined ? "" : ` LIMIT ${limit}`}`;
const rows = db.query(sql).all() as CorpusRow[];

const done = new Set<number>();
if (values.resume && existsSync(checkpointPath)) {
  for (const line of readFileSync(checkpointPath, "utf8").split("\n")) {
    if (line.length > 0) done.add(Number.parseInt(line, 10));
  }
}

const skips: Record<string, number> = {};
const work: Array<{ rawgId: number; document: string; docHash: string }> = [];
for (const row of rows) {
  const slug = row.slug ?? "";
  const name = row.name ?? "";
  if (slug.length === 0 || name.length === 0) {
    skips["missing slug or name"] = (skips["missing slug or name"] ?? 0) + 1;
    continue;
  }
  if (done.has(row.id)) {
    skips["already embedded"] = (skips["already embedded"] ?? 0) + 1;
    continue;
  }
  const document = buildGameDocument({
    name,
    released: row.released ?? "",
    genres: splitCommaList(row.genres),
    platforms: splitCommaList(row.platforms),
    tags: splitCommaList(row.tags),
    developers: splitCommaList(row.developers),
    publishers: splitCommaList(row.publishers),
    description: row.description ?? "",
  });
  work.push({ rawgId: row.id, document, docHash: hashDocument(document) });
}

console.log(`rows=${rows.length} toEmbed=${work.length} skipped=${JSON.stringify(skips)}`);

if (values["dry-run"]) {
  for (const item of work.slice(0, 3)) {
    console.log(`\n--- ${item.rawgId} (${item.docHash}) ---\n${item.document}`);
  }
  const chars = work.reduce((total, item) => total + item.document.length, 0);
  console.log(`\napprox tokens (chars/4): ${Math.round(chars / 4)}`);
  process.exit(0);
}

const model = getEmbeddingModel();
let tokens = 0;
let completed = 0;
let failures = 0;
const started = Date.now();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Throttling|TooManyRequests|429|5\d\d|ECONNRESET|ETIMEDOUT|fetch failed|timeout/i.test(
    message
  );
}

async function embedOne(item: (typeof work)[number]): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await embed({
        model,
        value: item.document,
        providerOptions: embeddingProviderOptions(INDEX_PURPOSE),
      });
      if (result.embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(
          `rawgId ${item.rawgId}: got ${result.embedding.length} dims, expected ${EMBEDDING_DIMENSION}`
        );
      }
      tokens += result.usage.tokens ?? 0;
      const row = {
        rawgId: item.rawgId,
        modality: "text",
        embedding: result.embedding.map((value) => Number(value.toFixed(ROUND_DECIMALS))),
        docHash: item.docHash,
        templateVersion: TEMPLATE_VERSION,
        source: "corpus",
        embeddedAt: Date.now(),
      };
      appendFileSync(out, `${JSON.stringify(row)}\n`);
      appendFileSync(checkpointPath, `${item.rawgId}\n`);
      completed += 1;
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) {
        failures += 1;
        console.error(
          `FAILED rawgId=${item.rawgId}: ${error instanceof Error ? error.message.slice(0, 200) : error}`
        );
        return;
      }
      await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.random() * 250);
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
    if (completed % 100 === 0 || completed === work.length) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = completed / Math.max(elapsed, 1);
      const eta = Math.round((work.length - completed) / Math.max(rate, 0.01));
      console.log(
        `${completed}/${work.length} tokens=${tokens} cost=$${((tokens / 1_000_000) * 0.14).toFixed(4)} failures=${failures} ${rate.toFixed(1)}/s eta=${eta}s`
      );
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
const elapsed = (Date.now() - started) / 1000;
console.log(
  `done: embedded=${completed} failures=${failures} tokens=${tokens} cost=$${((tokens / 1_000_000) * 0.14).toFixed(4)} elapsed=${elapsed.toFixed(0)}s`
);
