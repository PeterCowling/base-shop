// apps/cms/next.config.mjs
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

process.env.NEXTAUTH_SECRET ??= "dev-nextauth-secret";
process.env.SESSION_SECRET ??= "dev-session-secret";
process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

// Resolve exact file paths for React runtime entries so Webpack never
// mis-resolves under pnpm's symlinked layout.
const reactPkgDir = path.dirname(
  require.resolve("react/package.json", { paths: [__dirname] })
);
const reactDomPkgDir = path.dirname(
  require.resolve("react-dom/package.json", { paths: [__dirname] })
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },

  // Keep heavy/Node-only libs external on the server.
  serverExternalPackages: [
    "lighthouse",
    "puppeteer",
    "yargs",
    "resend",
    "@react-email/render",
    "html-to-text",
  ],

  // Transpile workspace packages that ship TS / modern syntax.
  transpilePackages: [
    "@themes/abc",
    "@themes/base",
    "@themes/bcd",
    "@themes/brandx",
    "@themes/dark",
    "@acme/platform-core",
    "@acme/ui",
    "@acme/date-utils",
    "@acme/lib",
    "@acme/shared-utils",
    "@acme/types",
    "@acme/tailwind-config",
    "@acme/design-tokens",
  ],

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  webpack: (config, { dev, isServer }) => {
    // Use Node's crypto hasher (avoid wasm path).
    config.output = config.output || {};
    config.output.hashFunction = "sha256";

    // Avoid stale pack cache in dev.
    if (dev) {
      config.cache = false;
      config.infrastructureLogging = { level: "log" };
    }

    // Make sure both repo and app node_modules are searched.
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.join(__dirname, "node_modules"),
      path.join(workspaceRoot, "node_modules"),
      "node_modules",
    ];

    // Aliases (keep existing, then hard‑dedupe React to the exact files).
    config.resolve.alias ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      "drizzle-orm": false,

      // ---- React & JSX runtime: resolve to real files to avoid subpath/exports pitfalls
      react: path.join(reactPkgDir, "index.js"),
      "react/jsx-runtime": path.join(reactPkgDir, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(reactPkgDir, "jsx-dev-runtime.js"),
      "react-dom": path.join(reactDomPkgDir, "index.js"),
      "react-dom/client": path.join(reactDomPkgDir, "client.js"),
      "react-dom/server": path.join(reactDomPkgDir, "server.js"),
    };

    if (!isServer) {
      config.resolve.alias["@sentry/node"] = false;
      config.resolve.alias["@sentry/opentelemetry"] = false;
    }

    // Map node: built-ins
    for (const mod of [
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
    ]) {
      config.resolve.alias[`node:${mod}`] = mod;
    }

    return config;
  },
};

export default nextConfig;
