import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow importing/transpiling code from outside this app directory.
    externalDir: true
  },
  // Transpile linked workspace packages used by the CMS
  transpilePackages: [
    "@platform-core",
    "@ui",
    "@auth",
    "@acme/lib",
    "@acme/shared-utils",
    "@acme/types",
    "@shared-utils",
    "@date-utils",
    "@acme/tailwind-config",
    "@acme/design-tokens"
  ],
  webpack: (config) => {
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

    // App-local alias for "@/..."
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      // Prevent optional Drizzle ORM dependency from being bundled
      "drizzle-orm": false,
    };

    for (const mod of nodeBuiltins) {
      config.resolve.alias[`node:${mod}`] = mod;
    }

    return config;
  }
};

export default nextConfig;
