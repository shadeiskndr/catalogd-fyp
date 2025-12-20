/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: [
      "cdn.discordapp.com",
      "media.rawg.io",
      "via.placeholder.com",
      "img.itch.zone",
    ],
  },
}

module.exports = nextConfig
