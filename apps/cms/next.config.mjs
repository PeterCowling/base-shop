// apps/cms/next.config.mjs
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

let hashGuardApplied = false;
function ensureSafeWebpackHash(webpack) {
  if (hashGuardApplied) return;
  const util = webpack?.util;
  if (!util?.createHash) return;

  const guardPrototypeChain = (hash) => {
    if (!hash || typeof hash !== "object") return;
    let proto = hash;
    const seen = new Set();
    while (proto && proto !== Object.prototype) {
      if (seen.has(proto)) break;
      seen.add(proto);
      const desc = Object.getOwnPropertyDescriptor(proto, "update");
      if (desc?.value && typeof desc.value === "function" && !desc.value.__safeGuarded) {
        const originalUpdate = desc.value;
        const wrapped = function safeUpdate(data, encoding) {
          if (data === undefined) return this;
          return originalUpdate.call(this, data, encoding);
        };
        wrapped.__safeGuarded = true;
        Object.defineProperty(proto, "update", { ...desc, value: wrapped });
      }
      proto = Object.getPrototypeOf(proto);
    }
  };

  try {
    guardPrototypeChain(util.createHash("xxhash64"));
  } catch {
    /* ignore */
  }
  try {
    guardPrototypeChain(util.createHash("sha256"));
  } catch {
    /* ignore */
  }

  hashGuardApplied = true;
}

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
// Sanity: provide safe dev defaults so validation never trips in dev/edge
process.env.SANITY_API_VERSION ??= "2021-10-21";
process.env.SANITY_PROJECT_ID ??= "dummy-project-id";
process.env.SANITY_DATASET ??= "production";
process.env.SANITY_API_TOKEN ??= "dummy-api-token";
process.env.SANITY_PREVIEW_SECRET ??= "dummy-preview-secret";
// Email: default to noop provider during local builds so env validation passes
process.env.EMAIL_PROVIDER ??= "noop";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PNPM_VIRTUAL_STORE = path.resolve(__dirname, "../../node_modules/.pnpm");

const resolveFromPnpmStore = (pkg, subpath) => {
  if (!existsSync(PNPM_VIRTUAL_STORE)) return null;
  let entries = [];
  try {
    entries = readdirSync(PNPM_VIRTUAL_STORE, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith(`${pkg}@`)) continue;

    const candidate = path.join(
      PNPM_VIRTUAL_STORE,
      entry.name,
      "node_modules",
      pkg,
      subpath,
    );

    if (existsSync(candidate)) return candidate;
  }

  return null;
};

const ENTITIES_DECODE_PATH =
  resolveFromPnpmStore("entities", "dist/commonjs/decode.js") ?? "entities/lib/decode.js";
const ENTITIES_ESCAPE_PATH =
  resolveFromPnpmStore("entities", "dist/commonjs/escape.js") ?? "entities/lib/escape.js";

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
  // Ensure UI calls to `/cms/api/*` hit route handlers under `/api/*`
  async rewrites() {
    return [
      {
        source: "/cms/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
  eslint: {
    // Speed up CI and avoid blocking builds on lint-only rules
    ignoreDuringBuilds: true,
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

  webpack: (config, { dev, isServer, webpack }) => {
    ensureSafeWebpackHash(webpack);
    config.output ||= {};
    // Webpack feeds `undefined` segments into the chunk hasher in dev; fall back
    // to its tolerant default so compilation doesn't explode with crypto errors.
    config.output.hashFunction = "xxhash64";

    if (dev) {
      // Re-enable persistent caching so navigation between steps isn't throttled by
      // 60s recompiles on every edit. The hash guard above keeps the cache stable.
      const cacheDir = path.join(__dirname, ".next", "cache", "webpack");
      config.cache = {
        type: "filesystem",
        cacheDirectory: cacheDir,
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    config.resolve ||= {};
    // Allow webpack to follow pnpm's symlinks so nested dependencies resolve correctly.
    config.resolve.symlinks = true;
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      // Allow platform-core theme loader to resolve local theme fixtures
      "@themes-local": path.resolve(__dirname, "../../packages/themes"),
      "@acme/configurator": path.resolve(
        __dirname,
        "../../packages/configurator/src",
      ),
      "@acme/configurator/providers": path.resolve(
        __dirname,
        "../../packages/configurator/src/providers.ts",
      ),
      "drizzle-orm": false,
      "entities/decode": ENTITIES_DECODE_PATH,
      "entities/lib/decode.js": ENTITIES_DECODE_PATH,
      "entities/escape": ENTITIES_ESCAPE_PATH,
      "entities/lib/escape.js": ENTITIES_ESCAPE_PATH,

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
