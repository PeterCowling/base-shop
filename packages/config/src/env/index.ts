import { z } from "zod";
import { coreEnvSchema } from "./core";
import { paymentEnvSchema } from "./payments";
import { shippingEnvSchema } from "./shipping";
import { taxEnvSchema } from "./tax";
import { mergeEnvSchemas, parseEnv } from "./utils";

export interface EnvModules {
  payments?: boolean;
  shipping?: boolean;
  tax?: boolean;
}

export function createEnv(modules: EnvModules = {}) {
  const schemas = [coreEnvSchema];
  if (modules.payments) schemas.push(paymentEnvSchema);
  if (modules.shipping) schemas.push(shippingEnvSchema);
  if (modules.tax) schemas.push(taxEnvSchema);
  const schema = mergeEnvSchemas(...schemas);
  const env = parseEnv(schema);
  return { env, envSchema: schema } as const;
}

export const { env, envSchema } = createEnv({
  payments: true,
  shipping: true,
  tax: true,
});

export type Env = z.infer<typeof envSchema>;
export { coreEnv, coreEnvSchema } from "./core";
export { paymentEnv, paymentEnvSchema } from "./payments";
export { shippingEnv, shippingEnvSchema } from "./shipping";
export { taxEnv, taxEnvSchema } from "./tax";
export { mergeEnvSchemas, parseEnv } from "./utils";
