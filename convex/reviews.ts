import { getAuthUserId } from "@convex-dev/auth/server"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import type { QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"

async function withUserNames(ctx: QueryCtx, reviews: Doc<"reviews">[]) {
  const names = new Map<Id<"users">, string>()
  for (const review of reviews) {
    if (!names.has(review.userId)) {
      const user = await ctx.db.get(review.userId)
      names.set(review.userId, user?.name ?? "Unknown")
    }
  }
  return reviews.map((review) => ({
    userId: review.userId,
    userName: names.get(review.userId) ?? "Unknown",
    gameId: review.gameId,
    gameName: review.gameName,
    rating: review.rating,
    review: review.review,
    createdAt: review._creationTime,
  }))
}

export const list = query({
  args: {
    gameName: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const gameName = args.gameName
    const results =
      gameName !== undefined
        ? await ctx.db
            .query("reviews")
            .withIndex("by_game_name", (q) => q.eq("gameName", gameName))
            .order("desc")
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("reviews")
            .order("desc")
            .paginate(args.paginationOpts)
    return { ...results, page: await withUserNames(ctx, results.page) }
  },
})

export const create = mutation({
  args: {
    gameId: v.number(),
    gameName: v.string(),
    rating: v.number(),
    review: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new ConvexError("Not authenticated")
    }
    if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 10) {
      throw new ConvexError("Rating must be between 1 and 10.")
    }
    if (args.review.trim().length === 0) {
      throw new ConvexError("Review cannot be empty.")
    }
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user_game", (q) =>
        q.eq("userId", userId).eq("gameId", args.gameId),
      )
      .first()
    if (existing !== null) {
      throw new ConvexError("You have already written a review for this game.")
    }
    await ctx.db.insert("reviews", {
      userId,
      gameId: args.gameId,
      gameName: args.gameName,
      rating: args.rating,
      review: args.review.trim(),
    })
  },
})
