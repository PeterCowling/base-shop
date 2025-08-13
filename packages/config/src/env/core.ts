import { z } from "zod";
import { applyFriendlyZodMessages } from "@acme/lib";

export const coreEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string().optional(),
  PREVIEW_TOKEN_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  OUTPUT_EXPORT: z.coerce.boolean().optional(),
  NEXT_PUBLIC_PHASE: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_SHOP: z.string().optional(),
  NEXT_PUBLIC_SHOP_ID: z.string().optional(),
  SHOP_CODE: z.string().optional(),
  CART_COOKIE_SECRET: z.string().min(1),
  CART_TTL: z.coerce.number().optional(),
  CMS_SPACE_URL: z.string().url().optional(),
  CMS_ACCESS_TOKEN: z.string().optional(),
  CHROMATIC_PROJECT_TOKEN: z.string().optional(),
  GMAIL_USER: z.string().optional(),
  GMAIL_PASS: z.string().optional(),
  GA_API_SECRET: z.string().optional(),
  SMTP_URL: z.string().url().optional(),
  CAMPAIGN_FROM: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["sendgrid", "resend", "smtp"]).optional(),
  EMAIL_BATCH_SIZE: z.coerce.number().optional(),
  EMAIL_BATCH_DELAY_MS: z.coerce.number().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SANITY_API_VERSION: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  DEPOSIT_RELEASE_ENABLED: z.coerce.boolean().optional(),
  DEPOSIT_RELEASE_INTERVAL_MS: z.coerce.number().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  LOGIN_RATE_LIMIT_REDIS_URL: z.string().url().optional(),
  LOGIN_RATE_LIMIT_REDIS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  STOCK_ALERT_RECIPIENTS: z.string().optional(),
  STOCK_ALERT_WEBHOOK: z.string().url().optional(),
  STOCK_ALERT_DEFAULT_THRESHOLD: z.coerce.number().optional(),
  STOCK_ALERT_RECIPIENT: z.string().email().optional(),
  SESSION_STORE: z.enum(["memory", "redis"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

applyFriendlyZodMessages();

const parsed = coreEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid core environment variables:", parsed.error.format());
  process.exit(1);
}

export const coreEnv = parsed.data;
export type CoreEnv = z.infer<typeof coreEnvSchema>;
