/* i18n-exempt file -- ENG-2047 test-only env mock literals [ttl=2026-06-30] */
// Central mock for @acme/config/env/core
// Provides a test-friendly `coreEnv`, `coreEnvSchema`, and `loadCoreEnv`
// driven by process.env and lightweight in-memory overrides. This avoids
// repeated jest.doMock calls while keeping API parity used by tests.
import { z } from "zod";

type Primitive = string | number | boolean | undefined;
type EnvLike = Record<string, Primitive>;
export type TestCoreEnv = Record<string, Primitive> & {
  NEXTAUTH_SECRET?: string;
  SESSION_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  PREVIEW_TOKEN_SECRET?: string;
  UPGRADE_PREVIEW_TOKEN_SECRET?: string;
  // Flags used by configurator tests
  DEPOSIT_RELEASE_ENABLED?: boolean;
  DEPOSIT_RELEASE_INTERVAL_MS?: number;
  REVERSE_LOGISTICS_ENABLED?: boolean;
  REVERSE_LOGISTICS_INTERVAL_MS?: number;
  LATE_FEE_ENABLED?: boolean;
  LATE_FEE_INTERVAL_MS?: number;
  NEXT_PUBLIC_BASE_URL?: string;
};

let overrides: Partial<TestCoreEnv> = Object.create(null);

export function __setCoreEnv(over: Partial<TestCoreEnv>): void {
  overrides = { ...overrides, ...over };
}

export function __resetCoreEnv(): void {
  overrides = Object.create(null);
}

function ensureFallbackSecret(value: Primitive, fallback: string) {
  if (typeof value !== "string" || value.length < 32) return fallback;
  return value;
}

const readString = (value: Primitive): string | undefined =>
  typeof value === "string" ? value : undefined;

function computeCoreEnvFrom(raw: EnvLike): TestCoreEnv {
  const env = raw;
  const emailFrom = readString(env.EMAIL_FROM);
  const emailProvider = readString(env.EMAIL_PROVIDER);
  const authTokenTtl =
    typeof env.AUTH_TOKEN_TTL === "string" || typeof env.AUTH_TOKEN_TTL === "number"
      ? env.AUTH_TOKEN_TTL
      : undefined;
  // Align defaults with jest.setup.ts so types and expectations match
  const base: TestCoreEnv = {
    NEXTAUTH_SECRET: ensureFallbackSecret(
      readString(env.NEXTAUTH_SECRET),
      "test-nextauth-secret-32-chars-long-string!",
    ),
    SESSION_SECRET: ensureFallbackSecret(
      readString(env.SESSION_SECRET),
      "test-session-secret-32-chars-long-string!",
    ),
    EMAIL_FROM: emailFrom ?? "test@example.com",
    EMAIL_PROVIDER: emailProvider ?? (emailFrom ? "smtp" : "noop"),
    CART_COOKIE_SECRET: env.CART_COOKIE_SECRET ?? "test-cart-secret",
    AUTH_TOKEN_TTL: authTokenTtl ?? "15m",
    OPENAI_API_KEY: readString(env.OPENAI_API_KEY),
    PREVIEW_TOKEN_SECRET: readString(env.PREVIEW_TOKEN_SECRET),
    UPGRADE_PREVIEW_TOKEN_SECRET: readString(env.UPGRADE_PREVIEW_TOKEN_SECRET),
    // CMS settings used in tests
    CMS_SPACE_URL: readString(env.CMS_SPACE_URL),
    CMS_ACCESS_TOKEN: readString(env.CMS_ACCESS_TOKEN),
  };
  // Light coercion for flags used in tests so coreEnv proxy reads are typed
  const toBool = (v: Primitive): boolean | undefined => {
    if (v == null) return undefined;
    if (typeof v === "boolean") return v;
    const sv = typeof v === "string" ? v : String(v);
    if (/^(true|1)$/i.test(sv)) return true;
    if (/^(false|0)$/i.test(sv)) return false;
    return undefined;
  };
  const toNum = (v: Primitive): number | undefined => {
    if (v == null) return undefined;
    const num = typeof v === "number" ? v : Number(v);
    return Number.isNaN(num) ? undefined : num;
  };

  const derived: Partial<TestCoreEnv> = {
    DEPOSIT_RELEASE_ENABLED: toBool(env.DEPOSIT_RELEASE_ENABLED),
    DEPOSIT_RELEASE_INTERVAL_MS: toNum(env.DEPOSIT_RELEASE_INTERVAL_MS),
    REVERSE_LOGISTICS_ENABLED: toBool(env.REVERSE_LOGISTICS_ENABLED),
    REVERSE_LOGISTICS_INTERVAL_MS: toNum(env.REVERSE_LOGISTICS_INTERVAL_MS),
    LATE_FEE_ENABLED: toBool(env.LATE_FEE_ENABLED),
    LATE_FEE_INTERVAL_MS: toNum(env.LATE_FEE_INTERVAL_MS),
    NEXT_PUBLIC_BASE_URL: readString(env.NEXT_PUBLIC_BASE_URL),
  };

  return Object.assign(Object.create(null), base, derived, overrides);
}

function computeCoreEnv(): TestCoreEnv {
  return computeCoreEnvFrom(process.env as EnvLike);
}

export function depositReleaseEnvRefinement(
  env: Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  for (const [key, value] of Object.entries(env)) {
    const isDeposit = key.startsWith("DEPOSIT_RELEASE_");
    const isReverse = key.startsWith("REVERSE_LOGISTICS_");
    const isLateFee = key.startsWith("LATE_FEE_");
    if (!isDeposit && !isReverse && !isLateFee) continue;
    if (key.includes("ENABLED")) {
      const sv = typeof value === "string" ? value : String(value);
      if (!/^(true|false|1|0)$/i.test(sv)) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "must be true or false",
        });
      }
    } else if (key.includes("INTERVAL_MS")) {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "must be a number",
        });
      }
    }
  }
}

// Minimal schema implementing features used by tests:
// - CART_COOKIE_SECRET default outside production, required in production
// - Refinements for *_ENABLED booleans and *_INTERVAL_MS numbers
// - Passthrough so unrelated keys do not fail parsing
const isProd = (() => {
  const mode = process.env.NODE_ENV;
  const isJest = typeof (globalThis as { jest?: unknown }).jest !== "undefined";
  // Mirror real behavior: production only when explicitly set AND not under Jest defaulting
  return mode === "production" && !isJest;
})();

const baseEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    CART_COOKIE_SECRET: isProd
      ? z.string().min(1)
      : z.string().min(1).default("dev-cart-secret"),
    DEPOSIT_RELEASE_ENABLED: z
      .preprocess((v) => (v == null ? undefined : v), z.any().optional())
      .refine(
        (v) => v == null || /^(true|false|1|0)$/i.test(String(v)),
        { message: "must be true or false" },
      ),
    DEPOSIT_RELEASE_INTERVAL_MS: z
      .preprocess((v) => (v == null ? undefined : v), z.any().optional())
      .refine(
        (v) => v == null || !Number.isNaN(Number(v)),
        { message: "must be a number" },
      ),
    REVERSE_LOGISTICS_ENABLED: z
      .preprocess((v) => (v == null ? undefined : v), z.any().optional())
      .refine(
        (v) => v == null || /^(true|false|1|0)$/i.test(String(v)),
        { message: "must be true or false" },
      ),
    REVERSE_LOGISTICS_INTERVAL_MS: z
      .preprocess((v) => (v == null ? undefined : v), z.any().optional())
      .refine(
        (v) => v == null || !Number.isNaN(Number(v)),
        { message: "must be a number" },
      ),
    LATE_FEE_ENABLED: z
      .preprocess((v) => (v == null ? undefined : v), z.any().optional())
      .refine(
        (v) => v == null || /^(true|false|1|0)$/i.test(String(v)),
        { message: "must be true or false" },
      ),
    LATE_FEE_INTERVAL_MS: z
      .preprocess((v) => (v == null ? undefined : v), z.any().optional())
      .refine(
        (v) => v == null || !Number.isNaN(Number(v)),
        { message: "must be a number" },
      ),
  })
  .passthrough()
  .superRefine((env, ctx) => depositReleaseEnvRefinement(env, ctx));

export const coreEnvSchema = baseEnvSchema;

export function loadCoreEnv(raw: EnvLike = process.env as EnvLike): TestCoreEnv {
  // Minimal validation to mirror real core behavior used in API tests
  const env = computeCoreEnvFrom(raw);
  const provider =
    typeof raw.AUTH_PROVIDER === "string" ? raw.AUTH_PROVIDER.toLowerCase() : "";
  // Validation for configurator tests around deposit/reverse/late flags
  const issues: Array<{ path: string; message: string }> = [];
  const addBoolIssue = (key: string, v: unknown) => {
    if (v == null) return;
    const sv = typeof v === "string" ? v : String(v);
    if (!/^(true|false|1|0)$/i.test(sv)) {
      issues.push({ path: key, message: "must be true or false" });
    }
  };
  const addNumIssue = (key: string, v: unknown) => {
    if (v == null) return;
    const num = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(num)) {
      issues.push({ path: key, message: "must be a number" });
    }
  };

  addBoolIssue("DEPOSIT_RELEASE_ENABLED", raw.DEPOSIT_RELEASE_ENABLED);
  addNumIssue("DEPOSIT_RELEASE_INTERVAL_MS", raw.DEPOSIT_RELEASE_INTERVAL_MS);
  addBoolIssue("REVERSE_LOGISTICS_ENABLED", raw.REVERSE_LOGISTICS_ENABLED);
  addNumIssue("REVERSE_LOGISTICS_INTERVAL_MS", raw.REVERSE_LOGISTICS_INTERVAL_MS);
  addBoolIssue("LATE_FEE_ENABLED", raw.LATE_FEE_ENABLED);
  addNumIssue("LATE_FEE_INTERVAL_MS", raw.LATE_FEE_INTERVAL_MS);

  // Validate NEXT_PUBLIC_BASE_URL when present
  if (typeof raw.NEXT_PUBLIC_BASE_URL === "string") {
    try {
      // Throws for invalid URLs like "not a url"
      // Allow only absolute http/https
      const u = new URL(raw.NEXT_PUBLIC_BASE_URL);
      if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol");
    } catch {
      issues.push({ path: "NEXT_PUBLIC_BASE_URL", message: "Invalid url" });
    }
  }

  // Validate sendgrid when selected
  if (typeof raw.EMAIL_PROVIDER === "string" && raw.EMAIL_PROVIDER.toLowerCase() === "sendgrid") {
    const hasKey =
      typeof raw.SENDGRID_API_KEY === "string" && raw.SENDGRID_API_KEY.trim() !== "";
    if (!hasKey) {
      issues.push({ path: "SENDGRID_API_KEY", message: "Required" });
    }
  }
  if (provider === "jwt") {
    const hasJwt = typeof raw.JWT_SECRET === "string" && raw.JWT_SECRET.trim() !== "";
    if (!hasJwt) {
      issues.push({ path: "JWT_SECRET", message: "JWT_SECRET is required when AUTH_PROVIDER=jwt" });
    }
  }

  // Normalize AUTH_TOKEN_TTL similar to real loader behavior
  const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");
  const rawTtl = raw.AUTH_TOKEN_TTL;
  let normalizedTtl: number | undefined;
  const flagged = Reflect.get(raw, NON_STRING_ENV_SYMBOL) as unknown;
  const globalFlagged = (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  const ttlWasNonString =
    typeof rawTtl === "number" ||
    (Array.isArray(flagged) && (flagged as unknown[]).includes("AUTH_TOKEN_TTL")) ||
    (Array.isArray(globalFlagged) && (globalFlagged as unknown[]).includes("AUTH_TOKEN_TTL"));

  if (ttlWasNonString) {
    // console.debug("[core-env-mock] raw AUTH_TOKEN_TTL is non-string:", rawTtl);
    // Mimic core loader behavior: treat non-string TTL as "unset" so
    // auth schema default applies (15m => 900)
    normalizedTtl = 900;
  } else if (typeof rawTtl === "string") {
    const trimmed = rawTtl.trim();
    if (trimmed === "") {
      normalizedTtl = 900; // default
    } else if (/^\d+$/.test(trimmed)) {
      normalizedTtl = Number(trimmed);
    } else if (/^(\d+)\s*([sm])$/i.test(trimmed)) {
      const m = trimmed.match(/^(\d+)\s*([sm])$/i)!;
      const n = Number(m[1]);
      normalizedTtl = m[2].toLowerCase() === "m" ? n * 60 : n;
    } else {
      // leave undefined; real loader would surface a schema error in prod
    }
  }
  if (typeof normalizedTtl === "number") {
    env.AUTH_TOKEN_TTL = normalizedTtl;
    // console.debug('[core-env-mock] normalized AUTH_TOKEN_TTL ->', normalizedTtl, 'from', rawTtl);
  }

  if (issues.length) {
    console.error("❌ Invalid core environment variables:");
    for (const issue of issues) {
      console.error(`  • ${issue.path}: ${issue.message}`);
    }
    throw new Error("Invalid core environment variables");
  }
  const result = {
    ...env,
    ...(typeof normalizedTtl === "number" ? { AUTH_TOKEN_TTL: normalizedTtl } : {}),
  } as TestCoreEnv;
  // Debug for TTL test case: ensure normalization is applied when input is number
  if (typeof raw.AUTH_TOKEN_TTL === "number") {
    console.error(
      "[core-env-mock] TTL input number=",
      raw.AUTH_TOKEN_TTL,
      "=> returned=",
      result.AUTH_TOKEN_TTL,
    );
  }
  return result;
}

// Eager validation in production to mirror real core module behavior
(() => {
  if ((process.env.NODE_ENV || "").toLowerCase() === "production") {
    const errors: string[] = [];
    const url = process.env.CMS_SPACE_URL;
    const token = process.env.CMS_ACCESS_TOKEN;
    if (!token) {
      errors.push("CMS_ACCESS_TOKEN: Required");
    }
    if (url) {
      try {
        // Validate absolute http/https URL
        const u = new URL(url);
        if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol");
      } catch {
        errors.push("CMS_SPACE_URL: Invalid url");
      }
    }
    if (errors.length) {
      console.error("❌ Invalid core environment variables:", {
        _errors: [],
        CMS_ACCESS_TOKEN: token ? undefined : { _errors: ["Required"] },
        ...(url
          ? {}
          : {}),
      });
      throw new Error("Invalid core environment variables");
    }
  }
})();

export const coreEnv: TestCoreEnv = new Proxy({} as TestCoreEnv, {
  get: (_t, prop: string) => computeCoreEnv()[prop],
  has: (_t, prop: string) => prop in computeCoreEnv(),
  ownKeys: () => Reflect.ownKeys(computeCoreEnv()),
  getOwnPropertyDescriptor: (_t, prop: string | symbol) =>
    Object.getOwnPropertyDescriptor(computeCoreEnv(), prop),
});

export default {} as unknown as never;

// Provide requireEnv helper to match real module API used in tests
export function requireEnv(
  key: string,
  type: "boolean" | "number" | "string" = "string",
): string | number | boolean {
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
}
