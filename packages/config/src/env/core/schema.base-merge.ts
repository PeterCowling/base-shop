import { z } from "zod";
import { authEnvSchema } from "@acme/config/env/auth";
// Avoid importing cms/email modules which parse on import; use schemas directly.
import { cmsEnvSchema } from "../cms.schema.js";
import { emailEnvSchema } from "../email.schema.js";
import { paymentsEnvSchema } from "@acme/config/env/payments";
import { shippingEnvSchema } from "@acme/config/env/shipping";
import { baseEnvSchema } from "./schema.base.js";

const authInner = authEnvSchema.innerType().omit({ AUTH_TOKEN_TTL: true });

export const coreEnvBaseSchema = authInner
  .merge(cmsEnvSchema)
  .merge(emailEnvSchema.innerType())
  .merge(paymentsEnvSchema)
  .merge(shippingEnvSchema.innerType())
  .merge(baseEnvSchema)
  .extend({
    AUTH_TOKEN_TTL: z.union([z.string(), z.number()]).optional(),
  });
