// next.config.mjs
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages limitation
  images: { unoptimized: true },

  // Required by Cloudflare’s adapter
  output: "standalone",

  async redirects() {
    return [
      {
        source: "/cms/shop/:shop/pages/new/pagebuilder",
        destination: "/cms/shop/:shop/pages/new/page",
        permanent: false,
      },
      {
        source: "/cms/shop/:shop/pages",
        destination: "/cms/shop/:shop/pages/edit/page",
        permanent: false,
      },
    ];
  },

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
      "module",
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

    // In development, prefer prebuilt dist outputs for heavy workspace packages
    // to reduce per-route transpilation cost. This does not affect production
    // builds and keeps HMR behavior stable.
    if (dev) {
      const aliasDist = {
        "@ui": path.resolve(process.cwd(), "packages/ui/dist"),
        "@acme/ui": path.resolve(process.cwd(), "packages/ui/dist"),
        "@platform-core": path.resolve(process.cwd(), "packages/platform-core/dist"),
        "@acme/platform-core": path.resolve(process.cwd(), "packages/platform-core/dist"),
      };
      Object.assign(config.resolve.alias, aliasDist);
    }

    // Enable Istanbul instrumentation for E2E coverage when COVERAGE=1 (client only)
    if (!isServer && process.env.COVERAGE === '1') {
      config.module ??= {};
      config.module.rules ??= [];
      config.module.rules.push({
        test: /\.(js|jsx|ts|tsx)$/,
        enforce: 'post',
        include: [
          path.resolve(process.cwd(), 'apps'),
          path.resolve(process.cwd(), 'packages'),
          path.resolve(process.cwd(), 'src')
        ],
        exclude: [/node_modules\//, /\.cy\./, /__tests__\//, /\.test\./],
        use: {
          loader: require.resolve('istanbul-instrumenter-loader'),
          options: { esModules: true },
        },
      });
    }

    return config;
  },
};

export default nextConfig;
