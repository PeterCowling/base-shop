// packages/config/src/env/core.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import { authEnvSchema } from "./auth.js";
import { cmsEnvSchema } from "./cms.js";
import { emailEnvSchema } from "./email.js";
import { paymentsEnvSchema } from "./payments.js";
import { shippingEnvSchema } from "./shipping.js";
import { mergeEnvSchemas } from "./mergeEnvSchemas.js";

const isProd = process.env.NODE_ENV === "production";

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

export const coreEnvBaseSchema = mergeEnvSchemas(
  authEnvSchema,
  cmsEnvSchema,
  emailEnvSchema,
  paymentsEnvSchema,
  shippingEnvSchema,
  baseEnvSchema
);

export function depositReleaseEnvRefinement(
  env: Record<string, unknown>,
  ctx: z.RefinementCtx
): void {
  for (const [key, value] of Object.entries(env)) {
    const isDeposit = key.startsWith("DEPOSIT_RELEASE_");
    const isReverse = key.startsWith("REVERSE_LOGISTICS_");
    const isLateFee = key.startsWith("LATE_FEE_");
    if (!isDeposit && !isReverse && !isLateFee) continue;
    if (
      key === "DEPOSIT_RELEASE_ENABLED" ||
      key === "DEPOSIT_RELEASE_INTERVAL_MS" ||
      key === "REVERSE_LOGISTICS_ENABLED" ||
      key === "REVERSE_LOGISTICS_INTERVAL_MS" ||
      key === "LATE_FEE_ENABLED" ||
      key === "LATE_FEE_INTERVAL_MS"
    )
      continue;
    if (key.includes("ENABLED")) {
      if (value !== "true" && value !== "false") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "must be true or false",
        });
      }
    } else if (key.includes("INTERVAL_MS")) {
      if (Number.isNaN(Number(value))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "must be a number",
        });
      }
    }
  }
}

export const coreEnvSchema = coreEnvBaseSchema.superRefine(
  depositReleaseEnvRefinement
);
export type CoreEnv = z.infer<typeof coreEnvSchema>;

export function loadCoreEnv(raw: NodeJS.ProcessEnv = process.env): CoreEnv {
  const parsed = coreEnvSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("❌ Invalid core environment variables:");
    parsed.error.issues.forEach((issue) => {
      const pathArr = (issue.path ?? []) as Array<string | number>;
      const path = pathArr.length ? pathArr.join(".") : "(root)";
      console.error(`  • ${path}: ${issue.message}`);
    });
    throw new Error("Invalid core environment variables");
  }
  return parsed.data;
}

// Lazy proxy; no import-time parse in dev.
let __cachedCoreEnv: CoreEnv | null = null;
export const coreEnv: CoreEnv = new Proxy({} as CoreEnv, {
  get: (_t, prop: string) => {
    if (!__cachedCoreEnv) __cachedCoreEnv = loadCoreEnv();
    return (__cachedCoreEnv as any)[prop];
  },
  has: (_t, prop: string) => {
    if (!__cachedCoreEnv) __cachedCoreEnv = loadCoreEnv();
    return prop in (__cachedCoreEnv as any);
  },
  ownKeys: () => {
    if (!__cachedCoreEnv) __cachedCoreEnv = loadCoreEnv();
    return Reflect.ownKeys(__cachedCoreEnv);
  },
  getOwnPropertyDescriptor: (_t, prop: string | symbol) => {
    if (!__cachedCoreEnv) __cachedCoreEnv = loadCoreEnv();
    return Object.getOwnPropertyDescriptor(__cachedCoreEnv, prop);
  },
}) as CoreEnv;

// Fail fast in prod only (forces a single parse early).
if (isProd) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  coreEnv.NODE_ENV;
}
