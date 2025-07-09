// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages limitation
  images: { unoptimized: true },

  // Required by Cloudflare’s adapter
  output: "standalone",

  /**
   * Enable server‑side source‑maps **only when we’re not in dev**
   * to avoid Next.js’ “Improper devtool” warning. :contentReference[oaicite:1]{index=1}
   */
  webpack(config, { isServer, dev }) {
    if (isServer && !dev) {
      config.devtool = "source-map";
    }
    return config;
  },
};

export default nextConfig;
