import { z } from "zod";

export const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().optional(),
  PREVIEW_TOKEN_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  OUTPUT_EXPORT: z.coerce.boolean().optional(),
  NEXT_PUBLIC_PHASE: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_SHOP: z.string().optional(),
  NEXT_PUBLIC_SHOP_ID: z.string().optional(),
  CMS_SPACE_URL: z.string().url().optional(),
  CMS_ACCESS_TOKEN: z.string().optional(),
  CHROMATIC_PROJECT_TOKEN: z.string().optional(),
  GMAIL_USER: z.string().optional(),
  GMAIL_PASS: z.string().optional(),
  CF_API_TOKEN: z.string().optional(),
  CF_ZONE_ID: z.string().optional(),
  NEXT_PUBLIC_CF_API_TOKEN: z.string().optional(),
  NEXT_PUBLIC_CF_ZONE_ID: z.string().optional(),
  SHOP_DOMAIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
