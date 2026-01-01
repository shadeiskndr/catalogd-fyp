import { v } from "convex/values";
import { isSafeMediaPath, rawgMasterUrl } from "@/lib/rawg-image-path";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const MAX_IMAGE_BYTES = 8_000_000;
const WARM_CONCURRENCY = 4;
const MAX_WARM_TARGETS = 200;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_EVICT_BATCH_SIZE = 200;
const STORAGE_RESET_BATCH_SIZE = 500;
const CLAIM_TTL_MS = 5 * 60 * 1000;

export type ImageAssetHit = {
  storageId: Id<"_storage">;
  contentType: string;
};

export type ImageCacheHit = {
  storageId: Id<"_storage">;
  etag: string;
  upstreamEtag: string;
  extension: string;
  revalidate: number;
  lastModified: number;
};

export const lookup = internalQuery({
  args: { sourcePath: v.string() },
  handler: async (ctx, args): Promise<ImageAssetHit | null> => {
    const asset = await ctx.db
      .query("imageAssets")
      .withIndex("by_source", (q) => q.eq("sourcePath", args.sourcePath))
      .first();
    if (asset === null || asset.storageId === undefined) {
      return null;
    }
    return { storageId: asset.storageId, contentType: asset.contentType };
  },
});

export const claim = internalMutation({
  args: { sourcePath: v.string() },
  handler: async (ctx, args): Promise<number | null> => {
    const existing = await ctx.db
      .query("imageAssets")
      .withIndex("by_source", (q) => q.eq("sourcePath", args.sourcePath))
      .first();
    const now = Date.now();
    if (existing === null) {
      await ctx.db.insert("imageAssets", {
        sourcePath: args.sourcePath,
        bytes: 0,
        contentType: "",
        claimedAt: now,
      });
      return now;
    }
    if (existing.storageId !== undefined) {
      return null;
    }
    if (now - (existing.claimedAt ?? 0) < CLAIM_TTL_MS) {
      return null;
    }
    await ctx.db.patch("imageAssets", existing._id, { claimedAt: now });
    return now;
  },
});

export const fill = internalMutation({
  args: {
    sourcePath: v.string(),
    claimedAt: v.number(),
    storageId: v.id("_storage"),
    bytes: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("imageAssets")
      .withIndex("by_source", (q) => q.eq("sourcePath", args.sourcePath))
      .first();
    if (existing === null) {
      await ctx.db.insert("imageAssets", {
        sourcePath: args.sourcePath,
        storageId: args.storageId,
        bytes: args.bytes,
        contentType: args.contentType,
      });
      return;
    }
    if (existing.storageId !== undefined || existing.claimedAt !== args.claimedAt) {
      await ctx.storage.delete(args.storageId);
      return;
    }
    await ctx.db.patch("imageAssets", existing._id, {
      storageId: args.storageId,
      bytes: args.bytes,
      contentType: args.contentType,
    });
  },
});

export const release = internalMutation({
  args: { sourcePath: v.string(), claimedAt: v.number() },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("imageAssets")
      .withIndex("by_source", (q) => q.eq("sourcePath", args.sourcePath))
      .first();
    if (
      existing !== null &&
      existing.storageId === undefined &&
      existing.claimedAt === args.claimedAt
    ) {
      await ctx.db.delete("imageAssets", existing._id);
    }
  },
});

async function storeMaster(ctx: ActionCtx, sourcePath: string): Promise<boolean> {
  const claimedAt = await ctx.runMutation(internal.images.claim, { sourcePath });
  if (claimedAt === null) {
    return false;
  }
  try {
    const response = await fetch(rawgMasterUrl(sourcePath));
    if (!response.ok) {
      await ctx.runMutation(internal.images.release, { sourcePath, claimedAt });
      return false;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      await ctx.runMutation(internal.images.release, { sourcePath, claimedAt });
      return false;
    }
    const blob = await response.blob();
    if (blob.size === 0 || blob.size > MAX_IMAGE_BYTES) {
      await ctx.runMutation(internal.images.release, { sourcePath, claimedAt });
      return false;
    }
    const storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.images.fill, {
      sourcePath,
      claimedAt,
      storageId,
      bytes: blob.size,
      contentType,
    });
    return true;
  } catch (error) {
    await ctx.runMutation(internal.images.release, { sourcePath, claimedAt });
    throw error;
  }
}

export const warm = internalAction({
  args: { sourcePaths: v.array(v.string()) },
  handler: async (ctx, args): Promise<number> => {
    const seen = new Set<string>();
    const targets: string[] = [];
    for (const sourcePath of args.sourcePaths) {
      if (isSafeMediaPath(sourcePath) && !seen.has(sourcePath)) {
        seen.add(sourcePath);
        targets.push(sourcePath);
      }
    }

    let stored = 0;
    const capped = targets.slice(0, MAX_WARM_TARGETS);
    for (let index = 0; index < capped.length; index += WARM_CONCURRENCY) {
      const batch = capped.slice(index, index + WARM_CONCURRENCY);
      const results = await Promise.all(
        batch.map((sourcePath) => storeMaster(ctx, sourcePath).catch(() => false))
      );
      stored += results.filter((wasStored) => wasStored).length;
    }
    return stored;
  },
});

export const cacheLookup = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<ImageCacheHit | null> => {
    const entry = await ctx.db
      .query("imageCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (entry === null) {
      return null;
    }
    return {
      storageId: entry.storageId,
      etag: entry.etag,
      upstreamEtag: entry.upstreamEtag,
      extension: entry.extension,
      revalidate: entry.revalidate,
      lastModified: entry.lastModified,
    };
  },
});

export const cacheRecord = internalMutation({
  args: {
    key: v.string(),
    storageId: v.id("_storage"),
    etag: v.string(),
    upstreamEtag: v.string(),
    extension: v.string(),
    revalidate: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("imageCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing !== null) {
      await ctx.storage.delete(existing.storageId);
      await ctx.db.delete("imageCache", existing._id);
    }
    await ctx.db.insert("imageCache", {
      key: args.key,
      storageId: args.storageId,
      etag: args.etag,
      upstreamEtag: args.upstreamEtag,
      extension: args.extension,
      revalidate: args.revalidate,
      lastModified: Date.now(),
    });
  },
});

export const cacheForget = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
    const entry = await ctx.db
      .query("imageCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (entry === null) {
      return false;
    }
    await ctx.storage.delete(entry.storageId);
    await ctx.db.delete("imageCache", entry._id);
    return true;
  },
});

export const cacheEvict = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const cutoff = Date.now() - CACHE_TTL_MS;
    const cold = await ctx.db
      .query("imageCache")
      .withIndex("by_lastModified", (q) => q.lt("lastModified", cutoff))
      .take(CACHE_EVICT_BATCH_SIZE);
    await Promise.all(cold.map((entry) => ctx.storage.delete(entry.storageId)));
    await Promise.all(cold.map((entry) => ctx.db.delete("imageCache", entry._id)));
    return cold.length;
  },
});

export const cacheClear = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const batch = await ctx.db.query("imageCache").take(CACHE_EVICT_BATCH_SIZE);
    await Promise.all(batch.map((entry) => ctx.storage.delete(entry.storageId)));
    await Promise.all(batch.map((entry) => ctx.db.delete("imageCache", entry._id)));
    return batch.length;
  },
});

export const resetStorage = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const [asset, cached] = await Promise.all([
      ctx.db.query("imageAssets").first(),
      ctx.db.query("imageCache").first(),
    ]);
    if (asset !== null || cached !== null) {
      throw new Error("resetStorage only runs while imageAssets and imageCache are empty");
    }
    const files = await ctx.db.system.query("_storage").take(STORAGE_RESET_BATCH_SIZE);
    await Promise.all(files.map((file) => ctx.storage.delete(file._id)));
    return files.length;
  },
});
