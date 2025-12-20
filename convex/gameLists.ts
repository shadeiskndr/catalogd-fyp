import { getAuthUserId } from "@convex-dev/auth/server"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Library and wishlist share the same document shape, so one module
// serves both tables, selected via the `list` argument.
const listArg = v.union(v.literal("library"), v.literal("wishlist"))

export const page = query({
  args: { list: listArg, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return { page: [], isDone: true, continueCursor: "" }
    }
    return await ctx.db
      .query(args.list)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

export const status = query({
  args: { list: listArg, gameId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return false
    }
    const existing = await ctx.db
      .query(args.list)
      .withIndex("by_user_game", (q) =>
        q.eq("userId", userId).eq("gameId", args.gameId),
      )
      .first()
    return existing !== null
  },
})

export const add = mutation({
  args: { list: listArg, gameId: v.number(), gameName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new ConvexError("Not authenticated")
    }
    const existing = await ctx.db
      .query(args.list)
      .withIndex("by_user_game", (q) =>
        q.eq("userId", userId).eq("gameId", args.gameId),
      )
      .first()
    if (existing !== null) {
      return
    }
    await ctx.db.insert(args.list, {
      userId,
      gameId: args.gameId,
      gameName: args.gameName,
    })
  },
})

export const remove = mutation({
  args: { list: listArg, gameId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new ConvexError("Not authenticated")
    }
    const existing = await ctx.db
      .query(args.list)
      .withIndex("by_user_game", (q) =>
        q.eq("userId", userId).eq("gameId", args.gameId),
      )
      .first()
    if (existing !== null) {
      await ctx.db.delete(existing._id)
    }
  },
})
