// packages/config/src/env/core.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import { authEnvSchema } from "./auth.js";
import { cmsEnvSchema } from "./cms.schema.js";
import { emailEnvSchema } from "./email.js";
import { paymentsEnvSchema } from "./payments.js";
import { shippingEnvSchema } from "./shipping.js";
import { createRequire } from "module";

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

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

export const coreEnvSchema = coreEnvBaseSchema.superRefine((env, ctx) => {
  depositReleaseEnvRefinement(env, ctx);

  // Normalize AUTH_TOKEN_TTL before delegating to the auth schema so builds
  // don't fail if the value is provided as a plain number or contains
  // incidental whitespace.
  const envForAuth: Record<string, unknown> = {
    ...(env as Record<string, unknown>),
  };
  const rawTtl = envForAuth.AUTH_TOKEN_TTL;
  if (typeof rawTtl === "number") {
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

  const authResult = authEnvSchema.safeParse(envForAuth);
  if (authResult.success) {
    (env as Record<string, unknown>).AUTH_TOKEN_TTL =
      authResult.data.AUTH_TOKEN_TTL;
  } else {
    authResult.error.issues.forEach((issue) => ctx.addIssue(issue));
  }

  const emailResult = emailEnvSchema.safeParse(env);
  if (!emailResult.success) {
    emailResult.error.issues.forEach((issue) => ctx.addIssue(issue));
  }
});
export type CoreEnv = z.infer<typeof coreEnvSchema>;

function parseCoreEnv(raw: NodeJS.ProcessEnv = process.env): CoreEnv {
  const env = isTest
    ? { EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "noop", ...raw }
    : raw;
  const parsed = coreEnvSchema.safeParse(env);
  if (!parsed.success) {
    if (isTest) {
      return coreEnvSchema.parse({
        EMAIL_FROM: "test@example.com",
        EMAIL_PROVIDER: "noop",
      });
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
const nodeRequire =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  typeof require !== "undefined" ? require : createRequire(eval("import.meta.url"));
const envMode = process.env.NODE_ENV;
function getCoreEnv(): CoreEnv {
  if (!__cachedCoreEnv) {
    if (envMode === "production" || envMode == null) {
      const mod = nodeRequire("./core.js") as typeof import("./core.js");
      __cachedCoreEnv = mod.loadCoreEnv();
    } else {
      __cachedCoreEnv = parseCoreEnv();
    }
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
if (isProd && !process.env.JEST_WORKER_ID) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  coreEnv.NODE_ENV;
}
