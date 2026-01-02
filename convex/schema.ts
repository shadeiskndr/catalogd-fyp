import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  library: defineTable({
    userId: v.id("users"),
    gameId: v.number(),
    gameName: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_game", ["userId", "gameId"]),
  wishlist: defineTable({
    userId: v.id("users"),
    gameId: v.number(),
    gameName: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_game", ["userId", "gameId"]),
  reviews: defineTable({
    userId: v.id("users"),
    gameId: v.number(),
    gameName: v.string(),
    rating: v.number(),
    review: v.string(),
  })
    .index("by_user_game", ["userId", "gameId"])
    .index("by_game_name", ["gameName"]),
  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
  }),
  games: defineTable({
    rawgId: v.number(),
    slug: v.string(),
    name: v.string(),
    released: v.string(),
    backgroundImage: v.string(),
    metacritic: v.number(),
    ratingsCount: v.number(),
    genres: v.array(v.string()),
    platforms: v.array(v.string()),
    developers: v.array(v.string()),
    publishers: v.array(v.string()),
    descriptionRaw: v.string(),
    website: v.string(),
    screenshots: v.array(v.object({ id: v.number(), image: v.string() })),
    tags: v.optional(v.array(v.string())),
    playtime: v.optional(v.number()),
    summaryFetchedAt: v.number(),
    detailFetchedAt: v.number(),
  })
    .index("by_rawgId", ["rawgId"])
    .index("by_slug", ["slug"])
    .searchIndex("search_name", { searchField: "name" }),
  gameVectors: defineTable({
    rawgId: v.number(),
    modality: v.union(v.literal("text"), v.literal("image")),
    embedding: v.array(v.float64()),
    docHash: v.string(),
    templateVersion: v.number(),
    source: v.union(v.literal("corpus"), v.literal("rawg")),
    embeddedAt: v.number(),
  })
    .index("by_rawgId", ["rawgId"])
    .index("by_rawgId_modality", ["rawgId", "modality"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["modality"],
    }),
  aiRecThreads: defineTable({
    userId: v.id("users"),
    threadId: v.string(),
    lastActiveAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"])
    .index("by_lastActiveAt", ["lastActiveAt"]),
  aiRecAttachments: defineTable({
    userId: v.id("users"),
    threadId: v.optional(v.string()),
    storageId: v.id("_storage"),
    filename: v.string(),
    mediaType: v.string(),
    bytes: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"]),
  ragUsage: defineTable({
    userId: v.id("users"),
    threadId: v.string(),
    kind: v.union(v.literal("turn"), v.literal("describe"), v.literal("embed")),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    toolCalls: v.number(),
    durationMs: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_user", ["userId"]),
  warmQueue: defineTable({
    rawgId: v.number(),
    hits: v.number(),
    firstSeen: v.number(),
  })
    .index("by_rawgId", ["rawgId"])
    .index("by_hits", ["hits"]),
  gameLists: defineTable({
    key: v.string(),
    rawgIds: v.array(v.number()),
    count: v.number(),
    fetchedAt: v.number(),
  }).index("by_key", ["key"]),
  genres: defineTable({
    rawgId: v.number(),
    slug: v.string(),
    name: v.string(),
    gamesCount: v.number(),
    imageBackground: v.string(),
  })
    .index("by_rawgId", ["rawgId"])
    .index("by_slug", ["slug"]),
  syncState: defineTable({
    key: v.string(),
    fetchedAt: v.number(),
  }).index("by_key", ["key"]),
  imageAssets: defineTable({
    sourcePath: v.string(),
    storageId: v.optional(v.id("_storage")),
    bytes: v.number(),
    contentType: v.string(),
    claimedAt: v.optional(v.number()),
  }).index("by_source", ["sourcePath"]),
  imageCache: defineTable({
    key: v.string(),
    storageId: v.id("_storage"),
    etag: v.string(),
    upstreamEtag: v.string(),
    extension: v.string(),
    revalidate: v.number(),
    lastModified: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_lastModified", ["lastModified"]),
});
