// apps/cms/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ————————————————————————————————————————————
  //  Enable static export only in CI / prod
  //    • CI sets  OUTPUT_EXPORT=1   → next export
  //    • Local dev leaves it unset  → full Next.js server
  // ————————————————————————————————————————————
  ...(process.env.OUTPUT_EXPORT === "1" ? { output: "export" } : {}),

  env: {
    NEXT_PUBLIC_PHASE: process.env.NEXT_PUBLIC_PHASE || "demo",
  },
};

export default nextConfig;
