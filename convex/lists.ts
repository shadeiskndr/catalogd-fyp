import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const listArg = v.union(v.literal("library"), v.literal("wishlist"));

export const page = query({
  args: { list: listArg, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    return await ctx.db
      .query(args.list)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const status = query({
  args: { list: listArg, gameId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }
    const existing = await ctx.db
      .query(args.list)
      .withIndex("by_user_game", (q) => q.eq("userId", userId).eq("gameId", args.gameId))
      .first();
    return existing !== null;
  },
});

export const add = mutation({
  args: { list: listArg, gameId: v.number(), gameName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const existing = await ctx.db
      .query(args.list)
      .withIndex("by_user_game", (q) => q.eq("userId", userId).eq("gameId", args.gameId))
      .first();
    if (existing !== null) {
      return;
    }
    await ctx.db.insert(args.list, {
      userId,
      gameId: args.gameId,
      gameName: args.gameName,
    });
  },
});

export const remove = mutation({
  args: { list: listArg, gameId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    if (args.list === "library") {
      const existing = await ctx.db
        .query("library")
        .withIndex("by_user_game", (q) => q.eq("userId", userId).eq("gameId", args.gameId))
        .first();
      if (existing !== null) {
        await ctx.db.delete("library", existing._id);
      }
      return;
    }
    const existing = await ctx.db
      .query("wishlist")
      .withIndex("by_user_game", (q) => q.eq("userId", userId).eq("gameId", args.gameId))
      .first();
    if (existing !== null) {
      await ctx.db.delete("wishlist", existing._id);
    }
  },
});
