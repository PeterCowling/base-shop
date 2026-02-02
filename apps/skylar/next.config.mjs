import sharedConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },
};

export default nextConfig;
