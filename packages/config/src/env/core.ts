// packages/config/src/env/core.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import { authEnvSchema } from "./auth.js";
import { cmsEnvSchema } from "./cms.schema.js";
import { emailEnvSchema } from "./email.js";
import { paymentsEnvSchema } from "./payments.js";
import { shippingEnvSchema } from "./shipping.js";
import {
  depositReleaseEnvSchema,
  depositReleaseEnvRefinement,
} from "./depositRelease.js";
import {
  reverseLogisticsEnvSchema,
  reverseLogisticsEnvRefinement,
} from "./reverseLogistics.js";
import { lateFeeEnvSchema, lateFeeEnvRefinement } from "./lateFee.js";
import { getCoreEnv, parseCoreEnv, requireEnv } from "./utils.js";
import { createRequire } from "module";

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
    OPENAI_API_KEY: z.string().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    STOCK_ALERT_RECIPIENTS: z.string().optional(),
    STOCK_ALERT_WEBHOOK: z.string().url().optional(),
    STOCK_ALERT_DEFAULT_THRESHOLD: z.coerce.number().optional(),
    STOCK_ALERT_RECIPIENT: z.string().email().optional(),
  })
  .passthrough();

const authInner = authEnvSchema.innerType().omit({ AUTH_TOKEN_TTL: true });

export const coreEnvBaseSchema = authInner
  .merge(cmsEnvSchema)
  .merge(emailEnvSchema.innerType())
  .merge(paymentsEnvSchema)
  .merge(shippingEnvSchema.innerType())
  .merge(depositReleaseEnvSchema)
  .merge(reverseLogisticsEnvSchema)
  .merge(lateFeeEnvSchema)
  .merge(baseEnvSchema)
  .extend({
    AUTH_TOKEN_TTL: z.union([z.string(), z.number()]).optional(),
  });

export const coreEnvSchema = coreEnvBaseSchema.superRefine((env, ctx) => {
  depositReleaseEnvRefinement(env, ctx);
  reverseLogisticsEnvRefinement(env, ctx);
  lateFeeEnvRefinement(env, ctx);

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

export function loadCoreEnv(raw: NodeJS.ProcessEnv = process.env): CoreEnv {
  return parseCoreEnv(coreEnvSchema, raw);
}

export const coreEnv: CoreEnv = new Proxy({} as CoreEnv, {
  get: (_t, prop: string) => {
    return getCoreEnv(coreEnvSchema)[prop as keyof CoreEnv];
  },
  has: (_t, prop: string) => {
    return prop in getCoreEnv(coreEnvSchema);
  },
  ownKeys: () => {
    return Reflect.ownKeys(getCoreEnv(coreEnvSchema));
  },
  getOwnPropertyDescriptor: (_t, prop: string | symbol) => {
    return Object.getOwnPropertyDescriptor(getCoreEnv(coreEnvSchema), prop);
  },
}) as CoreEnv;

// Fail fast in prod only (forces a single parse early).
if (isProd && !process.env.JEST_WORKER_ID) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  coreEnv.NODE_ENV;
}

export { requireEnv };
