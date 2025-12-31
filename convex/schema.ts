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
    storageId: v.id("_storage"),
    bytes: v.number(),
    contentType: v.string(),
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
