import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { CatalogGame, CatalogGenre, CatalogList } from "@/lib/game-types";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { ActionCtx, QueryCtx } from "./_generated/server";
import { action, internalQuery, query } from "./_generated/server";
import { isValidSlug, resolveListEndpoint } from "./rawg";

const LIST_TTL_MS = 60 * 60 * 1000;
const GAME_TTL_MS = 24 * 60 * 60 * 1000;
const GENRES_TTL_MS = 12 * 60 * 60 * 1000;

const MAX_GENRES = 100;
const MAX_LOOKUP_IDS = 60;
const DEFAULT_SEARCH_LIMIT = 12;
const MAX_SEARCH_LIMIT = 30;
const MIN_SEARCH_LENGTH = 3;

export type ListSnapshot = CatalogList & { fetchedAt: number };
export type GameSnapshot = { game: CatalogGame; detailFetchedAt: number };
export type GenresSnapshot = { genres: CatalogGenre[]; fetchedAt: number };

export function toCatalogGame(doc: Doc<"games">): CatalogGame {
  return {
    rawgId: doc.rawgId,
    slug: doc.slug,
    name: doc.name,
    released: doc.released,
    backgroundImage: doc.backgroundImage,
    metacritic: doc.metacritic,
    ratingsCount: doc.ratingsCount,
    genres: doc.genres,
    platforms: doc.platforms,
    developers: doc.developers,
    publishers: doc.publishers,
    descriptionRaw: doc.descriptionRaw,
    website: doc.website,
    screenshots: doc.screenshots,
    hasDetail: doc.detailFetchedAt > 0,
  };
}

function toCatalogGenre(doc: Doc<"genres">): CatalogGenre {
  return {
    rawgId: doc.rawgId,
    slug: doc.slug,
    name: doc.name,
    gamesCount: doc.gamesCount,
    imageBackground: doc.imageBackground,
  };
}

async function loadByRawgIds(ctx: QueryCtx, rawgIds: number[]): Promise<CatalogGame[]> {
  const unique = Array.from(new Set(rawgIds)).slice(0, MAX_LOOKUP_IDS);
  const docs = await Promise.all(
    unique.map((rawgId) =>
      ctx.db
        .query("games")
        .withIndex("by_rawgId", (q) => q.eq("rawgId", rawgId))
        .first()
    )
  );
  const games: CatalogGame[] = [];
  for (const doc of docs) {
    if (doc !== null) {
      games.push(toCatalogGame(doc));
    }
  }
  return games;
}

async function loadList(ctx: QueryCtx, key: string): Promise<ListSnapshot | null> {
  const entry = await ctx.db
    .query("gameLists")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (entry === null) {
    return null;
  }
  const byId = new Map<number, CatalogGame>(
    (await loadByRawgIds(ctx, entry.rawgIds)).map((game) => [game.rawgId, game])
  );
  const games: CatalogGame[] = [];
  for (const rawgId of entry.rawgIds) {
    const game = byId.get(rawgId);
    if (game !== undefined) {
      games.push(game);
    }
  }
  return { games, count: entry.count, fetchedAt: entry.fetchedAt };
}

async function loadGameBySlug(ctx: QueryCtx, slug: string): Promise<GameSnapshot | null> {
  const doc = await ctx.db
    .query("games")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
  if (doc === null) {
    return null;
  }
  return { game: toCatalogGame(doc), detailFetchedAt: doc.detailFetchedAt };
}

async function loadGenres(ctx: QueryCtx): Promise<GenresSnapshot> {
  const [docs, state] = await Promise.all([
    ctx.db.query("genres").take(MAX_GENRES),
    ctx.db
      .query("syncState")
      .withIndex("by_key", (q) => q.eq("key", "genres"))
      .first(),
  ]);
  return { genres: docs.map(toCatalogGenre), fetchedAt: state?.fetchedAt ?? 0 };
}

async function requireUser(ctx: ActionCtx): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }
}

export const readList = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<ListSnapshot | null> => await loadList(ctx, args.key),
});

export const readGameBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<GameSnapshot | null> => await loadGameBySlug(ctx, args.slug),
});

export const readGenres = internalQuery({
  args: {},
  handler: async (ctx): Promise<GenresSnapshot> => await loadGenres(ctx),
});

export const readGamesByRawgIds = internalQuery({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<CatalogGame[]> => await loadByRawgIds(ctx, args.rawgIds),
});

export const list = query({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<CatalogList | null> => {
    const snapshot = await loadList(ctx, args.key);
    return snapshot === null ? null : { games: snapshot.games, count: snapshot.count };
  },
});

export const gameBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<CatalogGame | null> => {
    if (!isValidSlug(args.slug)) {
      return null;
    }
    const snapshot = await loadGameBySlug(ctx, args.slug);
    return snapshot === null ? null : snapshot.game;
  },
});

export const gameByRawgId = query({
  args: { rawgId: v.number() },
  handler: async (ctx, args): Promise<CatalogGame | null> => {
    const doc = await ctx.db
      .query("games")
      .withIndex("by_rawgId", (q) => q.eq("rawgId", args.rawgId))
      .first();
    return doc === null ? null : toCatalogGame(doc);
  },
});

export const gamesByRawgIds = query({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<CatalogGame[]> => await loadByRawgIds(ctx, args.rawgIds),
});

export const search = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<CatalogGame[]> => {
    const trimmed = args.query.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      return [];
    }
    const limit = Math.min(args.limit ?? DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);
    const docs = await ctx.db
      .query("games")
      .withSearchIndex("search_name", (q) => q.search("name", trimmed))
      .take(limit);
    return docs.map(toCatalogGame);
  },
});

export const genreList = query({
  args: {},
  handler: async (ctx): Promise<CatalogGenre[]> => (await loadGenres(ctx)).genres,
});

export const ensureList = action({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<CatalogList> => {
    if (resolveListEndpoint(args.key) === null) {
      throw new ConvexError("Unknown catalog list");
    }
    const snapshot: ListSnapshot | null = await ctx.runQuery(internal.catalog.readList, {
      key: args.key,
    });
    if (snapshot === null) {
      return await ctx.runAction(internal.ingest.refreshList, { key: args.key });
    }
    if (Date.now() - snapshot.fetchedAt > LIST_TTL_MS) {
      await ctx.scheduler.runAfter(0, internal.ingest.refreshList, { key: args.key });
    }
    return { games: snapshot.games, count: snapshot.count };
  },
});

export const ensureGame = action({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<CatalogGame | null> => {
    if (!isValidSlug(args.slug)) {
      throw new ConvexError("Invalid game slug");
    }
    const snapshot: GameSnapshot | null = await ctx.runQuery(internal.catalog.readGameBySlug, {
      slug: args.slug,
    });
    if (snapshot === null || !snapshot.game.hasDetail) {
      return await ctx.runAction(internal.ingest.refreshGame, { slug: args.slug });
    }
    if (Date.now() - snapshot.detailFetchedAt > GAME_TTL_MS) {
      await ctx.scheduler.runAfter(0, internal.ingest.refreshGame, { slug: args.slug });
    }
    return snapshot.game;
  },
});

export const ensureGenres = action({
  args: {},
  handler: async (ctx): Promise<CatalogGenre[]> => {
    const snapshot: GenresSnapshot = await ctx.runQuery(internal.catalog.readGenres, {});
    if (snapshot.genres.length === 0) {
      return await ctx.runAction(internal.ingest.refreshGenres, {});
    }
    if (Date.now() - snapshot.fetchedAt > GENRES_TTL_MS) {
      await ctx.scheduler.runAfter(0, internal.ingest.refreshGenres, {});
    }
    return snapshot.genres;
  },
});

export const ensureGames = action({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<CatalogGame[]> => {
    await requireUser(ctx);
    const known: CatalogGame[] = await ctx.runQuery(internal.catalog.readGamesByRawgIds, {
      rawgIds: args.rawgIds,
    });
    const knownIds = new Set(known.map((game) => game.rawgId));
    const missing = args.rawgIds.filter((rawgId) => !knownIds.has(rawgId));
    if (missing.length === 0) {
      return known;
    }
    const fetched = await ctx.runAction(internal.ingest.refreshGamesByIds, { rawgIds: missing });
    return [...known, ...fetched];
  },
});

export const searchRemote = action({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<number> => {
    await requireUser(ctx);
    return await ctx.runAction(internal.ingest.ingestSearch, { query: args.query });
  },
});
