// apps/payment-manager/next.config.mjs
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
  requireEnv("PAYMENT_MANAGER_SESSION_SECRET", 32);
  requireEnv("PAYMENT_MANAGER_ADMIN_TOKEN", 32);
  requireEnv("PAYMENT_MANAGER_ENCRYPTION_KEY", 44);
} else {
  ensureStrongOrRandom("PAYMENT_MANAGER_SESSION_SECRET", 32);
  ensureStrongOrRandom("PAYMENT_MANAGER_ADMIN_TOKEN", 32);
  // PAYMENT_MANAGER_ENCRYPTION_KEY: only required in production (credential encryption not used in dev)
}

const nextConfig = {
  ...sharedConfig,
  poweredByHeader: false,
  // This is an internal operator console — do not static-export it.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
};

export default nextConfig;
