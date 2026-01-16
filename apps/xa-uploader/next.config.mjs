// apps/xa-uploader/next.config.mjs

import sharedConfig from "@acme/next-config/next.config.mjs";

// Keep production config strict: missing secrets should fail fast so we don't
// accidentally deploy with insecure defaults.
const DEV_NEXTAUTH = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION = "dev-session-secret-32-chars-long-string!";
const DEV_UPLOADER_SESSION = "dev-xa-uploader-session-secret-32-chars!";
const DEV_UPLOADER_ADMIN_TOKEN = "dev-xa-uploader-admin-token-32-chars!!";

const VENDOR_MODE =
  process.env.XA_UPLOADER_MODE === "vendor" || process.env.NEXT_PUBLIC_XA_UPLOADER_MODE === "vendor";

function ensureStrong(name, fallback) {
  const val = process.env[name];
  if (!val || val.length < 32) process.env[name] = fallback;
}

function requireEnv(name, minLength) {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is required in production`);
  if (minLength && val.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }
}

if (process.env.NODE_ENV === "production" && !VENDOR_MODE) {
  requireEnv("NEXTAUTH_SECRET", 32);
  requireEnv("SESSION_SECRET", 32);
  requireEnv("CART_COOKIE_SECRET");
  requireEnv("XA_UPLOADER_SESSION_SECRET", 32);
  requireEnv("XA_UPLOADER_ADMIN_TOKEN", 32);
} else {
  ensureStrong("NEXTAUTH_SECRET", DEV_NEXTAUTH);
  ensureStrong("SESSION_SECRET", DEV_SESSION);
  process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
  ensureStrong("XA_UPLOADER_SESSION_SECRET", DEV_UPLOADER_SESSION);
  ensureStrong("XA_UPLOADER_ADMIN_TOKEN", DEV_UPLOADER_ADMIN_TOKEN);
}

process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
process.env.EMAIL_PROVIDER ??= "noop";

const nextConfig = {
  ...sharedConfig,
  poweredByHeader: false,
  // This is an internal uploader console; do not static-export it.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  webpack(config, ctx) {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, ctx);
    }
    // Avoid intermittent cache-related build crashes; opt back in via NEXT_CACHE=true.
    if (process.env.NEXT_CACHE !== "true") {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
