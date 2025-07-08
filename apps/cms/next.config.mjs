// apps/cms/next.config.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------------------------------
// 1. Determine the first shop slug (same logic you already had)
// ----------------------------------------------------------------------------
const shopsDir = path.resolve(__dirname, "../..", "data", "shops");
let firstShop = "abc";
try {
  const entries = fs.readdirSync(shopsDir, { withFileTypes: true });
  const shopDir = entries.find((e) => e.isDirectory());
  if (shopDir) firstShop = shopDir.name;
} catch {
  /* ignore – directory may not exist on fresh clone */
}

// ----------------------------------------------------------------------------
// 2. Next.js configuration
// ----------------------------------------------------------------------------
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 👉  Tell Next 15 to bundle local workspace packages for the client.
  //     Add every package that contains `"use client"` components
  //     or other code that must run in the browser.
  transpilePackages: [
    "@acme/ui",
    "@acme/platform-core",
    "@acme/i18n",
    "@acme/template-app",
  ],
  // (Optional) If you prefer the global switch instead, comment out the line
  // above and uncomment the one below.  Either approach fixes the issue.
  // bundlePagesRouterDependencies: true,

  // Keep your existing “static export in CI only” logic
  ...(process.env.OUTPUT_EXPORT === "1" ? { output: "export" } : {}),

  env: {
    NEXT_PUBLIC_PHASE: process.env.NEXT_PUBLIC_PHASE || "demo",
    NEXT_PUBLIC_DEFAULT_SHOP: process.env.NEXT_PUBLIC_DEFAULT_SHOP || firstShop,
  },
};

export default nextConfig;
