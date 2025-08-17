import path from "node:path";

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
    "@date-utils"
  ],
  webpack: (config) => {
    // App-local alias for "@/..."
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src")
    };
    return config;
  }
};

export default nextConfig;
