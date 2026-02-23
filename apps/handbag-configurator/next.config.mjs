import sharedConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  webpack(config, options) {
    // Legacy webpack path retained as an explicit exception while scripts still
    // execute via `next --webpack`. This block is limited to webpack cache
    // behavior until TASK-08 script migration is complete.
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
