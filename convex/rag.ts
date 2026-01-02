import { getAuthUserId } from "@convex-dev/auth/server";
import { embed, embedMany } from "ai";
import { ConvexError, v } from "convex/values";
import type { CatalogGame } from "@/lib/game-types";
import { buildGameDocument, hashDocument } from "@/lib/rag-document";
import {
  EMBEDDING_DIMENSION,
  embeddingProviderOptions,
  getEmbeddingModel,
  INDEX_PURPOSE,
  QUERY_PURPOSE,
  TEMPLATE_VERSION,
} from "@/lib/rag-models";
import { passesRagFilters, type RagFilters, type RagResult } from "@/lib/rag-types";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { type ListSnapshot, toCatalogGame } from "./catalog";
import { type RawgGame, type RawgListResponse, rawgRequest } from "./rawg";

const SEARCH_OVERFETCH = 60;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const MAX_COLD_INGEST = 30;
const MAX_QUEUE_RECORD = 60;
const DEBUG_LIMIT = 10;
const GAMES_PAGE_MAX = 1000;
const SEED_SCAN = 200;
const WEIGHT_LIBRARY = 1;
const WEIGHT_WISHLIST = 0.75;
const WEIGHT_LOVED = 1.5;
const WEIGHT_MIXED = 0.5;
const WEIGHT_DISLIKED = -1;
const LOVED_RATING = 7;
const DISLIKED_RATING = 4;
const FALLBACK_LIST_KEY = "popular:1";
const EMBED_BATCH_MAX = 60;
const EMBED_PARALLEL_CALLS = 6;
const BACKFILL_PAGE = 500;
const BACKFILL_CAP = 240;

export const ragFiltersValidator = v.object({
  genres: v.optional(v.array(v.string())),
  platforms: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
  minMetacritic: v.optional(v.number()),
  maxPlaytime: v.optional(v.number()),
  releasedAfter: v.optional(v.string()),
  releasedBefore: v.optional(v.string()),
});

const modalityValidator = v.union(v.literal("text"), v.literal("image"));

const hitValidator = v.object({ id: v.id("gameVectors"), score: v.number() });

type VectorHit = { id: Id<"gameVectors">; score: number };
type ScoredId = { rawgId: number; score: number };

export type SeedVector = { rawgId: number; embedding: number[] };
export type HydrateResult = { results: RagResult[]; cold: ScoredId[] };
export type DebugHit = { rawgId: number; score: number; name: string | null };
export type DebugSearchResult = {
  query: string;
  purpose: string;
  embedMs: number;
  searchMs: number;
  hits: DebugHit[];
};

export async function requireUserId(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }
  return userId;
}

function clampLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
}

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
    providerOptions: embeddingProviderOptions(QUERY_PURPOSE),
  });
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding has ${embedding.length} dimensions, expected ${EMBEDDING_DIMENSION}`
    );
  }
  return embedding;
}

export const readVectors = internalQuery({
  args: { rawgIds: v.array(v.number()), modality: modalityValidator },
  handler: async (ctx, args): Promise<SeedVector[]> => {
    const ids = Array.from(new Set(args.rawgIds)).slice(0, SEARCH_OVERFETCH);
    const docs = await Promise.all(
      ids.map((rawgId) =>
        ctx.db
          .query("gameVectors")
          .withIndex("by_rawgId_modality", (q) =>
            q.eq("rawgId", rawgId).eq("modality", args.modality)
          )
          .first()
      )
    );
    const seeds: SeedVector[] = [];
    for (const doc of docs) {
      if (doc !== null) {
        seeds.push({ rawgId: doc.rawgId, embedding: doc.embedding });
      }
    }
    return seeds;
  },
});

async function resolveHitIds(
  ctx: {
    db: {
      get: (table: "gameVectors", id: Id<"gameVectors">) => Promise<{ rawgId: number } | null>;
    };
  },
  hits: VectorHit[]
): Promise<ScoredId[]> {
  const docs = await Promise.all(hits.map((hit) => ctx.db.get("gameVectors", hit.id)));
  const best = new Map<number, number>();
  docs.forEach((doc, index) => {
    const hit = hits[index];
    if (doc === null || hit === undefined) {
      return;
    }
    const current = best.get(doc.rawgId);
    if (current === undefined || hit.score > current) {
      best.set(doc.rawgId, hit.score);
    }
  });
  return Array.from(best.entries())
    .map(([rawgId, score]) => ({ rawgId, score }))
    .sort((first, second) => second.score - first.score);
}

export const hydrate = internalQuery({
  args: {
    scored: v.array(v.object({ rawgId: v.number(), score: v.number() })),
    exclude: v.array(v.number()),
    filters: v.optional(ragFiltersValidator),
  },
  handler: async (ctx, args): Promise<HydrateResult> => {
    const excluded = new Set(args.exclude);
    const scored = args.scored.filter((entry) => !excluded.has(entry.rawgId));
    const docs = await Promise.all(
      scored.map((entry) =>
        ctx.db
          .query("games")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", entry.rawgId))
          .first()
      )
    );
    const results: RagResult[] = [];
    const cold: ScoredId[] = [];
    scored.forEach((entry, index) => {
      const doc = docs[index] ?? null;
      if (doc === null) {
        cold.push(entry);
        return;
      }
      const game = toCatalogGame(doc);
      if (passesRagFilters(game, args.filters)) {
        results.push({ ...game, score: entry.score });
      }
    });
    return { results, cold };
  },
});

export const namesByRawgIds = internalQuery({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<Array<string | null>> => {
    const docs = await Promise.all(
      args.rawgIds.slice(0, SEARCH_OVERFETCH).map((rawgId) =>
        ctx.db
          .query("games")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", rawgId))
          .first()
      )
    );
    return docs.map((doc) => doc?.name ?? null);
  },
});

export const recordCold = internalMutation({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();
    const ids = Array.from(new Set(args.rawgIds)).slice(0, MAX_QUEUE_RECORD);
    const existing = await Promise.all(
      ids.map((rawgId) =>
        ctx.db
          .query("warmQueue")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", rawgId))
          .first()
      )
    );
    await Promise.all(
      ids.map((rawgId, index) => {
        const current = existing[index] ?? null;
        if (current === null) {
          return ctx.db.insert("warmQueue", { rawgId, hits: 1, firstSeen: now });
        }
        return ctx.db.patch("warmQueue", current._id, { hits: current.hits + 1 });
      })
    );
  },
});

type SearchOptions = {
  limit: number;
  exclude: number[];
  filters?: RagFilters;
  modality?: "text" | "image";
};

async function vectorHits(
  ctx: ActionCtx,
  vector: number[],
  modality: "text" | "image" | undefined,
  limit: number = SEARCH_OVERFETCH
): Promise<VectorHit[]> {
  const raw = await ctx.vectorSearch("gameVectors", "by_embedding", {
    vector,
    limit,
    ...(modality === undefined ? {} : { filter: (q) => q.eq("modality", modality) }),
  });
  return raw.map((hit) => ({ id: hit._id, score: hit._score }));
}

export async function searchAndHydrate(
  ctx: ActionCtx,
  vector: number[],
  options: SearchOptions
): Promise<RagResult[]> {
  const hits = await vectorHits(ctx, vector, options.modality);
  if (hits.length === 0) {
    return [];
  }
  const scored: ScoredId[] = await ctx.runQuery(internal.rag.resolveHits, { hits });
  const hydrated: HydrateResult = await ctx.runQuery(internal.rag.hydrate, {
    scored,
    exclude: options.exclude,
    ...(options.filters === undefined ? {} : { filters: options.filters }),
  });
  const results = [...hydrated.results];
  let cold = hydrated.cold;

  if (results.length < options.limit && cold.length > 0) {
    const need = cold.slice(0, Math.min(options.limit - results.length, MAX_COLD_INGEST));
    cold = cold.slice(need.length);
    const scores = new Map(need.map((entry) => [entry.rawgId, entry.score]));
    const fetched: CatalogGame[] = await ctx.runAction(internal.ingest.refreshGamesByIds, {
      rawgIds: need.map((entry) => entry.rawgId),
    });
    for (const game of fetched) {
      const score = scores.get(game.rawgId);
      if (score !== undefined && passesRagFilters(game, options.filters)) {
        results.push({ ...game, score });
      }
    }
    results.sort((first, second) => second.score - first.score);
  }

  if (cold.length > 0) {
    await ctx.scheduler.runAfter(0, internal.rag.recordCold, {
      rawgIds: cold.map((entry) => entry.rawgId),
    });
  }
  return results.slice(0, options.limit);
}

export const similarToRawgId = action({
  args: { rawgId: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<RagResult[]> => {
    await requireUserId(ctx);
    const seeds: SeedVector[] = await ctx.runQuery(internal.rag.readVectors, {
      rawgIds: [args.rawgId],
      modality: "text",
    });
    const seed = seeds[0];
    if (seed === undefined) {
      return [];
    }
    return await searchAndHydrate(ctx, seed.embedding, {
      limit: clampLimit(args.limit),
      exclude: [args.rawgId],
      modality: "text",
    });
  },
});

export type Seed = { rawgId: number; weight: number };
export type RecommendResult = { source: "taste" | "popular"; games: RagResult[] };

export const userSeeds = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<Seed[]> => {
    const [library, wishlist, reviews] = await Promise.all([
      ctx.db
        .query("library")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(SEED_SCAN),
      ctx.db
        .query("wishlist")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(SEED_SCAN),
      ctx.db
        .query("reviews")
        .withIndex("by_user_game", (q) => q.eq("userId", args.userId))
        .take(SEED_SCAN),
    ]);
    const weights = new Map<number, number>();
    const add = (rawgId: number, weight: number) => {
      weights.set(rawgId, (weights.get(rawgId) ?? 0) + weight);
    };
    for (const entry of library) {
      add(entry.gameId, WEIGHT_LIBRARY);
    }
    for (const entry of wishlist) {
      add(entry.gameId, WEIGHT_WISHLIST);
    }
    for (const review of reviews) {
      if (review.rating >= LOVED_RATING) {
        add(review.gameId, WEIGHT_LOVED);
      } else if (review.rating <= DISLIKED_RATING) {
        add(review.gameId, WEIGHT_DISLIKED);
      } else {
        add(review.gameId, WEIGHT_MIXED);
      }
    }
    return Array.from(weights.entries()).map(([rawgId, weight]) => ({ rawgId, weight }));
  },
});

export function tasteVector(seeds: Seed[], vectors: SeedVector[]): number[] | null {
  const weightOf = new Map(seeds.map((seed) => [seed.rawgId, seed.weight]));
  const sum = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  let used = 0;
  for (const vector of vectors) {
    const weight = weightOf.get(vector.rawgId);
    if (weight === undefined || weight === 0) {
      continue;
    }
    used += 1;
    for (let index = 0; index < EMBEDDING_DIMENSION; index += 1) {
      sum[index] = (sum[index] ?? 0) + weight * (vector.embedding[index] ?? 0);
    }
  }
  if (used === 0) {
    return null;
  }
  const norm = Math.sqrt(sum.reduce((total, value) => total + value * value, 0));
  if (norm === 0) {
    return null;
  }
  return sum.map((value) => value / norm);
}

export const recommendForMe = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<RecommendResult> => {
    const userId = await requireUserId(ctx);
    const limit = clampLimit(args.limit);
    const seeds: Seed[] = await ctx.runQuery(internal.rag.userSeeds, { userId });
    const positive = seeds.filter((seed) => seed.weight > 0);
    if (positive.length > 0) {
      const vectors: SeedVector[] = await ctx.runQuery(internal.rag.readVectors, {
        rawgIds: seeds.map((seed) => seed.rawgId),
        modality: "text",
      });
      const taste = tasteVector(seeds, vectors);
      if (taste !== null) {
        const games = await searchAndHydrate(ctx, taste, {
          limit,
          exclude: seeds.map((seed) => seed.rawgId),
          modality: "text",
        });
        if (games.length > 0) {
          return { source: "taste", games };
        }
      }
    }
    const snapshot: ListSnapshot | null = await ctx.runQuery(internal.catalog.readList, {
      key: FALLBACK_LIST_KEY,
    });
    const games = (snapshot?.games ?? []).slice(0, limit).map((game) => ({ ...game, score: 0 }));
    return { source: "popular", games };
  },
});

export const debugSearch = internalAction({
  args: {
    query: v.string(),
    purpose: v.optional(v.string()),
    limit: v.optional(v.number()),
    modality: v.optional(modalityValidator),
  },
  handler: async (ctx, args): Promise<DebugSearchResult> => {
    const purpose = args.purpose ?? QUERY_PURPOSE;
    const embedStart = Date.now();
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: args.query,
      providerOptions: embeddingProviderOptions(purpose),
    });
    const embedMs = Date.now() - embedStart;
    const searchStart = Date.now();
    const raw = await vectorHits(
      ctx,
      embedding,
      args.modality ?? "text",
      args.limit ?? DEBUG_LIMIT
    );
    const searchMs = Date.now() - searchStart;
    const scored: ScoredId[] = await ctx.runQuery(internal.rag.resolveHits, { hits: raw });
    const names: Array<string | null> = await ctx.runQuery(internal.rag.namesByRawgIds, {
      rawgIds: scored.map((entry) => entry.rawgId),
    });
    return {
      query: args.query,
      purpose,
      embedMs,
      searchMs,
      hits: scored.map((entry, index) => ({
        rawgId: entry.rawgId,
        score: Math.round(entry.score * 1000) / 1000,
        name: names[index] ?? null,
      })),
    };
  },
});

export type GamePageRow = {
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

export const gamesPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (
    ctx,
    args
  ): Promise<{ page: GamePageRow[]; isDone: boolean; continueCursor: string }> => {
    const result = await ctx.db
      .query("games")
      .paginate({ cursor: args.cursor, numItems: Math.min(args.numItems, GAMES_PAGE_MAX) });
    return {
      page: result.page.map((doc) => ({
        rawgId: doc.rawgId,
        name: doc.name,
        released: doc.released,
        genres: doc.genres,
        platforms: doc.platforms,
        tags: doc.tags ?? [],
        developers: doc.developers,
        publishers: doc.publishers,
        descriptionRaw: doc.descriptionRaw,
        hasDetail: doc.detailFetchedAt > 0,
      })),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const vectorMeta = internalQuery({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<Array<{ rawgId: number; docHash: string } | null>> => {
    const docs = await Promise.all(
      args.rawgIds.slice(0, EMBED_BATCH_MAX).map((rawgId) =>
        ctx.db
          .query("gameVectors")
          .withIndex("by_rawgId_modality", (q) => q.eq("rawgId", rawgId).eq("modality", "text"))
          .first()
      )
    );
    return docs.map((doc) => (doc === null ? null : { rawgId: doc.rawgId, docHash: doc.docHash }));
  },
});

export const upsertTextVectors = internalMutation({
  args: {
    rows: v.array(
      v.object({
        rawgId: v.number(),
        embedding: v.array(v.float64()),
        docHash: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();
    const existing = await Promise.all(
      args.rows.map((row) =>
        ctx.db
          .query("gameVectors")
          .withIndex("by_rawgId_modality", (q) => q.eq("rawgId", row.rawgId).eq("modality", "text"))
          .first()
      )
    );
    await Promise.all(
      args.rows.map((row, index) => {
        const fields = {
          rawgId: row.rawgId,
          modality: "text" as const,
          embedding: row.embedding,
          docHash: row.docHash,
          templateVersion: TEMPLATE_VERSION,
          source: "rawg" as const,
          embeddedAt: now,
        };
        const current = existing[index] ?? null;
        if (current === null) {
          return ctx.db.insert("gameVectors", fields);
        }
        return ctx.db.replace("gameVectors", current._id, fields);
      })
    );
  },
});

export type EmbedGamesResult = { considered: number; embedded: number; skipped: number };

export const embedGames = internalAction({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<EmbedGamesResult> => {
    const rawgIds = Array.from(new Set(args.rawgIds)).slice(0, EMBED_BATCH_MAX);
    if (rawgIds.length === 0) {
      return { considered: 0, embedded: 0, skipped: 0 };
    }
    const [games, metas]: [CatalogGame[], Array<{ rawgId: number; docHash: string } | null>] =
      await Promise.all([
        ctx.runQuery(internal.catalog.readGamesByRawgIds, { rawgIds }),
        ctx.runQuery(internal.rag.vectorMeta, { rawgIds }),
      ]);
    const hashByRawgId = new Map<number, string>();
    for (const meta of metas) {
      if (meta !== null) {
        hashByRawgId.set(meta.rawgId, meta.docHash);
      }
    }
    const pending: Array<{ rawgId: number; document: string; docHash: string }> = [];
    for (const game of games) {
      const existingHash = hashByRawgId.get(game.rawgId);
      if (existingHash !== undefined && !game.hasDetail) {
        continue;
      }
      const document = buildGameDocument({
        name: game.name,
        released: game.released,
        genres: game.genres,
        platforms: game.platforms,
        tags: game.tags,
        developers: game.developers,
        publishers: game.publishers,
        description: game.descriptionRaw,
      });
      const docHash = hashDocument(document);
      if (existingHash === docHash) {
        continue;
      }
      pending.push({ rawgId: game.rawgId, document, docHash });
    }
    if (pending.length === 0) {
      return { considered: rawgIds.length, embedded: 0, skipped: rawgIds.length };
    }
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: pending.map((item) => item.document),
      providerOptions: embeddingProviderOptions(INDEX_PURPOSE),
      maxParallelCalls: EMBED_PARALLEL_CALLS,
      maxRetries: 4,
    });
    const rows: Array<{ rawgId: number; embedding: number[]; docHash: string }> = [];
    pending.forEach((item, index) => {
      const embedding = embeddings[index];
      if (embedding !== undefined && embedding.length === EMBEDDING_DIMENSION) {
        rows.push({ rawgId: item.rawgId, embedding, docHash: item.docHash });
      }
    });
    if (rows.length > 0) {
      await ctx.runMutation(internal.rag.upsertTextVectors, { rows });
    }
    return {
      considered: rawgIds.length,
      embedded: rows.length,
      skipped: rawgIds.length - rows.length,
    };
  },
});

export const debugSearchVector = internalAction({
  args: {
    vector: v.array(v.float64()),
    modality: v.optional(modalityValidator),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ searchMs: number; hits: Array<ScoredId & { modality: string }> }> => {
    const started = Date.now();
    const raw = await vectorHits(ctx, args.vector, args.modality, args.limit ?? DEBUG_LIMIT);
    const searchMs = Date.now() - started;
    const docs: Array<{ rawgId: number; modality: string } | null> = await ctx.runQuery(
      internal.rag.vectorDocs,
      { ids: raw.map((hit) => hit.id) }
    );
    const hits: Array<ScoredId & { modality: string }> = [];
    raw.forEach((hit, index) => {
      const doc = docs[index] ?? null;
      if (doc !== null) {
        hits.push({ rawgId: doc.rawgId, score: hit.score, modality: doc.modality });
      }
    });
    return { searchMs, hits };
  },
});

export const vectorDocs = internalQuery({
  args: { ids: v.array(v.id("gameVectors")) },
  handler: async (ctx, args): Promise<Array<{ rawgId: number; modality: string } | null>> => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get("gameVectors", id)));
    return docs.map((doc) =>
      doc === null ? null : { rawgId: doc.rawgId, modality: doc.modality }
    );
  },
});

export const debugSimilar = internalAction({
  args: { rawgId: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ searchMs: number; hits: ScoredId[] }> => {
    const seeds: SeedVector[] = await ctx.runQuery(internal.rag.readVectors, {
      rawgIds: [args.rawgId],
      modality: "text",
    });
    const seed = seeds[0];
    if (seed === undefined) {
      return { searchMs: 0, hits: [] };
    }
    const started = Date.now();
    const raw = await ctx.vectorSearch("gameVectors", "by_embedding", {
      vector: seed.embedding,
      limit: (args.limit ?? DEBUG_LIMIT) + 1,
      filter: (q) => q.eq("modality", "text"),
    });
    const searchMs = Date.now() - started;
    const scored: ScoredId[] = await ctx.runQuery(internal.rag.resolveHits, {
      hits: raw.map((hit) => ({ id: hit._id, score: hit._score })),
    });
    return {
      searchMs,
      hits: scored
        .filter((entry) => entry.rawgId !== args.rawgId)
        .slice(0, args.limit ?? DEBUG_LIMIT),
    };
  },
});

export const resolveHits = internalQuery({
  args: { hits: v.array(hitValidator) },
  handler: async (ctx, args): Promise<ScoredId[]> => await resolveHitIds(ctx, args.hits),
});

export const gamesWithoutVector = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (
    ctx,
    args
  ): Promise<{ rawgIds: number[]; isDone: boolean; continueCursor: string }> => {
    const page = await ctx.db
      .query("games")
      .paginate({ cursor: args.cursor, numItems: Math.min(args.numItems, BACKFILL_PAGE) });
    const vectors = await Promise.all(
      page.page.map((doc) =>
        ctx.db
          .query("gameVectors")
          .withIndex("by_rawgId_modality", (q) => q.eq("rawgId", doc.rawgId).eq("modality", "text"))
          .first()
      )
    );
    const rawgIds: number[] = [];
    page.page.forEach((doc, index) => {
      if ((vectors[index] ?? null) === null) {
        rawgIds.push(doc.rawgId);
      }
    });
    return { rawgIds, isDone: page.isDone, continueCursor: page.continueCursor };
  },
});

export const backfillMissingVectors = internalAction({
  args: {},
  handler: async (ctx): Promise<EmbedGamesResult> => {
    const missing: number[] = [];
    let cursor: string | null = null;
    while (missing.length < BACKFILL_CAP) {
      const page: { rawgIds: number[]; isDone: boolean; continueCursor: string } =
        await ctx.runQuery(internal.rag.gamesWithoutVector, {
          cursor,
          numItems: BACKFILL_PAGE,
        });
      missing.push(...page.rawgIds);
      if (page.isDone) {
        break;
      }
      cursor = page.continueCursor;
    }
    const batch = missing.slice(0, BACKFILL_CAP);
    const results: EmbedGamesResult[] = [];
    for (let index = 0; index < batch.length; index += EMBED_BATCH_MAX) {
      // react-doctor-disable-next-line react-doctor/async-await-in-loop
      const result: EmbedGamesResult = await ctx.runAction(internal.rag.embedGames, {
        rawgIds: batch.slice(index, index + EMBED_BATCH_MAX),
      });
      results.push(result);
    }
    return results.reduce(
      (total, result) => ({
        considered: total.considered + result.considered,
        embedded: total.embedded + result.embedded,
        skipped: total.skipped + result.skipped,
      }),
      { considered: 0, embedded: 0, skipped: 0 }
    );
  },
});

export const topWarmQueue = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args): Promise<Array<{ id: Id<"warmQueue">; rawgId: number }>> => {
    const rows = await ctx.db
      .query("warmQueue")
      .withIndex("by_hits")
      .order("desc")
      .take(Math.min(args.limit, MAX_COLD_INGEST));
    return rows.map((row) => ({ id: row._id, rawgId: row.rawgId }));
  },
});

export const dequeueWarm = internalMutation({
  args: { ids: v.array(v.id("warmQueue")) },
  handler: async (ctx, args): Promise<void> => {
    await Promise.all(args.ids.map((id) => ctx.db.delete("warmQueue", id)));
  },
});

export const drainWarmQueue = internalAction({
  args: {},
  handler: async (ctx): Promise<number> => {
    const rows: Array<{ id: Id<"warmQueue">; rawgId: number }> = await ctx.runQuery(
      internal.rag.topWarmQueue,
      { limit: MAX_COLD_INGEST }
    );
    if (rows.length === 0) {
      return 0;
    }
    const games: CatalogGame[] = await ctx.runAction(internal.ingest.refreshGamesByIds, {
      rawgIds: rows.map((row) => row.rawgId),
    });
    await ctx.runMutation(internal.rag.dequeueWarm, { ids: rows.map((row) => row.id) });
    return games.length;
  },
});

export const tasteSummary = internalQuery({
  args: { userId: v.id("users"), limit: v.number() },
  handler: async (
    ctx,
    args
  ): Promise<{ library: string[]; wishlist: string[]; loved: string[]; disliked: string[] }> => {
    const limit = Math.min(args.limit, SEED_SCAN);
    const [library, wishlist, reviews] = await Promise.all([
      ctx.db
        .query("library")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit),
      ctx.db
        .query("wishlist")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit),
      ctx.db
        .query("reviews")
        .withIndex("by_user_game", (q) => q.eq("userId", args.userId))
        .take(limit),
    ]);
    const loved: string[] = [];
    const disliked: string[] = [];
    for (const review of reviews) {
      if (review.rating >= LOVED_RATING) {
        loved.push(`${review.gameName} (${review.rating}/10)`);
      } else if (review.rating <= DISLIKED_RATING) {
        disliked.push(`${review.gameName} (${review.rating}/10)`);
      }
    }
    return {
      library: library.map((entry) => entry.gameName),
      wishlist: wishlist.map((entry) => entry.gameName),
      loved,
      disliked,
    };
  },
});

export const debugRawgSearch = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, args): Promise<{ ms: number; results: number }> => {
    const started = Date.now();
    const payload = await rawgRequest<RawgListResponse<RawgGame>>(
      `games?search=${encodeURIComponent(args.query)}&ordering=-added&search_exact=true&page_size=20`
    );
    return { ms: Date.now() - started, results: payload.results?.length ?? 0 };
  },
});
