import { z } from "zod";
import { applyFriendlyZodMessages } from "@acme/lib";
import { coreEnvSchema } from "./core";
import { paymentEnvSchema } from "./payments";
import { shippingEnvSchema } from "./shipping";

export const mergeEnvSchemas = (
  ...schemas: z.ZodObject<any, any, any, any, any>[]
) => schemas.reduce((acc, s) => acc.merge(s), z.object({}));

export const envSchema = mergeEnvSchemas(
  coreEnvSchema,
  paymentEnvSchema,
  shippingEnvSchema,
);

applyFriendlyZodMessages();

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

export * from "./core";
export * from "./payments";
export * from "./shipping";
