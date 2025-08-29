import "@acme/zod-utils/initZod";
import { z } from "zod";
import { authEnvSchema } from "./auth";
import { cmsEnvSchema } from "./cms";
import { emailEnvSchema } from "./email";

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
      .refine((v) => !Number.isNaN(Number(v)), {
        message: "must be a number",
      })
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
      .refine((v) => !Number.isNaN(Number(v)), {
        message: "must be a number",
      })
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
      .refine((v) => !Number.isNaN(Number(v)), {
        message: "must be a number",
      })
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

export const coreEnvBaseSchema = authEnvSchema
  .merge(cmsEnvSchema)
  .merge(emailEnvSchema)
  .merge(baseEnvSchema);

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

const parsed = coreEnvSchema.safeParse(process.env);
// When validation fails, provide a detailed, human-readable report of each
// invalid variable.  The default `ZodError.format()` returns a nested object
// which logs as `[object Object]`, making it hard to identify the culprit.
// To improve visibility, iterate over `parsed.error.issues` and output the
// path and message for every issue.  The "(root)" label is used when no
// specific path is provided.
if (!parsed.success) {
  console.error("❌ Invalid core environment variables:");
  parsed.error.issues.forEach((issue: z.ZodIssue) => {
    const path =
      issue.path && issue.path.length > 0 ? issue.path.join(".") : "(root)";
    console.error(`  • ${path}: ${issue.message}`);
  });
  // Uncomment the next line to log the full formatted error object for debugging:
  // console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid core environment variables");
}

export const coreEnv = parsed.data;
export type CoreEnv = z.infer<typeof coreEnvSchema>;
