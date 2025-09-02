import "@acme/zod-utils/initZod";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const baseSchema = z.object({
  NEXTAUTH_SECRET: isProd
    ? z.string().min(1)
    : z.string().min(1).default("dev-nextauth-secret"),
  PREVIEW_TOKEN_SECRET: z.string().optional(),
  UPGRADE_PREVIEW_TOKEN_SECRET: z.string().optional(),
  SESSION_SECRET: isProd
    ? z.string().min(1)
    : z.string().min(1).default("dev-session-secret"),
  COOKIE_DOMAIN: z.string().optional(),
  LOGIN_RATE_LIMIT_REDIS_URL: z.string().url().optional(),
  LOGIN_RATE_LIMIT_REDIS_TOKEN: z.string().optional(),
  SESSION_STORE: z.enum(["memory", "redis"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export const authEnvSchema = baseSchema.superRefine((env, ctx) => {
  if (env.SESSION_STORE === "redis") {
    if (!env.UPSTASH_REDIS_REST_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPSTASH_REDIS_REST_URL"],
        message:
          "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
      });
    }
    if (!env.UPSTASH_REDIS_REST_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPSTASH_REDIS_REST_TOKEN"],
        message:
          "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
      });
    }
  }

  const hasRateUrl = env.LOGIN_RATE_LIMIT_REDIS_URL;
  const hasRateToken = env.LOGIN_RATE_LIMIT_REDIS_TOKEN;
  if (hasRateUrl || hasRateToken) {
    if (!hasRateUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["LOGIN_RATE_LIMIT_REDIS_URL"],
        message:
          "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
      });
    }
    if (!hasRateToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["LOGIN_RATE_LIMIT_REDIS_TOKEN"],
        message:
          "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
      });
    }
  }
});

const parsed = authEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid auth environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid auth environment variables");
}

export const authEnv = parsed.data;
export type AuthEnv = z.infer<typeof authEnvSchema>;
