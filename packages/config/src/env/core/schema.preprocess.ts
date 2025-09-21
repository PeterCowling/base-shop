import { z } from "zod";
import { AUTH_TTL_META_SYMBOL, NON_STRING_ENV_SYMBOL } from "./constants.js";
import { coreEnvBaseSchema } from "./schema.base-merge.js";

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

  if (typeof env.EMAIL_PROVIDER === "string") {
    const trimmedProvider = env.EMAIL_PROVIDER.trim();
    if (trimmedProvider === "") {
      delete env.EMAIL_PROVIDER;
    } else {
      env.EMAIL_PROVIDER = trimmedProvider;
    }
  }

  if (typeof env.EMAIL_FROM === "string") {
    const trimmedFrom = env.EMAIL_FROM.trim();
    if (trimmedFrom === "") {
      delete env.EMAIL_FROM;
    } else {
      env.EMAIL_FROM = trimmedFrom;
    }
  }

  const hasEmailProvider =
    typeof env.EMAIL_PROVIDER === "string" && env.EMAIL_PROVIDER.length > 0;
  const hasEmailFrom =
    typeof env.EMAIL_FROM === "string" && env.EMAIL_FROM.length > 0;

  if (!hasEmailProvider) {
    env.EMAIL_PROVIDER = hasEmailFrom ? "smtp" : "noop";
  }

  return env;
}, coreEnvBaseSchema);
