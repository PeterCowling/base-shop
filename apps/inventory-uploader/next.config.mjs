// apps/inventory-uploader/next.config.mjs
import crypto from "node:crypto";

import sharedConfig from "@acme/next-config/next.config.mjs";

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
if (process.env.NODE_ENV === "production" && !process.env.CI) {
  requireEnv("INVENTORY_SESSION_SECRET", 32);
  requireEnv("INVENTORY_ADMIN_TOKEN", 32);
} else {
  ensureStrongOrRandom("INVENTORY_SESSION_SECRET", 32);
  ensureStrongOrRandom("INVENTORY_ADMIN_TOKEN", 32);
}

const nextConfig = {
  ...sharedConfig,
  poweredByHeader: false,
  // This is an internal operator console — do not static-export it.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
};

export default nextConfig;
