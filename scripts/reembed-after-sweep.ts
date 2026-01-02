import { Database } from "bun:sqlite";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { embed } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { buildGameDocument, hashDocument } from "../lib/rag-document";
import {
  EMBEDDING_DIMENSION,
  embeddingProviderOptions,
  getEmbeddingModel,
  INDEX_PURPOSE,
  TEMPLATE_VERSION,
} from "../lib/rag-models";

const DEFAULT_DB = "/home/siskandar/Downloads/p/videogames_with_embeddings.db";
const PAGE_SIZE = 1000;
const MAX_ATTEMPTS = 6;
const BACKOFF_BASE_MS = 500;
const ROUND_DECIMALS = 6;

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    db: { type: "string", default: DEFAULT_DB },
    previous: { type: "string", default: "docs/tmp/gameVectors.jsonl" },
    out: { type: "string", default: "docs/tmp/gameVectors-v2.jsonl" },
    concurrency: { type: "string", default: "12" },
    "dry-run": { type: "boolean", default: false },
    resume: { type: "boolean", default: false },
  },
});

type GamePageRow = {
  rawgId: number;
  name: string;
  released: string;
  genres: string[];
  platforms: string[];
  tags: string[];
  developers: string[];
  publishers: string[];
  descriptionRaw: string;
  hasDetail: boolean;
};

type VectorRow = {
  rawgId: number;
  modality: string;
  embedding: number[];
  docHash: string;
  templateVersion: number;
  source: string;
  embeddedAt: number;
};

const url = process.env["CONVEX_SELF_HOSTED_URL"] ?? process.env["NEXT_PUBLIC_CONVEX_URL"];
const adminKey = process.env["CONVEX_SELF_HOSTED_ADMIN_KEY"];
if (url === undefined || adminKey === undefined) {
  throw new Error("CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY are required");
}
const client = new ConvexHttpClient(url);
(client as unknown as { setAdminAuth: (key: string) => void }).setAdminAuth(adminKey);

const games = new Map<number, GamePageRow>();
let cursor: string | null = null;
for (;;) {
  const page = (await client.query(
    "rag:gamesPage" as never,
    {
      cursor,
      numItems: PAGE_SIZE,
    } as never
  )) as { page: GamePageRow[]; isDone: boolean; continueCursor: string };
  for (const row of page.page) {
    games.set(row.rawgId, row);
  }
  if (page.isDone) break;
  cursor = page.continueCursor;
}
console.log(`games in Convex: ${games.size}`);

const previous = new Map<number, VectorRow>();
for (const line of readFileSync(values.previous ?? "", "utf8").split("\n")) {
  if (line.length === 0) continue;
  const row = JSON.parse(line) as VectorRow;
  previous.set(row.rawgId, row);
}
console.log(`previous vectors: ${previous.size}`);

const db = new Database(values.db ?? DEFAULT_DB, { readonly: true });
const descriptionStmt = db.query("SELECT description FROM games WHERE id = ?");

const out = values.out ?? "docs/tmp/gameVectors-v2.jsonl";
const checkpointPath = `${out}.done`;
const done = new Set<number>();
if (values.resume && existsSync(checkpointPath)) {
  for (const line of readFileSync(checkpointPath, "utf8").split("\n")) {
    if (line.length > 0) done.add(Number.parseInt(line, 10));
  }
} else {
  writeFileSync(out, "");
  writeFileSync(checkpointPath, "");
}

const work: Array<{ rawgId: number; document: string; docHash: string }> = [];
let unchanged = 0;
let notInCatalog = 0;
let usedCorpusDescription = 0;
let noDescription = 0;
const previousIds = new Set(previous.keys());

for (const [rawgId, game] of games) {
  const prior = previous.get(rawgId);
  let description = game.descriptionRaw;
  if (description.length === 0) {
    const row = descriptionStmt.get(rawgId) as { description: string | null } | null;
    description = row?.description ?? "";
    if (description.length > 0) usedCorpusDescription += 1;
  }
  if (description.length === 0) noDescription += 1;
  const document = buildGameDocument({
    name: game.name,
    released: game.released,
    genres: game.genres,
    platforms: game.platforms,
    tags: game.tags,
    developers: game.developers,
    publishers: game.publishers,
    description,
  });
  const docHash = hashDocument(document);
  if (prior !== undefined && prior.docHash === docHash) {
    unchanged += 1;
    continue;
  }
  if (done.has(rawgId)) continue;
  work.push({ rawgId, document, docHash });
}
for (const rawgId of previousIds) {
  if (!games.has(rawgId)) notInCatalog += 1;
}

console.log(
  `toEmbed=${work.length} unchanged=${unchanged} corpusOnly(notInCatalog)=${notInCatalog} usedCorpusDescription=${usedCorpusDescription} noDescription=${noDescription}`
);

if (values["dry-run"]) {
  for (const item of work.slice(0, 2)) {
    console.log(`\n--- ${item.rawgId} ---\n${item.document.slice(0, 600)}`);
  }
  process.exit(0);
}

const model = getEmbeddingModel();
let tokens = 0;
let completed = 0;
let failures = 0;
const started = Date.now();
const concurrency = Number.parseInt(values.concurrency ?? "12", 10);

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
        throw new Error(`rawgId ${item.rawgId}: ${result.embedding.length} dims`);
      }
      tokens += result.usage.tokens ?? 0;
      const row: VectorRow = {
        rawgId: item.rawgId,
        modality: "text",
        embedding: result.embedding.map((value) => Number(value.toFixed(ROUND_DECIMALS))),
        docHash: item.docHash,
        templateVersion: TEMPLATE_VERSION,
        source: "rawg",
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
      await Bun.sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.random() * 250);
    }
  }
}

let index = 0;
async function worker(): Promise<void> {
  while (index < work.length) {
    const item = work[index];
    index += 1;
    if (item === undefined) return;
    await embedOne(item);
    if (completed % 500 === 0) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = completed / Math.max(elapsed, 1);
      console.log(
        `${completed}/${work.length} tokens=${tokens} cost=$${((tokens / 1_000_000) * 0.14).toFixed(4)} failures=${failures} ${rate.toFixed(1)}/s eta=${Math.round((work.length - completed) / Math.max(rate, 0.01))}s`
      );
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));

const reembedded = new Set<number>();
for (const line of readFileSync(out, "utf8").split("\n")) {
  if (line.length === 0) continue;
  reembedded.add((JSON.parse(line) as VectorRow).rawgId);
}
let carried = 0;
for (const [rawgId, row] of previous) {
  if (reembedded.has(rawgId)) continue;
  appendFileSync(out, `${JSON.stringify(row)}\n`);
  carried += 1;
}
console.log(
  `done: reembedded=${completed} failures=${failures} carriedForward=${carried} tokens=${tokens} cost=$${((tokens / 1_000_000) * 0.14).toFixed(4)} elapsed=${Math.round((Date.now() - started) / 1000)}s -> ${out}`
);
