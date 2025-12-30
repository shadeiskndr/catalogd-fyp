import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { CatalogGame } from "@/lib/game-types";
import { mutation, query } from "./_generated/server";
import { toCatalogGame } from "./catalog";
import { ensureGameIngested } from "./ingest";

const listArg = v.union(v.literal("library"), v.literal("wishlist"));

export type ListEntry = {
  gameId: number;
  gameName: string;
  game: CatalogGame | null;
};

export const page = query({
  args: { list: listArg, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { page: [] as ListEntry[], isDone: true, continueCursor: "" };
    }
    const results = await ctx.db
      .query(args.list)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const docs = await Promise.all(
      results.page.map((entry) =>
        ctx.db
          .query("games")
          .withIndex("by_rawgId", (q) => q.eq("rawgId", entry.gameId))
          .first()
      )
    );

    const page: ListEntry[] = results.page.map((entry, index) => {
      const doc = docs[index] ?? null;
      return {
        gameId: entry.gameId,
        gameName: entry.gameName,
        game: doc === null ? null : toCatalogGame(doc),
      };
    });

    return { ...results, page };
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
    await ensureGameIngested(ctx, args.gameId);
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
