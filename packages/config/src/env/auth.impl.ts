import "@acme/zod-utils/initZod";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

export const authEnvSchema = z.object({
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
