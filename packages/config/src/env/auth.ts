import "@acme/zod-utils/initZod";
import { z } from "zod";

const nodeEnv = process.env.NODE_ENV;
const isTest = nodeEnv === "test";
const nextPhase = process.env.NEXT_PHASE?.toLowerCase();
// Next.js sets NEXT_PHASE=phase-production-build during `next build`.
// Allow development defaults in that phase so the bundle can compile without real secrets.
const isNextProductionBuildPhase = nextPhase === "phase-production-build";
const isProd =
  nodeEnv === "production" && !isTest && !isNextProductionBuildPhase;

// Normalize AUTH_TOKEN_TTL from the process environment so validation succeeds
// even if the shell exported a plain number or included stray whitespace.
// We intentionally skip this in tests to keep existing expectations.
if (!isTest) {
  const rawTTL = process.env.AUTH_TOKEN_TTL;
  if (typeof rawTTL === "string") {
    const trimmed = rawTTL.trim();
    if (trimmed === "") {
      // Treat blank as unset so default applies
      delete process.env.AUTH_TOKEN_TTL;
    } else if (/^\d+$/.test(trimmed)) {
      process.env.AUTH_TOKEN_TTL = `${trimmed}s`;
    } else if (/^(\d+)\s*([sm])$/i.test(trimmed)) {
      const [, num, unit] = trimmed.match(/^(\d+)\s*([sm])$/i)!;
      process.env.AUTH_TOKEN_TTL = `${num}${unit.toLowerCase()}`;
    }
  }
}

const ttlRegex = /^\d+(s|m)$/i;
const parseTTL = (val: string) => {
  const num = Number(val.slice(0, -1));
  const unit = val.slice(-1).toLowerCase();
  return unit === "m" ? num * 60 : num;
};

const printableAscii = /^[\x20-\x7E]+$/;
const strongSecret = z
  .string()
  .min(32, { message: "must be at least 32 characters" })
  .refine((val) => printableAscii.test(val), {
    message: "must contain only printable ASCII characters",
  });

const DEV_NEXTAUTH_SECRET = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";
const DEFAULT_TOKEN_AUDIENCE = "base-shop";
const DEFAULT_TOKEN_ISSUER = "base-shop";

const booleanFromString = z.preprocess((v) => {
  if (typeof v === "string") {
    if (/^(true|1)$/i.test(v)) return true;
    if (/^(false|0)$/i.test(v)) return false;
    return v;
  }
  if (typeof v === "number") {
    if (v === 1) return true;
    if (v === 0) return false;
    return v;
  }
  return v;
}, z.boolean());

const baseSchema = z.object({
  NEXTAUTH_SECRET: isProd
    ? strongSecret
    : strongSecret.default(DEV_NEXTAUTH_SECRET),
  PREVIEW_TOKEN_SECRET: strongSecret.optional(),
  UPGRADE_PREVIEW_TOKEN_SECRET: strongSecret.optional(),
  SESSION_SECRET: isProd
    ? strongSecret
    : strongSecret.default(DEV_SESSION_SECRET),
  COOKIE_DOMAIN: z.string().optional(),
  LOGIN_RATE_LIMIT_REDIS_URL: z.string().url().optional(),
  LOGIN_RATE_LIMIT_REDIS_TOKEN: strongSecret.optional(),
  SESSION_STORE: z.enum(["memory", "redis"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: strongSecret.optional(),

  AUTH_PROVIDER: z.enum(["local", "jwt", "oauth"]).default("local"),
  JWT_SECRET: strongSecret.optional(),
  OAUTH_CLIENT_ID: z.string().min(1).optional(),
  OAUTH_CLIENT_SECRET: strongSecret.optional(),

  AUTH_TOKEN_TTL: z
    .preprocess((v) => (typeof v === "number" ? undefined : v), z.string().optional())
    .default("15m")
    .refine((val) => ttlRegex.test(val), {
      message: "AUTH_TOKEN_TTL must be a string like '60s' or '15m'",
    })
    .transform(parseTTL),
  TOKEN_ALGORITHM: z.enum(["HS256", "RS256"]).default("HS256"),
  TOKEN_AUDIENCE: z.string().min(1).default(DEFAULT_TOKEN_AUDIENCE),
  TOKEN_ISSUER: z.string().min(1).default(DEFAULT_TOKEN_ISSUER),
  ALLOW_GUEST: booleanFromString.default(false),
  ENFORCE_2FA: booleanFromString.default(false),
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

export type AuthEnv = ParsedAuthEnv & { AUTH_TOKEN_EXPIRES_AT: Date };

export function loadAuthEnv(
  raw: NodeJS.ProcessEnv = process.env,
): AuthEnv {
  const parsed = authEnvSchema.safeParse(raw);
  if (!parsed.success) {
    if (!isTest) {
      console.error(
        "❌ Invalid auth environment variables:",
        parsed.error.format(),
      );
    }
    throw new Error("Invalid auth environment variables");
  }
  return {
    ...parsed.data,
    AUTH_TOKEN_EXPIRES_AT: new Date(
      Date.now() + parsed.data.AUTH_TOKEN_TTL * 1000,
    ),
  };
}

export const authEnv = loadAuthEnv();
