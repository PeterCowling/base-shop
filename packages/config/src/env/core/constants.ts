import "@acme/zod-utils/initZod";

const isJest = typeof (globalThis as { jest?: unknown }).jest !== "undefined";
const envMode = process.env.NODE_ENV;

export function resolveNodeEnv(raw?: NodeJS.ProcessEnv): string | undefined {
  return raw?.NODE_ENV ?? process.env.NODE_ENV ?? envMode;
}

export function hasJestContext(raw?: NodeJS.ProcessEnv): boolean {
  const workerId = raw?.JEST_WORKER_ID ?? process.env.JEST_WORKER_ID;
  return typeof workerId !== "undefined" || isJest;
}

export function shouldUseTestDefaults(raw?: NodeJS.ProcessEnv): boolean {
  const mode = resolveNodeEnv(raw);
  if (mode === "production") return false;
  if (mode === "test") return true;
  return hasJestContext(raw);
}

export const isTest = shouldUseTestDefaults();
export const isProd = resolveNodeEnv() === "production" && !isTest;

export const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");
export const AUTH_TTL_META_SYMBOL = Symbol.for(
  "acme.config.authTtlWasNonString",
);

