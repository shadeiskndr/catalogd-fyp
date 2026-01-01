import path from "node:path";
import type { NextConfig } from "next";

type RemotePatterns = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

const convexSiteUrl = process.env["NEXT_PUBLIC_CONVEX_SITE_URL"];

const remotePatterns: RemotePatterns = [
  { protocol: "https", hostname: "media.rawg.io", pathname: "/media/**" },
  { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/**" },
  { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
  { protocol: "https", hostname: "img.itch.zone", pathname: "/**" },
];

if (convexSiteUrl !== undefined && convexSiteUrl.length > 0) {
  const { protocol, hostname, port } = new URL(convexSiteUrl);
  remotePatterns.push({
    protocol: protocol === "http:" ? "http" : "https",
    hostname,
    ...(port === "" ? {} : { port }),
    pathname: "/img/**",
  });
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    useTypeScriptCli: true,
  },
  cacheHandler: path.join(import.meta.dirname, "cache-handler.mjs"),
  images: {
    remotePatterns,
    customCacheHandler: true,
    // AVIF is worth its slower encode now that `cache-handler.mjs` keeps optimizer
    // output in Convex: the cost is paid once per (image, width) for the life of the
    // deployment instead of on every deploy.
    formats: ["image/avif", "image/webp"],
    // Trimmed from Next's defaults. `getWidths` builds the srcset from
    // [...deviceSizes, ...imageSizes] filtered by `deviceSizes[0] * smallestRatio`,
    // so the default lists gave a 25vw card grid 10 candidate widths and the 112px
    // write-review thumbnail all 17. Every candidate is a separate RAWG-master pull
    // and a separate Convex row on a cold cache.
    //
    // Nothing above 1920 is listed on purpose: `images.ts` stores a single 1920
    // master, and sharp upscales rather than caps, so 2048/3840 entries were larger
    // files carrying no extra detail. `imageSizes` keeps 128/256 only to cover the
    // 112px thumbnail at 1x/2x.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [128, 256],
  },
};

export default nextConfig;
