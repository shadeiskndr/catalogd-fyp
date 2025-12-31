import fsCacheModule from "next/dist/server/lib/incremental-cache/file-system-cache.js";
import fsMethodsModule from "next/dist/server/lib/node-fs-methods.js";

const FileSystemCache = fsCacheModule.default ?? fsCacheModule;
const nodeFs = fsMethodsModule.nodeFs ?? fsMethodsModule.default?.nodeFs;

const IMAGE_KIND = "IMAGE";
const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const secret = process.env.IMAGE_CACHE_SECRET;
const enabled = Boolean(siteUrl && secret);

function cacheUrl(key) {
  return `${siteUrl.replace(/\/$/, "")}/image-cache?key=${encodeURIComponent(key)}`;
}

let warned = false;

function warnDisabled() {
  if (warned) {
    return;
  }
  warned = true;
  console.warn(
    "[cache-handler] NEXT_PUBLIC_CONVEX_SITE_URL or IMAGE_CACHE_SECRET is missing at runtime. Optimized images will not be cached anywhere and every request re-encodes from the master."
  );
}

function authHeaders(extra) {
  return { authorization: `Bearer ${secret}`, ...extra };
}

export default class ConvexImageCacheHandler {
  constructor(ctx) {
    this.fallback = new FileSystemCache({ ...ctx, fs: nodeFs });
  }

  resetRequestCache() {
    this.fallback.resetRequestCache?.();
  }

  revalidateTag(tags, durations) {
    return this.fallback.revalidateTag(tags, durations);
  }

  async get(key, ctx) {
    if (ctx?.kind !== IMAGE_KIND) {
      return this.fallback.get(key, ctx);
    }
    if (!enabled) {
      warnDisabled();
      return null;
    }
    try {
      const response = await fetch(cacheUrl(key), { headers: authHeaders() });
      if (!response.ok) {
        return null;
      }
      const revalidate = Number(response.headers.get("x-image-revalidate"));
      const lastModified = Number(response.headers.get("x-image-last-modified"));
      return {
        value: {
          kind: IMAGE_KIND,
          buffer: Buffer.from(await response.arrayBuffer()),
          etag: response.headers.get("x-image-etag") ?? "",
          upstreamEtag: response.headers.get("x-image-upstream-etag") ?? "",
          extension: response.headers.get("x-image-extension") ?? "",
          revalidate: Number.isFinite(revalidate) ? revalidate : undefined,
        },
        lastModified: Number.isFinite(lastModified) ? lastModified : Date.now(),
      };
    } catch {
      return null;
    }
  }

  async set(key, value, ctx) {
    if (value?.kind !== IMAGE_KIND) {
      return this.fallback.set(key, value, ctx);
    }
    if (!enabled) {
      warnDisabled();
      return;
    }
    try {
      await fetch(cacheUrl(key), {
        method: "POST",
        headers: authHeaders({
          "content-type": "application/octet-stream",
          "x-image-etag": value.etag ?? "",
          "x-image-upstream-etag": value.upstreamEtag ?? "",
          "x-image-extension": value.extension ?? "",
          "x-image-revalidate": String(value.revalidate ?? 0),
        }),
        body: value.buffer,
      });
    } catch {}
  }
}
