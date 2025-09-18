// packages/config/src/env/core.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import { authEnvSchema } from "./auth.js";
import { cmsEnvSchema } from "./cms.schema.js";
import { emailEnvSchema } from "./email.js";
import { paymentsEnvSchema } from "./payments.js";
import { shippingEnvSchema } from "./shipping.js";
const isJest = typeof (globalThis as { jest?: unknown }).jest !== "undefined";
const envMode = process.env.NODE_ENV;

function resolveNodeEnv(raw?: NodeJS.ProcessEnv): string | undefined {
  return raw?.NODE_ENV ?? process.env.NODE_ENV ?? envMode;
}

function hasJestContext(raw?: NodeJS.ProcessEnv): boolean {
  const workerId = raw?.JEST_WORKER_ID ?? process.env.JEST_WORKER_ID;
  return typeof workerId !== "undefined" || isJest;
}

function shouldUseTestDefaults(raw?: NodeJS.ProcessEnv): boolean {
  const mode = resolveNodeEnv(raw);
  if (mode === "production") {
    return false;
  }
  if (mode === "test") {
    return true;
  }
  return hasJestContext(raw);
}

const isTest = shouldUseTestDefaults();
const isProd = resolveNodeEnv() === "production" && !isTest;

const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");
const NON_STRING_META_KEY = "__acmeNonStringKeys__";

function collectNonStringKeys(raw: unknown): Set<string> {
  const keys = new Set<string>();
  const rawRecord = raw as Record<string | symbol, unknown> | undefined;
  if (rawRecord) {
    const flagged = rawRecord[NON_STRING_ENV_SYMBOL];
    if (Array.isArray(flagged)) {
      for (const key of flagged) {
        if (typeof key === "string") keys.add(key);
      }
    }
  }

  const globalFlagged = (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  if (Array.isArray(globalFlagged)) {
    for (const key of globalFlagged) {
      if (typeof key === "string") keys.add(key);
    }
  }

  return keys;
}

const baseEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    OUTPUT_EXPORT: z.coerce.boolean().optional(),
    NEXT_PUBLIC_PHASE: z.string().optional(),
    NEXT_PUBLIC_DEFAULT_SHOP: z.string().optional(),
    NEXT_PUBLIC_SHOP_ID: z.string().optional(),
    SHOP_CODE: z.string().optional(),
    CART_COOKIE_SECRET: isProd
      ? z.string().min(1)
      : z.string().min(1).default("dev-cart-secret"),
    CART_TTL: z.coerce.number().optional(),
    CHROMATIC_PROJECT_TOKEN: z.string().optional(),
    GA_API_SECRET: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_API_TOKEN: z.string().optional(),
    LUXURY_FEATURES_RA_TICKETING: z.coerce.boolean().optional(),
    LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: z.coerce.number().optional(),
    LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: z.coerce.boolean().optional(),
    LUXURY_FEATURES_TRACKING_DASHBOARD: z.coerce.boolean().optional(),
    LUXURY_FEATURES_RETURNS: z.coerce.boolean().optional(),
    DEPOSIT_RELEASE_ENABLED: z
      .string()
      .refine((v) => v === "true" || v === "false", {
        message: "must be true or false",
      })
      .transform((v) => v === "true")
      .optional(),
    DEPOSIT_RELEASE_INTERVAL_MS: z
      .string()
      .refine((v) => !Number.isNaN(Number(v)), { message: "must be a number" })
      .transform((v) => Number(v))
      .optional(),
    REVERSE_LOGISTICS_ENABLED: z
      .string()
      .refine((v) => v === "true" || v === "false", {
        message: "must be true or false",
      })
      .transform((v) => v === "true")
      .optional(),
    REVERSE_LOGISTICS_INTERVAL_MS: z
      .string()
      .refine((v) => !Number.isNaN(Number(v)), { message: "must be a number" })
      .transform((v) => Number(v))
      .optional(),
    LATE_FEE_ENABLED: z
      .string()
      .refine((v) => v === "true" || v === "false", {
        message: "must be true or false",
      })
      .transform((v) => v === "true")
      .optional(),
    LATE_FEE_INTERVAL_MS: z
      .string()
      .refine((v) => !Number.isNaN(Number(v)), { message: "must be a number" })
      .transform((v) => Number(v))
      .optional(),
    OPENAI_API_KEY: z.string().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    STOCK_ALERT_RECIPIENTS: z.string().optional(),
    STOCK_ALERT_WEBHOOK: z.string().url().optional(),
    STOCK_ALERT_DEFAULT_THRESHOLD: z.coerce.number().optional(),
    STOCK_ALERT_RECIPIENT: z.string().email().optional(),
  })
  .passthrough();

export const requireEnv = (
  key: string,
  type: "boolean" | "number" | "string" = "string",
) => {
  const raw = process.env[key];
  if (raw == null) throw new Error(`${key} is required`);
  const val = raw.trim();
  if (val === "") throw new Error(`${key} is required`);
  if (type === "boolean") {
    if (/^(true|1)$/i.test(val)) return true;
    if (/^(false|0)$/i.test(val)) return false;
    throw new Error(`${key} must be a boolean`);
  }
  if (type === "number") {
    const num = Number(val);
    if (!Number.isNaN(num)) return num;
    throw new Error(`${key} must be a number`);
  }
  return val;
};

const authInner = authEnvSchema.innerType().omit({ AUTH_TOKEN_TTL: true });

export const coreEnvBaseSchema = authInner
  .merge(cmsEnvSchema)
  .merge(emailEnvSchema.innerType())
  .merge(paymentsEnvSchema)
  .merge(shippingEnvSchema.innerType())
  .merge(baseEnvSchema)
  .extend({
    AUTH_TOKEN_TTL: z.union([z.string(), z.number()]).optional(),
  });

const coreEnvPreprocessedSchema = z.preprocess((input) => {
  if (!input || typeof input !== "object") {
    return input;
  }

  const env = { ...(input as Record<string, unknown>) };

  const nonStringKeys = collectNonStringKeys(input);
  if (nonStringKeys.size > 0) {
    Object.defineProperty(env, NON_STRING_META_KEY, {
      value: nonStringKeys,
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

export function depositReleaseEnvRefinement(
  env: Record<string, unknown>,
  ctx: z.RefinementCtx
): void {
  for (const [key, value] of Object.entries(env)) {
    const isDeposit = key.startsWith("DEPOSIT_RELEASE_");
    const isReverse = key.startsWith("REVERSE_LOGISTICS_");
    const isLateFee = key.startsWith("LATE_FEE_");
    if (!isDeposit && !isReverse && !isLateFee) continue;
    if (key.includes("ENABLED")) {
      if (
        value !== "true" &&
        value !== "false" &&
        value !== true &&
        value !== false
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "must be true or false",
        });
      }
    } else if (key.includes("INTERVAL_MS")) {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "must be a number",
        });
      }
    }
  }
}

export const coreEnvSchema = coreEnvPreprocessedSchema.superRefine((env, ctx) => {
  depositReleaseEnvRefinement(env, ctx);

  // Normalize AUTH_TOKEN_TTL before delegating to the auth schema so builds
  // don't fail if the value is provided as a plain number or contains
  // incidental whitespace.
  const envForAuth: Record<string, unknown> = {
    ...(env as Record<string, unknown>),
  };
  const rawTtl = envForAuth.AUTH_TOKEN_TTL;
  const storedMeta = (env as Record<string, unknown>)[NON_STRING_META_KEY];
  const nonStringKeys: Set<string> | undefined =
    storedMeta instanceof Set ? storedMeta : collectNonStringKeys(process.env);
  const ttlWasNonString = nonStringKeys?.has("AUTH_TOKEN_TTL");

  if (ttlWasNonString) {
    delete envForAuth.AUTH_TOKEN_TTL;
    nonStringKeys?.delete("AUTH_TOKEN_TTL");
  } else if (typeof rawTtl === "number") {
    // Let auth schema default to 15m when undefined
    delete envForAuth.AUTH_TOKEN_TTL;
  } else if (typeof rawTtl === "string") {
    const trimmed = rawTtl.trim();
    if (trimmed === "") {
      delete envForAuth.AUTH_TOKEN_TTL;
    } else if (/^\d+$/.test(trimmed)) {
      envForAuth.AUTH_TOKEN_TTL = `${trimmed}s`;
    } else if (/^(\d+)\s*([sm])$/i.test(trimmed)) {
      const [, num, unit] = trimmed.match(/^(\d+)\s*([sm])$/i)!;
      envForAuth.AUTH_TOKEN_TTL = `${num}${unit.toLowerCase()}`;
    }
  }

  if (nonStringKeys && nonStringKeys.size === 0) {
    delete (env as Record<string, unknown>)[NON_STRING_META_KEY];
  }

  const authResult = authEnvSchema.safeParse(envForAuth);
  if (authResult.success) {
    (env as Record<string, unknown>).AUTH_TOKEN_TTL =
      authResult.data.AUTH_TOKEN_TTL;
  } else {
    authResult.error.issues.forEach((issue) => {
      const { code, ...rest } = issue;
      ctx.addIssue({
        ...(rest as Record<string, unknown>),
        code: code ?? z.ZodIssueCode.custom,
      } as z.ZodIssue);
    });
  }

  const emailResult = emailEnvSchema.safeParse(env);
  if (!emailResult.success) {
    emailResult.error.issues.forEach((issue) => {
      const { code, ...rest } = issue;
      ctx.addIssue({
        ...(rest as Record<string, unknown>),
        code: code ?? z.ZodIssueCode.custom,
      } as z.ZodIssue);
    });
  }
});
export type CoreEnv = z.infer<typeof coreEnvSchema>;

type EnvRecord = Record<string, string | undefined>;

function cloneProcessEnv(source: NodeJS.ProcessEnv | EnvRecord): EnvRecord {
  return Object.assign(Object.create(null), source);
}

const importEnvObject = process.env;
const importEnvSnapshot = cloneProcessEnv(process.env);

function snapshotForCoreEnv(): NodeJS.ProcessEnv {
  if (process.env === importEnvObject) {
    return cloneProcessEnv(process.env) as NodeJS.ProcessEnv;
  }
  return cloneProcessEnv(importEnvSnapshot) as NodeJS.ProcessEnv;
}

function parseCoreEnv(raw: NodeJS.ProcessEnv = process.env): CoreEnv {
  const useTestDefaults = shouldUseTestDefaults(raw);
  const env = useTestDefaults
    ? { EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "smtp", ...raw }
    : {
        ...raw,
        ...(!raw.EMAIL_PROVIDER
          ? { EMAIL_PROVIDER: raw.EMAIL_FROM ? "smtp" : "noop" }
          : {}),
      };
  const parsed = coreEnvSchema.safeParse(env);
  if (!parsed.success) {
    if (useTestDefaults) {
      const onlyMissing = parsed.error.issues.every(
        (issue) =>
          issue.code === z.ZodIssueCode.invalid_type &&
          issue.received === "undefined"
      );
      if (onlyMissing) {
        return coreEnvSchema.parse({
          EMAIL_FROM: "test@example.com",
          EMAIL_PROVIDER: "smtp",
        });
      }
    }
    console.error("❌ Invalid core environment variables:");
    parsed.error.issues.forEach((issue: z.ZodIssue) => {
      const pathArr = (issue.path ?? []) as Array<string | number>;
      const path = pathArr.length ? pathArr.join(".") : "(root)";
      console.error(`  • ${path}: ${issue.message}`);
    });
    throw new Error("Invalid core environment variables");
  }
  return parsed.data;
}

export function loadCoreEnv(raw: NodeJS.ProcessEnv = process.env): CoreEnv {
  return parseCoreEnv(raw);
}

// Lazy proxy; no import-time parse in dev.
let __cachedCoreEnv: CoreEnv | null = null;
type LoadCoreEnvFn = (raw?: NodeJS.ProcessEnv) => CoreEnv;

const nodeRequire: NodeJS.Require | null =
  typeof require === "function" ? require : null;
const cachedEnvMode = process.env.NODE_ENV;

let __loadCoreEnvFn: LoadCoreEnvFn | null = null;

function extractLoadCoreEnvFn(candidate: unknown): LoadCoreEnvFn | null {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "function") {
    return candidate as LoadCoreEnvFn;
  }

  if (
    typeof (candidate as { loadCoreEnv?: unknown }).loadCoreEnv === "function"
  ) {
    return (candidate as { loadCoreEnv: LoadCoreEnvFn }).loadCoreEnv;
  }

  const defaultExport = (candidate as { default?: unknown }).default;
  if (
    defaultExport &&
    typeof (defaultExport as { loadCoreEnv?: unknown }).loadCoreEnv ===
      "function"
  ) {
    return (defaultExport as { loadCoreEnv: LoadCoreEnvFn }).loadCoreEnv;
  }

  return null;
}

function resolveLoadCoreEnvFn(): LoadCoreEnvFn {
  if (__loadCoreEnvFn) {
    return __loadCoreEnvFn;
  }

  const shouldPreferStub =
    cachedEnvMode === "production" || cachedEnvMode == null;

  if (shouldPreferStub && nodeRequire) {
    try {
      const mod = nodeRequire("./core.js");
      const loader = extractLoadCoreEnvFn(mod);
      if (loader) {
        __loadCoreEnvFn = loader;
        return __loadCoreEnvFn;
      }
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? (error as { code?: unknown }).code
          : undefined;
      if (
        code !== "MODULE_NOT_FOUND" &&
        code !== "ERR_MODULE_NOT_FOUND" &&
        code !== "ERR_REQUIRE_ESM" &&
        code !== "ERR_UNKNOWN_FILE_EXTENSION"
      ) {
        throw error;
      }
    }
  }

  __loadCoreEnvFn = loadCoreEnv;
  return __loadCoreEnvFn;
}

function getCoreEnv(): CoreEnv {
  if (!__cachedCoreEnv) {
    const loader = resolveLoadCoreEnvFn();
    __cachedCoreEnv = loader(snapshotForCoreEnv());
  }
  return __cachedCoreEnv;
}

export const coreEnv: CoreEnv = new Proxy({} as CoreEnv, {
  get: (_t, prop: string) => {
    return getCoreEnv()[prop as keyof CoreEnv];
  },
  has: (_t, prop: string) => {
    return prop in getCoreEnv();
  },
  ownKeys: () => {
    return Reflect.ownKeys(getCoreEnv());
  },
  getOwnPropertyDescriptor: (_t, prop: string | symbol) => {
    return Object.getOwnPropertyDescriptor(getCoreEnv(), prop);
  },
}) as CoreEnv;

// Fail fast in prod only (forces a single parse early).
if (isProd) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  coreEnv.NODE_ENV;
}
