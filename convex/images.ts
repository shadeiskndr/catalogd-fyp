import { v } from "convex/values";
import {
  type ImageWidth,
  isImageWidth,
  isSafeMediaPath,
  rawgVariantUrl,
} from "@/lib/rawg-image-path";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const MAX_IMAGE_BYTES = 4_000_000;
const ASSET_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EVICT_BATCH_SIZE = 200;
const WARM_CONCURRENCY = 4;
const MAX_WARM_TARGETS = 200;

export const TOUCH_INTERVAL_MS = 12 * 60 * 60 * 1000;

export type ImageAssetHit = {
  id: Id<"imageAssets">;
  storageId: Id<"_storage">;
  contentType: string;
  lastAccessedAt: number;
};

export const lookup = internalQuery({
  args: { sourcePath: v.string(), width: v.number() },
  handler: async (ctx, args): Promise<ImageAssetHit | null> => {
    const asset = await ctx.db
      .query("imageAssets")
      .withIndex("by_source_width", (q) =>
        q.eq("sourcePath", args.sourcePath).eq("width", args.width)
      )
      .first();
    if (asset === null) {
      return null;
    }
    return {
      id: asset._id,
      storageId: asset.storageId,
      contentType: asset.contentType,
      lastAccessedAt: asset.lastAccessedAt,
    };
  },
});

export const touch = internalMutation({
  args: { id: v.id("imageAssets") },
  handler: async (ctx, args): Promise<void> => {
    const asset = await ctx.db.get("imageAssets", args.id);
    if (asset === null) {
      return;
    }
    await ctx.db.patch("imageAssets", args.id, { lastAccessedAt: Date.now() });
  },
});

export const record = internalMutation({
  args: {
    sourcePath: v.string(),
    width: v.number(),
    storageId: v.id("_storage"),
    bytes: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("imageAssets")
      .withIndex("by_source_width", (q) =>
        q.eq("sourcePath", args.sourcePath).eq("width", args.width)
      )
      .first();
    if (existing !== null) {
      await ctx.storage.delete(args.storageId);
      return;
    }
    await ctx.db.insert("imageAssets", {
      sourcePath: args.sourcePath,
      width: args.width,
      storageId: args.storageId,
      bytes: args.bytes,
      contentType: args.contentType,
      lastAccessedAt: Date.now(),
    });
  },
});

async function storeVariant(
  ctx: ActionCtx,
  sourcePath: string,
  width: ImageWidth
): Promise<boolean> {
  const existing = await ctx.runQuery(internal.images.lookup, { sourcePath, width });
  if (existing !== null) {
    return false;
  }
  const response = await fetch(rawgVariantUrl(sourcePath, width));
  if (!response.ok) {
    return false;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return false;
  }
  const blob = await response.blob();
  if (blob.size === 0 || blob.size > MAX_IMAGE_BYTES) {
    return false;
  }
  const storageId = await ctx.storage.store(blob);
  await ctx.runMutation(internal.images.record, {
    sourcePath,
    width,
    storageId,
    bytes: blob.size,
    contentType,
  });
  return true;
}

export const warm = internalAction({
  args: { sourcePaths: v.array(v.string()), widths: v.array(v.number()) },
  handler: async (ctx, args): Promise<number> => {
    const seenWidths = new Set<number>();
    const widths: ImageWidth[] = [];
    for (const width of args.widths) {
      if (isImageWidth(width) && !seenWidths.has(width)) {
        seenWidths.add(width);
        widths.push(width);
      }
    }
    const targets: { sourcePath: string; width: ImageWidth }[] = [];
    for (const sourcePath of args.sourcePaths) {
      if (!isSafeMediaPath(sourcePath)) {
        continue;
      }
      for (const width of widths) {
        targets.push({ sourcePath, width });
      }
    }

    let stored = 0;
    const capped = targets.slice(0, MAX_WARM_TARGETS);
    for (let index = 0; index < capped.length; index += WARM_CONCURRENCY) {
      const batch = capped.slice(index, index + WARM_CONCURRENCY);
      const results = await Promise.all(
        batch.map((target) => storeVariant(ctx, target.sourcePath, target.width).catch(() => false))
      );
      stored += results.filter((wasStored) => wasStored).length;
    }
    return stored;
  },
});

export const evict = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const cutoff = Date.now() - ASSET_TTL_MS;
    const cold = await ctx.db
      .query("imageAssets")
      .withIndex("by_lastAccessedAt", (q) => q.lt("lastAccessedAt", cutoff))
      .take(EVICT_BATCH_SIZE);
    await Promise.all(cold.map((asset) => ctx.storage.delete(asset.storageId)));
    await Promise.all(cold.map((asset) => ctx.db.delete("imageAssets", asset._id)));
    return cold.length;
  },
});
