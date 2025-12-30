import { httpRouter } from "convex/server";
import {
  type ImageWidth,
  isImageWidth,
  isSafeMediaPath,
  rawgVariantUrl,
} from "@/lib/rawg-image-path";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import type { ImageAssetHit } from "./images";
import { TOUCH_INTERVAL_MS } from "./images";

const IMAGE_PREFIX = "/img/";
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const MAX_PROXY_BYTES = 4_000_000;

const http = httpRouter();

auth.addHttpRoutes(http);

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

async function proxyFromRawg(sourcePath: string, width: ImageWidth): Promise<Response> {
  const upstream = await fetch(rawgVariantUrl(sourcePath, width));
  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.startsWith("image/")) {
    return notFound();
  }
  const blob = await upstream.blob();
  if (blob.size === 0 || blob.size > MAX_PROXY_BYTES) {
    return notFound();
  }
  return new Response(blob, {
    headers: { "Content-Type": contentType, "Cache-Control": IMMUTABLE_CACHE },
  });
}

http.route({
  pathPrefix: IMAGE_PREFIX,
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { pathname } = new URL(request.url);
    const rest = pathname.slice(IMAGE_PREFIX.length);
    const separator = rest.indexOf("/");
    if (separator <= 0) {
      return notFound();
    }

    const width = Number.parseInt(rest.slice(0, separator), 10);
    let sourcePath: string;
    try {
      sourcePath = decodeURIComponent(rest.slice(separator + 1));
    } catch {
      return notFound();
    }
    if (!Number.isInteger(width) || !isImageWidth(width) || !isSafeMediaPath(sourcePath)) {
      return notFound();
    }

    const asset: ImageAssetHit | null = await ctx.runQuery(internal.images.lookup, {
      sourcePath,
      width,
    });
    if (asset === null) {
      return await proxyFromRawg(sourcePath, width);
    }

    const blob = await ctx.storage.get(asset.storageId);
    if (blob === null) {
      return await proxyFromRawg(sourcePath, width);
    }

    if (Date.now() - asset.lastAccessedAt > TOUCH_INTERVAL_MS) {
      await ctx.scheduler.runAfter(0, internal.images.touch, { id: asset.id });
    }

    return new Response(blob, {
      headers: { "Content-Type": asset.contentType, "Cache-Control": IMMUTABLE_CACHE },
    });
  }),
});

export default http;
