import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";

const RAWG_API_URL = "https://api.rawg.io/api/";

const CONSOLE_PLATFORMS = "1,7,18,187,186,16,17,14";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHED_BODY_BYTES = 900_000;

export const getCached = internalQuery({
  args: { endpoint: v.string() },
  handler: async (ctx, args): Promise<{ body: string; fetchedAt: number } | null> => {
    const entry = await ctx.db
      .query("rawgCache")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (entry === null) {
      return null;
    }
    return { body: entry.body, fetchedAt: entry.fetchedAt };
  },
});

export const putCache = internalMutation({
  args: { endpoint: v.string(), body: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const entry = {
      endpoint: args.endpoint,
      body: args.body,
      fetchedAt: Date.now(),
    };
    const existing = await ctx.db
      .query("rawgCache")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing !== null) {
      await ctx.db.replace("rawgCache", existing._id, entry);
    } else {
      await ctx.db.insert("rawgCache", entry);
    }
  },
});

export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - CACHE_TTL_MS;
    const expired = await ctx.db
      .query("rawgCache")
      .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", cutoff))
      .take(1000);
    await Promise.all(expired.map((entry) => ctx.db.delete("rawgCache", entry._id)));
    return expired.length;
  },
});

export const get = action({
  args: { endpoint: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    const apiKey = process.env["RAWG_API_KEY"];
    if (!apiKey) {
      throw new Error("RAWG_API_KEY is not set on the Convex deployment");
    }

    const isGameEndpoint = args.endpoint.includes("games");
    const separator = args.endpoint.includes("?") ? "&" : "?";
    const platformFilter = isGameEndpoint ? `&platforms=${CONSOLE_PLATFORMS}` : "";
    const url = new URL(`${args.endpoint}${separator}key=${apiKey}${platformFilter}`, RAWG_API_URL);
    if (url.origin !== "https://api.rawg.io" || !url.pathname.startsWith("/api/")) {
      throw new Error("Invalid RAWG endpoint");
    }

    const cached = await ctx.runQuery(internal.rawg.getCached, {
      endpoint: args.endpoint,
    });
    if (cached !== null && Date.now() - cached.fetchedAt <= CACHE_TTL_MS) {
      return JSON.parse(cached.body);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`RAWG API Error: ${response.statusText}`);
    }
    const data = await response.json();

    const body = JSON.stringify(data);
    if (body.length <= MAX_CACHED_BODY_BYTES) {
      await ctx.runMutation(internal.rawg.putCache, {
        endpoint: args.endpoint,
        body,
      });
    }
    return data;
  },
});
