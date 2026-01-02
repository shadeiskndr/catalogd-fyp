import { Agent, createTool, stepCountIs, type ToolCtx } from "@convex-dev/agent";
import { z } from "zod";
import type { CatalogGame } from "@/lib/game-types";
import { mediaModality } from "@/lib/media-types";
import { bedrockEmbedImage } from "@/lib/rag-image-embed";
import { getChatModel, QUERY_PURPOSE, RUNTIME_MODEL, tokenCostUsd } from "@/lib/rag-models";
import type { RagFilters, RagResult } from "@/lib/rag-types";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { GameSnapshot } from "./catalog";
import { type AttachmentRow, type DescribeOutcome, describeBytes, provenanceWrap } from "./media";
import { embedQuery, type Seed, type SeedVector, searchAndHydrate, tasteVector } from "./rag";

const TOOL_RESULT_LIMIT = 8;
const SIMILAR_LIMIT = 8;
const TASTE_LIMIT = 8;
const MAX_STEPS = 6;
const SUMMARY_NAMES = 12;

export type CompactGame = {
  name: string;
  slug: string;
  year: string;
  genres: string[];
  platforms: string[];
  metacritic: number | null;
  playtimeHours: number | null;
  score: number;
};

export type GameToolResult = {
  games: CompactGame[];
  rawgIds: number[];
  note?: string;
};

const filtersSchema = z
  .object({
    genres: z
      .array(z.string())
      .optional()
      .describe("Keep only games whose RAWG genres include any of these, e.g. RPG, Indie, Puzzle"),
    platforms: z
      .array(z.string())
      .optional()
      .describe(
        "Keep only games available on any of these platforms, e.g. PlayStation 5, Nintendo Switch, PC"
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe("Keep only games tagged with any of these, e.g. Co-op, Souls-like"),
    minMetacritic: z.number().min(0).max(100).optional().describe("Minimum Metacritic score"),
    maxPlaytime: z.number().min(1).optional().describe("Maximum typical playtime in hours"),
    releasedAfter: z
      .string()
      .optional()
      .describe("Only games released on or after this date, YYYY or YYYY-MM-DD"),
    releasedBefore: z
      .string()
      .optional()
      .describe("Only games released on or before this date, YYYY or YYYY-MM-DD"),
  })
  .optional();

function toFilters(input: z.infer<typeof filtersSchema>): RagFilters | undefined {
  if (input === undefined) {
    return undefined;
  }
  return {
    ...(input.genres === undefined ? {} : { genres: input.genres }),
    ...(input.platforms === undefined ? {} : { platforms: input.platforms }),
    ...(input.tags === undefined ? {} : { tags: input.tags }),
    ...(input.minMetacritic === undefined ? {} : { minMetacritic: input.minMetacritic }),
    ...(input.maxPlaytime === undefined ? {} : { maxPlaytime: input.maxPlaytime }),
    ...(input.releasedAfter === undefined ? {} : { releasedAfter: input.releasedAfter }),
    ...(input.releasedBefore === undefined ? {} : { releasedBefore: input.releasedBefore }),
  };
}

export function compactGame(game: RagResult): CompactGame {
  return {
    name: game.name,
    slug: game.slug,
    year: game.released.slice(0, 4),
    genres: game.genres.slice(0, 3),
    platforms: game.platforms.slice(0, 4),
    metacritic: game.metacritic > 0 ? game.metacritic : null,
    playtimeHours: game.playtime > 0 ? game.playtime : null,
    score: Math.round(game.score * 1000) / 1000,
  };
}

function toToolResult(results: RagResult[], note?: string): GameToolResult {
  return {
    games: results.map(compactGame),
    rawgIds: results.map((game) => game.rawgId),
    ...(note === undefined ? {} : { note }),
  };
}

function requireToolUser(ctx: ToolCtx): Id<"users"> {
  if (ctx.userId === undefined) {
    throw new Error("This conversation has no signed-in user.");
  }
  return ctx.userId as Id<"users">;
}

async function resolveGame(ctx: ToolCtx, slug: string): Promise<CatalogGame | null> {
  const snapshot: GameSnapshot | null = await ctx.runQuery(internal.catalog.readGameBySlug, {
    slug,
  });
  if (snapshot !== null) {
    return snapshot.game;
  }
  return await ctx.runAction(internal.ingest.refreshGame, { slug });
}

export const searchGames = createTool({
  description:
    "Semantic search over 21,000+ console games by meaning. Describe the kind of game in natural " +
    "language (mood, mechanics, setting, comparisons) rather than typing a title. Returns the " +
    "closest matches; the user sees them as cards, so you only need to comment on a few.",
  inputSchema: z.object({
    query: z.string().min(2).describe("A natural-language description of what the user wants"),
    filters: filtersSchema,
  }),
  execute: async (ctx, { query, filters }): Promise<GameToolResult> => {
    const vector = await embedQuery(query);
    const results = await searchAndHydrate(ctx, vector, {
      limit: TOOL_RESULT_LIMIT,
      exclude: [],
      modality: "text",
      ...(toFilters(filters) === undefined ? {} : { filters: toFilters(filters) as RagFilters }),
    });
    return toToolResult(
      results,
      results.length === 0 ? "No games matched. Loosen the filters or rephrase." : undefined
    );
  },
});

export const similarToGame = createTool({
  description:
    "Find games most similar to one specific title the user named. Pass the game's slug " +
    "(lowercase, hyphenated, e.g. hollow-knight, the-witcher-3-wild-hunt).",
  inputSchema: z.object({
    slug: z.string().min(1).describe("RAWG slug of the seed game"),
    filters: filtersSchema,
  }),
  execute: async (ctx, { slug, filters }): Promise<GameToolResult> => {
    const game = await resolveGame(ctx, slug);
    if (game === null) {
      return {
        games: [],
        rawgIds: [],
        note: `No game found for slug "${slug}". Try searchGames with the title instead.`,
      };
    }
    const seeds: SeedVector[] = await ctx.runQuery(internal.rag.readVectors, {
      rawgIds: [game.rawgId],
      modality: "text",
    });
    const seed = seeds[0];
    if (seed === undefined) {
      return {
        games: [],
        rawgIds: [],
        note: `${game.name} is not in the vector index yet. Use searchGames with a description of it.`,
      };
    }
    const results = await searchAndHydrate(ctx, seed.embedding, {
      limit: SIMILAR_LIMIT,
      exclude: [game.rawgId],
      modality: "text",
      ...(toFilters(filters) === undefined ? {} : { filters: toFilters(filters) as RagFilters }),
    });
    return toToolResult(results, `Seed: ${game.name} (${game.released.slice(0, 4)})`);
  },
});

export type TasteResult = GameToolResult & {
  library: string[];
  wishlist: string[];
  loved: string[];
  disliked: string[];
};

export const myTaste = createTool({
  description:
    "Summarise the signed-in user's library, wishlist and ratings, and return games close to " +
    "their overall taste vector. Call this when the user asks for something 'for me' or based on " +
    "what they already play.",
  inputSchema: z.object({}),
  execute: async (ctx): Promise<TasteResult> => {
    const userId = requireToolUser(ctx);
    const [seeds, summary]: [
      Seed[],
      { library: string[]; wishlist: string[]; loved: string[]; disliked: string[] },
    ] = await Promise.all([
      ctx.runQuery(internal.rag.userSeeds, { userId }),
      ctx.runQuery(internal.rag.tasteSummary, { userId, limit: SUMMARY_NAMES }),
    ]);
    if (seeds.length === 0) {
      return {
        ...summary,
        games: [],
        rawgIds: [],
        note: "The user has not saved or rated any games yet. Ask what they enjoy, then use searchGames.",
      };
    }
    const vectors: SeedVector[] = await ctx.runQuery(internal.rag.readVectors, {
      rawgIds: seeds.map((seed) => seed.rawgId),
      modality: "text",
    });
    const taste = tasteVector(seeds, vectors);
    if (taste === null) {
      return { ...summary, games: [], rawgIds: [], note: "No vectors yet for the user's games." };
    }
    const results = await searchAndHydrate(ctx, taste, {
      limit: TASTE_LIMIT,
      exclude: seeds.map((seed) => seed.rawgId),
      modality: "text",
    });
    return { ...summary, ...toToolResult(results) };
  },
});

export const addToList = createTool({
  description:
    "Save a game to the user's library or wishlist. Only call this when the user clearly asks to " +
    "save, add or wishlist a specific game.",
  inputSchema: z.object({
    slug: z.string().min(1).describe("RAWG slug of the game"),
    list: z.enum(["library", "wishlist"]),
  }),
  execute: async (ctx, { slug, list }): Promise<{ ok: boolean; message: string }> => {
    const userId = requireToolUser(ctx);
    const game = await resolveGame(ctx, slug);
    if (game === null) {
      return { ok: false, message: `No game found for slug "${slug}".` };
    }
    const added: boolean = await ctx.runMutation(internal.lists.addForUser, {
      userId,
      list,
      gameId: game.rawgId,
      gameName: game.name,
    });
    return {
      ok: true,
      message: added
        ? `${game.name} added to the ${list}.`
        : `${game.name} was already in the ${list}.`,
    };
  },
});

async function loadOwnedAttachment(
  ctx: ToolCtx,
  attachmentId: string
): Promise<{ row: AttachmentRow; bytes: Uint8Array } | string> {
  const userId = requireToolUser(ctx);
  const row: AttachmentRow | null = await ctx.runQuery(internal.media.attachmentById, {
    id: attachmentId as Id<"aiRecAttachments">,
  });
  if (row === null || row.userId !== userId) {
    return `Attachment ${attachmentId} was not found in this conversation.`;
  }
  const blob = await ctx.storage.get(row.storageId);
  if (blob === null) {
    return `Attachment ${row.filename} is no longer available.`;
  }
  return { row, bytes: new Uint8Array(await blob.arrayBuffer()) };
}

export const describeMedia = createTool({
  description:
    "Read an attachment the user uploaded (image, short video or audio clip) as text. You cannot " +
    "see or hear media yourself; this asks a vision or audio helper model and returns its full " +
    "description or transcript. Use the id from the attachment list in the user's message.",
  inputSchema: z.object({
    attachmentId: z.string().min(1).describe("The attachment id from the user's message"),
  }),
  execute: async (ctx, { attachmentId }): Promise<string> => {
    const loaded = await loadOwnedAttachment(ctx, attachmentId);
    if (typeof loaded === "string") {
      throw new Error(loaded);
    }
    const { row, bytes } = loaded;
    const modality = mediaModality(row.mediaType);
    if (modality === null) {
      throw new Error(`${row.filename} has an unsupported type (${row.mediaType}).`);
    }
    if (row.description !== null) {
      return row.description;
    }
    const outcome: DescribeOutcome = await describeBytes(ctx, {
      bytes,
      mediaType: row.mediaType,
      modality,
      userId: row.userId,
      threadId: ctx.threadId ?? "",
    });
    if (!outcome.ok) {
      throw new Error(
        `Could not read ${row.filename}: ${outcome.failures.join("; ")}. Tell the user the attachment could not be read.`
      );
    }
    const text = provenanceWrap(
      modality,
      row.filename,
      outcome.modelId,
      outcome.text,
      outcome.truncated
    );
    await ctx.runMutation(internal.media.saveDescription, { id: row.id, description: text });
    return text;
  },
});

export const searchGamesByImage = createTool({
  description:
    "Find games that look like an attached image (a screenshot or box art) by embedding the " +
    "image itself into the same vector space as the catalogue's cover art and descriptions. " +
    "Cheaper than describeMedia and works even when the image has no text. Pass the attachment id.",
  inputSchema: z.object({
    attachmentId: z.string().min(1).describe("The attachment id from the user's message"),
    filters: filtersSchema,
  }),
  execute: async (ctx, { attachmentId, filters }): Promise<GameToolResult> => {
    const loaded = await loadOwnedAttachment(ctx, attachmentId);
    if (typeof loaded === "string") {
      throw new Error(loaded);
    }
    if (mediaModality(loaded.row.mediaType) !== "image") {
      throw new Error(`${loaded.row.filename} is not an image; use describeMedia instead.`);
    }
    const { embedding } = await bedrockEmbedImage(loaded.bytes, QUERY_PURPOSE);
    const results = await searchAndHydrate(ctx, embedding, {
      limit: TOOL_RESULT_LIMIT,
      exclude: [],
      ...(toFilters(filters) === undefined ? {} : { filters: toFilters(filters) as RagFilters }),
    });
    return toToolResult(
      results,
      results.length === 0
        ? "Nothing visually similar was found."
        : `Visual matches for ${loaded.row.filename}`
    );
  },
});

export const SYSTEM_PROMPT =
  "You are Catalogd's game recommender, a friendly expert on console games. " +
  "Your job is to understand what the user is in the mood for and then find it with your tools. " +
  "Search first, then refine: never ask which platform, genre or budget before you have shown results, and never ask more than one clarifying question in a row. " +
  "Use searchGames for descriptive requests, similarToGame when the user names a title they liked, and myTaste when they ask for something based on their own library, wishlist or ratings. " +
  "Only call addToList when the user explicitly asks you to save or wishlist a game. " +
  "When the user attaches an image, call searchGamesByImage with its id for visual matches and describeMedia when you need to know what it shows or read its text; for clips and voice notes call describeMedia, then search based on the description. " +
  "Search results are shown to the user as game cards under your reply, so do not repeat every result. " +
  "Highlight two or three picks, say in one sentence each why they fit, and offer to narrow down. " +
  "Use the year, genres and Metacritic score from the tool results; never invent facts about a game. " +
  "Refer to games by name only: never mention ids, slugs, scores from the vector search or tool field names. " +
  "Keep replies under 120 words, plain markdown, no emojis, no headings.";

export const recommenderAgent = new Agent(components.agent, {
  name: "catalogd-recommender",
  languageModel: getChatModel(RUNTIME_MODEL),
  instructions: SYSTEM_PROMPT,
  tools: { searchGames, similarToGame, myTaste, addToList, describeMedia, searchGamesByImage },
  stopWhen: stepCountIs(MAX_STEPS),
  usageHandler: async (ctx, args) => {
    if (args.userId === undefined || args.threadId === undefined) {
      return;
    }
    const inputTokens = args.usage.inputTokens ?? 0;
    const outputTokens = args.usage.outputTokens ?? 0;
    await ctx.runMutation(internal.aiRec.recordUsage, {
      userId: args.userId as Id<"users">,
      threadId: args.threadId,
      kind: "turn",
      model: args.model,
      inputTokens,
      outputTokens,
      costUsd:
        tokenCostUsd(inputTokens, RUNTIME_MODEL.pricing.inputPer1M) +
        tokenCostUsd(outputTokens, RUNTIME_MODEL.pricing.outputPer1M),
      toolCalls: 0,
      durationMs: 0,
    });
  },
});
