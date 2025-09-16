// apps/cms/next.config.mjs
import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

// Provide strong development defaults compatible with tightened validation
const DEV_NEXTAUTH = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION = "dev-session-secret-32-chars-long-string!";
function ensureStrong(name, fallback) {
  const val = process.env[name];
  if (!val || val.length < 32) process.env[name] = fallback;
}
ensureStrong("NEXTAUTH_SECRET", DEV_NEXTAUTH);
ensureStrong("SESSION_SECRET", DEV_SESSION);
// Provide base URL for NextAuth callbacks in dev if missing
process.env.NEXTAUTH_URL ??= "http://localhost:3006";
process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve concrete entry files once so every build target uses the same instance.
const REACT_INDEX = require.resolve("react");
const REACT_DOM_INDEX = require.resolve("react-dom");
const REACT_DOM_CLIENT = require.resolve("react-dom/client");
const REACT_DOM_SERVER = require.resolve("react-dom/server");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },

  // Keep heavy Node-only libs external on the server bundle
  serverExternalPackages: [
    "lighthouse",
    "puppeteer",
    "yargs",
    "resend",
    "@react-email/render",
    "html-to-text",
  ],

  // Transpile workspace packages that ship TS/modern syntax
  transpilePackages: [
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
    "@acme/configurator",
    "@acme/telemetry",
    "@acme/config",
    // NEW: transpile the theme package itself so Next can parse its TS
    "@acme/theme",
  ],

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  webpack: (config, { dev, isServer }) => {
    // Stable hashing (avoid wasm hasher path)
    config.output ||= {};
    config.output.hashFunction = "sha256";

    // In dev, keep it deterministic while we iron out config/build issues
    if (dev) {
      config.cache = false;
    }

    config.resolve ||= {};
    config.resolve.symlinks = false; // pnpm friendliness
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      "drizzle-orm": false,
      "entities/decode": "entities/lib/decode.js",
      "entities/escape": "entities/lib/escape.js",

      // EXACT-MATCH ALIASES — do NOT shadow subpaths like `react/jsx-runtime`
      react$: REACT_INDEX,
      "react-dom$": REACT_DOM_INDEX,

      // Useful concrete entries (do not use `$` here, these are explicit subpaths)
      "react-dom/client": REACT_DOM_CLIENT,
      "react-dom/server": REACT_DOM_SERVER,
    };

    if (config.resolve.alias["oidc-token-hash"] === undefined) {
      try {
        const nextAuthEntry = require.resolve("next-auth");
        const nextAuthRequire = createRequire(nextAuthEntry);
        const resolvedOidcTokenHash = realpathSync(
          nextAuthRequire.resolve("oidc-token-hash"),
        );

        config.resolve.alias["oidc-token-hash"] = resolvedOidcTokenHash;
      } catch {
        // next-auth is optional for some builds; skip aliasing when absent.
      }
    }

    if (!isServer) {
      config.resolve.alias["@sentry/node"] = false;
      config.resolve.alias["@sentry/opentelemetry"] = false;
    }

    const sharedUtilsPinoSymlink = path.resolve(
      __dirname,
      "../../packages/shared-utils/node_modules/pino",
    );

    // Turbopack keeps `resolve.symlinks` disabled for better pnpm support, but
    // that prevents it from following the symlinked copy of `pino` to the
    // virtual store. Manually alias the runtime dependencies so both the Edge
    // and Node bundles can resolve them without needing to mutate pnpm's lock
    // file during development.

    if (existsSync(sharedUtilsPinoSymlink)) {
      const pinoRealDir = realpathSync(sharedUtilsPinoSymlink);
      const pinoDepsRoot = path.dirname(pinoRealDir);
      const pinoRuntimeDeps = [
        "atomic-sleep",
        "fast-redact",
        "on-exit-leak-free",
        "pino-abstract-transport",
        "pino-std-serializers",
        "process-warning",
        "quick-format-unescaped",
        "real-require",
        "safe-stable-stringify",
        "sonic-boom",
        "thread-stream",
      ];

      for (const dep of pinoRuntimeDeps) {
        if (config.resolve.alias[dep] !== undefined) continue;

        const candidate = path.join(pinoDepsRoot, dep);
        if (existsSync(candidate)) {
          config.resolve.alias[dep] = candidate;
        }
      }
    }

    // Map node: built-ins consistently
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
