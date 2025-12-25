import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    useTypeScriptCli: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io", pathname: "/media/**" },
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "img.itch.zone", pathname: "/**" },
      {
        protocol: "https",
        hostname: "convex-catalogd.shahathir.me",
        pathname: "/api/storage/**",
      },
    ],
  },
};

export default nextConfig;
