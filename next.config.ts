/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { appDir: true },
  i18n: { locales: ["en", "de", "it"], defaultLocale: "en" },
  images: { unoptimized: true }, // Cloudflare Pages limitation
  output: "standalone", // required by next-on-pages
};
export default nextConfig;
