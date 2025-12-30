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
    summaryFetchedAt: v.number(),
    detailFetchedAt: v.number(),
  })
    .index("by_rawgId", ["rawgId"])
    .index("by_slug", ["slug"])
    .searchIndex("search_name", { searchField: "name" }),
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
    width: v.number(),
    storageId: v.id("_storage"),
    bytes: v.number(),
    contentType: v.string(),
    lastAccessedAt: v.number(),
  })
    .index("by_source_width", ["sourcePath", "width"])
    .index("by_lastAccessedAt", ["lastAccessedAt"]),
  rawgCache: defineTable({
    endpoint: v.string(),
    body: v.string(),
    fetchedAt: v.number(),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_fetchedAt", ["fetchedAt"]),
});
