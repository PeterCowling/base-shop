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

    // Map Node.js builtin modules imported with the `node:` scheme to their
    // standard specifiers so that Webpack can resolve them correctly. Without
    // this aliases, imports like `import { Readable } from "node:stream"` or
    // `import crypto from "node:crypto"` trigger `UnhandledSchemeError` during
    // the build.
    const nodeBuiltins = [
      "assert",
      "buffer",
      "child_process",
      "crypto",
      "fs",
      "http",
      "https",
      "path",
      "stream",
      "string_decoder",
      "timers",
      "url",
      "util",
      "vm",
      "zlib",
    ];

    config.resolve ??= {};
    config.resolve.alias ??= {};
    for (const mod of nodeBuiltins) {
      config.resolve.alias[`node:${mod}`] = mod;
    }

    return config;
  },
};

export default nextConfig;
