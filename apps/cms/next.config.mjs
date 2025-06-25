// apps/cms/next.config.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shopsDir = path.resolve(__dirname, "../..", "data", "shops");
let firstShop = "abc";
try {
  const entries = fs.readdirSync(shopsDir, { withFileTypes: true });
  const shopDir = entries.find((e) => e.isDirectory());
  if (shopDir) firstShop = shopDir.name;
} catch {
  // ignore
}

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
    NEXT_PUBLIC_DEFAULT_SHOP: process.env.NEXT_PUBLIC_DEFAULT_SHOP || firstShop,
  },
};

export default nextConfig;
