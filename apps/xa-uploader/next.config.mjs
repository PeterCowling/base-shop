// apps/xa-uploader/next.config.mjs

import crypto from "node:crypto";

import sharedConfig from "@acme/next-config/next.config.mjs";

// Keep production config strict: missing secrets should fail fast so we do not
// accidentally deploy with insecure defaults.
const VENDOR_MODE =
  process.env.XA_UPLOADER_MODE === "vendor" || process.env.NEXT_PUBLIC_XA_UPLOADER_MODE === "vendor";

function randomSecret(minLength = 32) {
  const length = Math.max(32, minLength);
  const bytes = Math.max(32, Math.ceil(length * 1.25));
  return crypto.randomBytes(bytes).toString("base64url").slice(0, length);
}

function ensureStrongOrRandom(name, minLength = 32) {
  const val = process.env[name];
  if (val && val.length >= minLength) return;
  process.env[name] = randomSecret(minLength);
}

function requireEnv(name, minLength) {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is required in production`);
  if (minLength && val.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }
}

// In CI, skip validation since we only need runtime secrets at deploy time, not build time.
if (process.env.NODE_ENV === "production" && !VENDOR_MODE && !process.env.CI) {
  requireEnv("NEXTAUTH_SECRET", 32);
  requireEnv("SESSION_SECRET", 32);
  requireEnv("CART_COOKIE_SECRET");
  requireEnv("XA_UPLOADER_SESSION_SECRET", 32);
  requireEnv("XA_UPLOADER_ADMIN_TOKEN", 32);
} else {
  ensureStrongOrRandom("NEXTAUTH_SECRET", 32);
  ensureStrongOrRandom("SESSION_SECRET", 32);
  process.env.CART_COOKIE_SECRET ??= randomSecret(32);
  ensureStrongOrRandom("XA_UPLOADER_SESSION_SECRET", 32);
  ensureStrongOrRandom("XA_UPLOADER_ADMIN_TOKEN", 32);
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
};

const distDirOverride = process.env.XA_UPLOADER_NEXT_DIST_DIR?.trim();
if (distDirOverride) {
  nextConfig.distDir = distDirOverride;
}

export default nextConfig;
