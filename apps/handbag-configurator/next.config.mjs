import sharedConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  webpack(config, options) {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, options);
    }

    if (!options.dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
