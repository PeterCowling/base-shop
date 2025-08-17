import "@acme/zod-utils/initZod";
import { z } from "zod";
import { coreEnvBaseSchema, depositReleaseEnvRefinement, } from "./core";
import { paymentEnvSchema } from "./payments";
import { shippingEnvSchema } from "./shipping";
export const mergeEnvSchemas = (...schemas) => schemas.reduce((acc, s) => acc.merge(s), z.object({}));
const mergedEnvSchema = mergeEnvSchemas(coreEnvBaseSchema, paymentEnvSchema, shippingEnvSchema);
export const envSchema = mergedEnvSchema.superRefine(depositReleaseEnvRefinement);
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
}
export const env = parsed.data;
export * from "./core";
export * from "./payments";
export * from "./shipping";
