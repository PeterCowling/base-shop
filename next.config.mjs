// next.config.mjs
/** @type {import('next').NextConfig} */
export default {
  images: { unoptimized: true }, // Cloudflare Pages limitation
  output: "standalone",
};
