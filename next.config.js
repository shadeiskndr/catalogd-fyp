/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    RAWG_API_KEY: process.env.RAWG_API_KEY,
  },
  images: {
    domains: ["cdn.discordapp.com", "media.rawg.io", "via.placeholder.com"],
  },
}

module.exports = nextConfig
