import { z } from "zod";
import { coreEnv, coreEnvSchema } from "./core";
import { paymentEnv, paymentEnvSchema } from "./payments";
import { shippingEnv, shippingEnvSchema } from "./shipping";

export const env = { ...coreEnv, ...paymentEnv, ...shippingEnv };

const schemas = {
  payments: paymentEnvSchema,
  shipping: shippingEnvSchema,
} as const;

export type EnvModule = keyof typeof schemas;

export const buildEnvSchema = (modules: EnvModule[] = []) =>
  modules.reduce((acc, m) => acc.merge(schemas[m]), coreEnvSchema);

export const envSchema = buildEnvSchema(["payments", "shipping"]);
export type Env = z.infer<typeof envSchema>;
