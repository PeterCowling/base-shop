// apps/inventory-uploader/next.config.mjs
import sharedConfig from "@acme/next-config/next.config.mjs";

const nextConfig = {
  ...sharedConfig,
  poweredByHeader: false,
  // This is an internal operator console — do not static-export it.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
};

export default nextConfig;
