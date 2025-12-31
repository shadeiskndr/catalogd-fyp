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
  },
};

export default nextConfig;
