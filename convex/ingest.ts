import { v } from "convex/values";
import type { CatalogGame, CatalogGenre, CatalogList, CatalogScreenshot } from "@/lib/game-types";
import { normalizeRawgMediaPath } from "@/lib/rawg-image-path";
import { internal } from "./_generated/api";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import {
  isValidSlug,
  type RawgGame,
  type RawgGenre,
  type RawgListResponse,
  type RawgNamed,
  type RawgPlatformEntry,
  type RawgScreenshot,
  rawgRequest,
  rawgRequestOptional,
  resolveListEndpoint,
} from "./rawg";

const MAX_GENRES = 100;
const MAX_ENSURE_GAMES = 30;
const BACKFILL_SCAN_SIZE = 500;
const BACKFILL_BATCH_SIZE = 60;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_PAGE_SIZE = 20;
const WARM_STAGGER_MS = 3000;

const HOT_LIST_KEYS = [
  "popular:1",
  "popular:2",
  "popular:3",
  "new-releases:1",
  "new-releases:2",
  "upcoming:1",
  "featured:1",
  "featured:2",
  "featured:3",
];

const summaryFields = {
  rawgId: v.number(),
  slug: v.string(),
  name: v.string(),
  released: v.string(),
  backgroundImage: v.string(),
  metacritic: v.number(),
  ratingsCount: v.number(),
  genres: v.array(v.string()),
  platforms: v.array(v.string()),
};

const detailFields = {
  ...summaryFields,
  developers: v.array(v.string()),
  publishers: v.array(v.string()),
  descriptionRaw: v.string(),
  website: v.string(),
  screenshots: v.array(v.object({ id: v.number(), image: v.string() })),
};

const genreFields = {
  rawgId: v.number(),
  slug: v.string(),
  name: v.string(),
  gamesCount: v.number(),
  imageBackground: v.string(),
};

type GameSummaryInput = {
  rawgId: number;
  slug: string;
  name: string;
  released: string;
  backgroundImage: string;
  metacritic: number;
  ratingsCount: number;
  genres: string[];
  platforms: string[];
};

type GameDetailInput = GameSummaryInput & {
  developers: string[];
  publishers: string[];
  descriptionRaw: string;
  website: string;
  screenshots: CatalogScreenshot[];
};

function text(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}

function numeric(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function namedList(values: RawgNamed[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const names: string[] = [];
  for (const entry of values) {
    const name = text(entry.name);
    if (name.length > 0) {
      names.push(name);
    }
  }
  return names;
}

function platformList(values: RawgPlatformEntry[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const names: string[] = [];
  for (const entry of values) {
    const name = text(entry.platform?.name);
    if (name.length > 0) {
      names.push(name);
    }
  }
  return names;
}

function screenshotList(values: RawgScreenshot[] | null | undefined): CatalogScreenshot[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const shots: CatalogScreenshot[] = [];
  for (const entry of values) {
    const image = text(entry.image);
    if (image.length === 0) {
      continue;
    }
    const id = numeric(entry.id);
    shots.push({ id: id === 0 ? shots.length + 1 : id, image });
  }
  return shots;
}

function mapSummary(raw: RawgGame): GameSummaryInput | null {
  const rawgId = numeric(raw.id);
  const slug = text(raw.slug);
  const name = text(raw.name);
  if (rawgId === 0 || slug.length === 0 || name.length === 0) {
    return null;
  }
  const platforms = platformList(raw.platforms);
  return {
    rawgId,
    slug,
    name,
    released: text(raw.released),
    backgroundImage: text(raw.background_image),
    metacritic: numeric(raw.metacritic),
    ratingsCount: numeric(raw.ratings_count),
    genres: namedList(raw.genres),
    platforms: platforms.length > 0 ? platforms : platformList(raw.parent_platforms),
  };
}

function mapDetail(raw: RawgGame, screenshots: CatalogScreenshot[]): GameDetailInput | null {
  const summary = mapSummary(raw);
  if (summary === null) {
    return null;
  }
  return {
    ...summary,
    developers: namedList(raw.developers),
    publishers: namedList(raw.publishers),
    descriptionRaw: text(raw.description_raw),
    website: text(raw.website),
    screenshots: screenshots.length > 0 ? screenshots : screenshotList(raw.short_screenshots),
  };
}

function mapSummaries(results: RawgGame[] | null | undefined): GameSummaryInput[] {
  if (!Array.isArray(results)) {
    return [];
  }
  const seen = new Set<number>();
  const summaries: GameSummaryInput[] = [];
  for (const raw of results) {
    const summary = mapSummary(raw);
    if (summary === null || seen.has(summary.rawgId)) {
      continue;
    }
    seen.add(summary.rawgId);
    summaries.push(summary);
  }
  return summaries;
}

function mapGenres(results: RawgGenre[] | null | undefined): CatalogGenre[] {
  if (!Array.isArray(results)) {
    return [];
  }
  const genres: CatalogGenre[] = [];
  for (const raw of results) {
    const rawgId = numeric(raw.id);
    const slug = text(raw.slug);
    const name = text(raw.name);
    if (rawgId === 0 || slug.length === 0 || name.length === 0) {
      continue;
    }
    genres.push({
      rawgId,
      slug,
      name,
      gamesCount: numeric(raw.games_count),
      imageBackground: text(raw.image_background),
    });
  }
  return genres;
}

export function summaryToCatalog(input: GameSummaryInput): CatalogGame {
  return {
    ...input,
    developers: [],
    publishers: [],
    descriptionRaw: "",
    website: "",
    screenshots: [],
    hasDetail: false,
  };
}

function detailToCatalog(input: GameDetailInput): CatalogGame {
  return { ...input, hasDetail: true };
}

async function scheduleImageWarm(ctx: ActionCtx, urls: string[]): Promise<void> {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const url of urls) {
    const path = normalizeRawgMediaPath(url);
    if (path !== null && !seen.has(path)) {
      seen.add(path);
      paths.push(path);
    }
  }
  if (paths.length === 0) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.images.warm, { sourcePaths: paths });
}

async function touchSync(ctx: MutationCtx, key: string): Promise<void> {
  const existing = await ctx.db
    .query("syncState")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (existing === null) {
    await ctx.db.insert("syncState", { key, fetchedAt: Date.now() });
    return;
  }
  await ctx.db.patch("syncState", existing._id, { fetchedAt: Date.now() });
}

export async function ensureGameIngested(ctx: MutationCtx, rawgId: number): Promise<void> {
  const existing = await ctx.db
    .query("games")
    .withIndex("by_rawgId", (q) => q.eq("rawgId", rawgId))
    .first();
  if (existing !== null) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.ingest.refreshGamesByIds, { rawgIds: [rawgId] });
}

export const genreSlugs = internalQuery({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const rows = await ctx.db.query("genres").take(MAX_GENRES);
    return rows.map((row) => row.slug);
  },
});

export const missingReferencedGameIds = internalQuery({
  args: {},
  handler: async (ctx): Promise<number[]> => {
    const [reviews, library, wishlist] = await Promise.all([
      ctx.db.query("reviews").take(BACKFILL_SCAN_SIZE),
      ctx.db.query("library").take(BACKFILL_SCAN_SIZE),
      ctx.db.query("wishlist").take(BACKFILL_SCAN_SIZE),
    ]);
    const referenced = new Set<number>();
    for (const row of [...reviews, ...library, ...wishlist]) {
      referenced.add(row.gameId);
    }
    const ids = Array.from(referenced);
    const existing = await Promise.all(
      ids.map((rawgId) =>
        ctx.db
          .query("games")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", rawgId))
          .first()
      )
    );
    const missing: number[] = [];
    ids.forEach((rawgId, index) => {
      if ((existing[index] ?? null) === null) {
        missing.push(rawgId);
      }
    });
    return missing.slice(0, BACKFILL_BATCH_SIZE);
  },
});

export const backfillReferencedGames = internalAction({
  args: {},
  handler: async (ctx): Promise<number> => {
    const missing: number[] = await ctx.runQuery(internal.ingest.missingReferencedGameIds, {});
    if (missing.length === 0) {
      return 0;
    }
    const batches: number[][] = [];
    for (let index = 0; index < missing.length; index += MAX_ENSURE_GAMES) {
      batches.push(missing.slice(index, index + MAX_ENSURE_GAMES));
    }
    const results = await Promise.all(
      batches.map((rawgIds) => ctx.runAction(internal.ingest.refreshGamesByIds, { rawgIds }))
    );
    return results.reduce((total, games) => total + games.length, 0);
  },
});

export const saveSummaries = internalMutation({
  args: { games: v.array(v.object(summaryFields)) },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();
    const existing = await Promise.all(
      args.games.map((game) =>
        ctx.db
          .query("games")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", game.rawgId))
          .first()
      )
    );
    await Promise.all(
      args.games.map((game, index) => {
        const current = existing[index] ?? null;
        if (current === null) {
          return ctx.db.insert("games", {
            ...game,
            developers: [],
            publishers: [],
            descriptionRaw: "",
            website: "",
            screenshots: [],
            summaryFetchedAt: now,
            detailFetchedAt: 0,
          });
        }
        return ctx.db.patch("games", current._id, { ...game, summaryFetchedAt: now });
      })
    );
  },
});

export const saveDetails = internalMutation({
  args: { games: v.array(v.object(detailFields)) },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();
    const existing = await Promise.all(
      args.games.map((game) =>
        ctx.db
          .query("games")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", game.rawgId))
          .first()
      )
    );
    await Promise.all(
      args.games.map((game, index) => {
        const current = existing[index] ?? null;
        const fields = { ...game, summaryFetchedAt: now, detailFetchedAt: now };
        if (current === null) {
          return ctx.db.insert("games", fields);
        }
        return ctx.db.patch("games", current._id, fields);
      })
    );
  },
});

export const saveList = internalMutation({
  args: { key: v.string(), rawgIds: v.array(v.number()), count: v.number() },
  handler: async (ctx, args): Promise<void> => {
    const entry = {
      key: args.key,
      rawgIds: args.rawgIds,
      count: args.count,
      fetchedAt: Date.now(),
    };
    const existing = await ctx.db
      .query("gameLists")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing === null) {
      await ctx.db.insert("gameLists", entry);
      return;
    }
    await ctx.db.replace("gameLists", existing._id, entry);
  },
});

export const saveGenres = internalMutation({
  args: { genres: v.array(v.object(genreFields)) },
  handler: async (ctx, args): Promise<void> => {
    const existing = await Promise.all(
      args.genres.map((genre) =>
        ctx.db
          .query("genres")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", genre.rawgId))
          .first()
      )
    );
    await Promise.all(
      args.genres.map((genre, index) => {
        const current = existing[index] ?? null;
        if (current === null) {
          return ctx.db.insert("genres", genre);
        }
        return ctx.db.replace("genres", current._id, genre);
      })
    );
    await touchSync(ctx, "genres");
  },
});

export const refreshList = internalAction({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<CatalogList> => {
    const endpoint = resolveListEndpoint(args.key);
    if (endpoint === null) {
      throw new Error(`Unknown catalog list key: ${args.key}`);
    }
    const payload = await rawgRequest<RawgListResponse<RawgGame>>(endpoint);
    const summaries = mapSummaries(payload.results);
    const count = numeric(payload.count) === 0 ? summaries.length : numeric(payload.count);

    await ctx.runMutation(internal.ingest.saveSummaries, { games: summaries });
    await ctx.runMutation(internal.ingest.saveList, {
      key: args.key,
      rawgIds: summaries.map((summary) => summary.rawgId),
      count,
    });
    await scheduleImageWarm(
      ctx,
      summaries.map((summary) => summary.backgroundImage)
    );

    return { games: summaries.map(summaryToCatalog), count };
  },
});

export const refreshGame = internalAction({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<CatalogGame | null> => {
    if (!isValidSlug(args.slug)) {
      return null;
    }
    const [raw, shots] = await Promise.all([
      rawgRequestOptional<RawgGame>(`games/${args.slug}`),
      rawgRequestOptional<RawgListResponse<RawgScreenshot>>(`games/${args.slug}/screenshots`),
    ]);
    if (raw === null) {
      return null;
    }
    const detail = mapDetail(raw, screenshotList(shots?.results));
    if (detail === null) {
      return null;
    }
    await ctx.runMutation(internal.ingest.saveDetails, { games: [detail] });
    await scheduleImageWarm(ctx, [
      detail.backgroundImage,
      ...detail.screenshots.map((shot) => shot.image),
    ]);
    return detailToCatalog(detail);
  },
});

export const refreshGamesByIds = internalAction({
  args: { rawgIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<CatalogGame[]> => {
    const ids = Array.from(new Set(args.rawgIds)).slice(0, MAX_ENSURE_GAMES);
    const raws = await Promise.all(
      ids.map((rawgId) => rawgRequestOptional<RawgGame>(`games/${rawgId}`))
    );
    const details: GameDetailInput[] = [];
    for (const raw of raws) {
      if (raw === null) {
        continue;
      }
      const detail = mapDetail(raw, []);
      if (detail !== null) {
        details.push(detail);
      }
    }
    if (details.length === 0) {
      return [];
    }
    await ctx.runMutation(internal.ingest.saveDetails, { games: details });
    await scheduleImageWarm(
      ctx,
      details.map((detail) => detail.backgroundImage)
    );
    return details.map(detailToCatalog);
  },
});

export const ingestSearch = internalAction({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<number> => {
    const trimmed = args.query.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      return 0;
    }
    const payload = await rawgRequest<RawgListResponse<RawgGame>>(
      `games?search=${encodeURIComponent(trimmed)}&ordering=-added&search_exact=true&page-size=${SEARCH_PAGE_SIZE}`
    );
    const summaries = mapSummaries(payload.results);
    if (summaries.length === 0) {
      return 0;
    }
    await ctx.runMutation(internal.ingest.saveSummaries, { games: summaries });
    await scheduleImageWarm(
      ctx,
      summaries.map((summary) => summary.backgroundImage)
    );
    return summaries.length;
  },
});

export const refreshGenres = internalAction({
  args: {},
  handler: async (ctx): Promise<CatalogGenre[]> => {
    const payload = await rawgRequest<RawgListResponse<RawgGenre>>("genres");
    const genres = mapGenres(payload.results);
    if (genres.length === 0) {
      return [];
    }
    await ctx.runMutation(internal.ingest.saveGenres, { genres });
    await scheduleImageWarm(
      ctx,
      genres.map((genre) => genre.imageBackground)
    );
    return genres;
  },
});

export const warmHotLists = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    await Promise.all(
      HOT_LIST_KEYS.map((key, index) =>
        ctx.scheduler.runAfter(index * WARM_STAGGER_MS, internal.ingest.refreshList, { key })
      )
    );
  },
});

export const warmGenreLists = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const slugs: string[] = await ctx.runQuery(internal.ingest.genreSlugs, {});
    await Promise.all(
      slugs.map((slug, index) =>
        ctx.scheduler.runAfter(index * WARM_STAGGER_MS, internal.ingest.refreshList, {
          key: `genre:${slug}:1`,
        })
      )
    );
  },
});
