import os from "os";
import path from "path";
import { z } from "zod";

export const coreEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string(),
  SESSION_SECRET: z.string(),
  CMS_ADMIN_EMAIL: z.string().email(),
  CMS_ADMIN_PASSWORD: z.string(),
  CMS_SPACE_URL: z.string().url(),
  CMS_ACCESS_TOKEN: z.string(),
  SANITY_API_VERSION: z.string(),
  EMAIL_PROVIDER: z.enum(["sendgrid", "resend", "smtp"]).default("smtp"),
  SMTP_URL: z.string().url(),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  DATABASE_URL: z.string(),
  CMS_MEDIA_DIR: z.string(),
  CART_COOKIE_SECRET: z.string(),
  NEXT_PUBLIC_DEFAULT_SHOP: z.string(),
  NEXT_PUBLIC_SHOP_ID: z.string(),
});

export const coreEnvBaseSchema = coreEnvSchema;

const tmp = os.tmpdir();
const defaults = {
  NEXTAUTH_SECRET: "test-secret",
  SESSION_SECRET: "test-session-secret",
  CMS_ADMIN_EMAIL: "admin@example.com",
  CMS_ADMIN_PASSWORD: "password",
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "test-token",
  SANITY_API_VERSION: "2021-10-21",
  EMAIL_PROVIDER: "smtp" as const,
  SMTP_URL: "smtp://localhost:2525",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  CMS_MEDIA_DIR: path.join(tmp, "cms-media"),
  CART_COOKIE_SECRET: "cart-secret",
  NEXT_PUBLIC_DEFAULT_SHOP: "shop",
  NEXT_PUBLIC_SHOP_ID: "shop",
};

export const coreEnv = coreEnvSchema.parse(defaults);
export type CoreEnv = typeof coreEnv;
