/** @type {import('next').NextConfig} */
export default {
  // ————————————————————————————————————————————
  //  ⚡ Edge-ready “app/” router, required in Next 15+
  // ————————————————————————————————————————————
  appDir: true,

  // Export to static `.vercel/output` so Cloudflare Pages
  // can deploy via @cloudflare/next-on-pages.
  output: "export",

  env: {
    NEXT_PUBLIC_PHASE: process.env.NEXT_PUBLIC_PHASE || "demo",
  },
};
