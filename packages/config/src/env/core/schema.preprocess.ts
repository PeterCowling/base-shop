import { z } from "zod";

import { AUTH_TTL_META_SYMBOL, NON_STRING_ENV_SYMBOL } from "./constants.js";
import { coreEnvBaseSchema } from "./schema.base-merge.js";

function normalizeOptionalString(
  env: Record<string, unknown>,
  key: "EMAIL_PROVIDER" | "EMAIL_FROM",
): void {
  const raw = env[key];
  if (typeof raw !== "string") return;
  const trimmed = raw.trim();
  if (trimmed === "") {
    delete env[key];
    return;
  }
  env[key] = trimmed;
}

function isCartFeatureDisabled(value: unknown): boolean {
  return value === false || (typeof value === "string" && value.trim().toLowerCase() === "false");
}

export const coreEnvPreprocessedSchema = z.preprocess((input) => {
  if (!input || typeof input !== "object") {
    return input;
  }

  const env = { ...(input as Record<string, unknown>) };

  const rawRecord = input as Record<string | symbol, unknown> | undefined;
  const flagged = Array.isArray(rawRecord?.[NON_STRING_ENV_SYMBOL])
    ? (rawRecord![NON_STRING_ENV_SYMBOL] as unknown[])
    : [];
  const globalFlagged = (globalThis as Record<string, unknown>)
    .__ACME_NON_STRING_ENV__;
  const ttlWasNonString =
    typeof rawRecord?.AUTH_TOKEN_TTL === "number" ||
    (Array.isArray(flagged) && flagged.includes("AUTH_TOKEN_TTL")) ||
    (Array.isArray(globalFlagged) && globalFlagged.includes("AUTH_TOKEN_TTL"));

  if (ttlWasNonString) {
    Object.defineProperty(env, AUTH_TTL_META_SYMBOL, {
      value: true,
      enumerable: false,
      configurable: true,
    });
  }

  delete (env as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL];

  normalizeOptionalString(env, "EMAIL_PROVIDER");
  normalizeOptionalString(env, "EMAIL_FROM");

  const hasEmailProvider =
    typeof env.EMAIL_PROVIDER === "string" && env.EMAIL_PROVIDER.length > 0;
  const hasEmailFrom =
    typeof env.EMAIL_FROM === "string" && env.EMAIL_FROM.length > 0;

  if (!hasEmailProvider) {
    env.EMAIL_PROVIDER = hasEmailFrom ? "smtp" : "noop";
  }

  // Keep global core env parsing usable for non-cart apps.
  // Cart-capable apps still enforce CART_COOKIE_SECRET in production by default.
  if (isCartFeatureDisabled(env.CART_FEATURE_ENABLED)) {
    const hasSecret =
      typeof env.CART_COOKIE_SECRET === "string" &&
      env.CART_COOKIE_SECRET.trim().length > 0;
    if (!hasSecret) {
      env.CART_COOKIE_SECRET = "cart-disabled-secret";
    }
  }

  return env;
}, coreEnvBaseSchema);
