import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

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
  // Server-side cache of RAWG API responses, keyed by endpoint string.
  // Bodies are stored as JSON strings since RAWG shapes are arbitrary.
  rawgCache: defineTable({
    endpoint: v.string(),
    body: v.string(),
    fetchedAt: v.number(),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_fetchedAt", ["fetchedAt"]),
})
