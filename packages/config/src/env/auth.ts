import "@acme/zod-utils/initZod";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

// Accept plain numeric AUTH_TOKEN_TTL by treating it as seconds.
// This mirrors operational environments where shells may export numeric values.
// Keep test expectations intact by skipping this normalization in NODE_ENV=test.
const rawTTL = process.env.AUTH_TOKEN_TTL;
if (process.env.NODE_ENV !== "test" && rawTTL && /^\d+$/.test(rawTTL)) {
  process.env.AUTH_TOKEN_TTL = `${rawTTL}s`;
}

const ttlRegex = /^\d+(s|m)$/i;
const parseTTL = (val: string) => {
  const num = Number(val.slice(0, -1));
  const unit = val.slice(-1).toLowerCase();
  return unit === "m" ? num * 60 : num;
};

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

  AUTH_PROVIDER: z.enum(["local", "jwt", "oauth"]).default("local"),
  JWT_SECRET: z.string().min(1).optional(),
  OAUTH_CLIENT_ID: z.string().min(1).optional(),
  OAUTH_CLIENT_SECRET: z.string().min(1).optional(),

  AUTH_TOKEN_TTL: z
    .preprocess((v) => (typeof v === "number" ? undefined : v), z.string().optional())
    .default("15m")
    .refine((val) => ttlRegex.test(val), {
      message: "AUTH_TOKEN_TTL must be a string like '60s' or '15m'",
    })
    .transform(parseTTL),
  TOKEN_ALGORITHM: z.enum(["HS256", "RS256"]).default("HS256"),
  TOKEN_AUDIENCE: z.string().default("base-shop"),
  TOKEN_ISSUER: z.string().default("base-shop"),
  ALLOW_GUEST: z.coerce.boolean().default(false),
  ENFORCE_2FA: z.coerce.boolean().default(false),
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

  if (env.AUTH_PROVIDER === "jwt") {
    if (!env.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET is required when AUTH_PROVIDER=jwt",
      });
    }
  }
  if (env.AUTH_PROVIDER === "oauth") {
    if (!env.OAUTH_CLIENT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OAUTH_CLIENT_ID"],
        message: "OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth",
      });
    }
    if (!env.OAUTH_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OAUTH_CLIENT_SECRET"],
        message: "OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth",
      });
    }
  }
});

type ParsedAuthEnv = z.infer<typeof authEnvSchema>;

const parsed = authEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid auth environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid auth environment variables");
}

export type AuthEnv = ParsedAuthEnv & { AUTH_TOKEN_EXPIRES_AT: Date };

export const authEnv: AuthEnv = {
  ...parsed.data,
  AUTH_TOKEN_EXPIRES_AT: new Date(
    Date.now() + parsed.data.AUTH_TOKEN_TTL * 1000,
  ),
};
