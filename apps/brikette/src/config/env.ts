// src/config/env.ts
// Centralized, Next-friendly environment helpers.

const getProcessEnvValue = (key: string): string | undefined => {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
};

const getImportMetaEnv = (): Record<string, unknown> => {
  const shared = (globalThis as Record<string, unknown>)["__IMPORT_META_ENV__"];
  if (shared && typeof shared === "object") {
    return shared as Record<string, unknown>;
  }
  if (typeof import.meta !== "undefined") {
    return (import.meta as { env?: Record<string, unknown> }).env ?? {};
  }
  return {};
};

const getMetaEnvValue = (key: string): string | undefined => {
  const metaEnv = getImportMetaEnv();
  const value = metaEnv[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
};

const getEnvValue = (key: string): string | undefined =>
  getProcessEnvValue(key) ?? getMetaEnvValue(key);

const getBooleanMetaEnv = (key: string): boolean | undefined => {
  const metaEnv = getImportMetaEnv();
  const value = metaEnv[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
};

const readEnv = (keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const value = getEnvValue(key);
    if (value) return value;
  }
  return undefined;
};

const metaMode = getMetaEnvValue("MODE");
const nodeEnv = getProcessEnvValue("NODE_ENV") ?? getMetaEnvValue("NODE_ENV");
const computedEnvMode = nodeEnv ?? metaMode ?? "development";
export const ENV_MODE = computedEnvMode;
export const IS_PROD = ENV_MODE === "production";
const DEV_OVERRIDE = getBooleanMetaEnv("DEV");
export const IS_DEV = typeof DEV_OVERRIDE === "boolean" ? DEV_OVERRIDE : !IS_PROD;
export const IS_TEST =
  ENV_MODE === "test" ||
  (typeof process !== "undefined" && process.env?.["VITEST"] === "true");
export const IS_SERVER = typeof window === "undefined";

export const PUBLIC_BASE_URL = readEnv(["NEXT_PUBLIC_BASE_URL", "PUBLIC_BASE_URL"]);
export const SITE_ORIGIN = readEnv([
  "NEXT_PUBLIC_SITE_ORIGIN",
  "SITE_ORIGIN",
  "VITE_SITE_ORIGIN",
  "NEXT_PUBLIC_SITE_DOMAIN",
  "VITE_SITE_DOMAIN",
]);
export const SITE_DOMAIN = readEnv(["NEXT_PUBLIC_SITE_DOMAIN", "VITE_SITE_DOMAIN"]);
export const PUBLIC_DOMAIN = readEnv(["NEXT_PUBLIC_PUBLIC_DOMAIN", "VITE_PUBLIC_DOMAIN"]);
export const FALLBACK_DOMAIN = readEnv(["NEXT_PUBLIC_DOMAIN", "VITE_DOMAIN"]);
export const PREVIEW_TOKEN = readEnv(["NEXT_PUBLIC_PREVIEW_TOKEN", "VITE_PREVIEW_TOKEN"]);
export const GA_MEASUREMENT_ID = readEnv([
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "VITE_GA_MEASUREMENT_ID",
]);
export const NOINDEX_PREVIEW = readEnv(["NEXT_PUBLIC_NOINDEX_PREVIEW", "NOINDEX_PREVIEW"]);
export const DEBUG_GUIDE_TITLES = readEnv([
  "NEXT_PUBLIC_DEBUG_GUIDE_TITLES",
  "VITE_DEBUG_GUIDE_TITLES",
  "VITE_DEBUG_GUIDES",
]);
export const DEBUG_GUIDES = readEnv(["NEXT_PUBLIC_DEBUG_GUIDES", "VITE_DEBUG_GUIDES"]);
