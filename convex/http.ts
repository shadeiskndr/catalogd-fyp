import { httpRouter } from "convex/server";
import { isSafeMediaPath, rawgMasterUrl } from "@/lib/rawg-image-path";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import type { ImageAssetHit, ImageCacheHit } from "./images";

const IMAGE_PREFIX = "/img/";
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const MAX_PROXY_BYTES = 8_000_000;

const http = httpRouter();

auth.addHttpRoutes(http);

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

function isAuthorized(request: Request): boolean {
  const secret = process.env["IMAGE_CACHE_SECRET"];
  if (secret === undefined || secret.length === 0) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function proxyFromRawg(sourcePath: string): Promise<Response> {
  const upstream = await fetch(rawgMasterUrl(sourcePath));
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
    let sourcePath: string;
    try {
      sourcePath = decodeURIComponent(pathname.slice(IMAGE_PREFIX.length));
    } catch {
      return notFound();
    }
    if (!isSafeMediaPath(sourcePath)) {
      return notFound();
    }

    const asset: ImageAssetHit | null = await ctx.runQuery(internal.images.lookup, { sourcePath });
    if (asset === null) {
      return await proxyFromRawg(sourcePath);
    }

    const blob = await ctx.storage.get(asset.storageId);
    if (blob === null) {
      return await proxyFromRawg(sourcePath);
    }

    return new Response(blob, {
      headers: { "Content-Type": asset.contentType, "Cache-Control": IMMUTABLE_CACHE },
    });
  }),
});

http.route({
  path: "/image-cache",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!isAuthorized(request)) {
      return unauthorized();
    }
    const key = new URL(request.url).searchParams.get("key");
    if (key === null || key.length === 0) {
      return notFound();
    }

    const entry: ImageCacheHit | null = await ctx.runQuery(internal.images.cacheLookup, { key });
    if (entry === null) {
      return notFound();
    }
    const blob = await ctx.storage.get(entry.storageId);
    if (blob === null) {
      return notFound();
    }

    return new Response(blob, {
      headers: {
        "Content-Type": "application/octet-stream",
        "x-image-etag": entry.etag,
        "x-image-upstream-etag": entry.upstreamEtag,
        "x-image-extension": entry.extension,
        "x-image-revalidate": String(entry.revalidate),
        "x-image-last-modified": String(entry.lastModified),
      },
    });
  }),
});

http.route({
  path: "/image-cache",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!isAuthorized(request)) {
      return unauthorized();
    }
    const key = new URL(request.url).searchParams.get("key");
    if (key === null || key.length === 0) {
      return notFound();
    }

    const blob = await request.blob();
    if (blob.size === 0 || blob.size > MAX_PROXY_BYTES) {
      return notFound();
    }
    const revalidate = Number.parseInt(request.headers.get("x-image-revalidate") ?? "", 10);
    const storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.images.cacheRecord, {
      key,
      storageId,
      etag: request.headers.get("x-image-etag") ?? "",
      upstreamEtag: request.headers.get("x-image-upstream-etag") ?? "",
      extension: request.headers.get("x-image-extension") ?? "",
      revalidate: Number.isFinite(revalidate) ? revalidate : 0,
    });
    return new Response(null, { status: 204 });
  }),
});

export default http;
