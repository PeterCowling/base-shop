import { z } from "zod";
import { mergeEnvSchemas, parseEnv } from "./utils";
import { coreEnvSchema, coreEnv } from "./core";
import { paymentEnvSchema, paymentEnv } from "./payments";
import { shippingEnvSchema, shippingEnv } from "./shipping";

export { mergeEnvSchemas } from "./utils";
export { coreEnv, coreEnvSchema } from "./core";
export { paymentEnv, paymentEnvSchema } from "./payments";
export { shippingEnv, shippingEnvSchema } from "./shipping";

export const envSchema = mergeEnvSchemas(
  coreEnvSchema,
  paymentEnvSchema,
  shippingEnvSchema
);

export const env = parseEnv(envSchema);
export type Env = z.infer<typeof envSchema>;
