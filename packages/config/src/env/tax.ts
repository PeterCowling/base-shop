import { z } from "zod";
import { parseEnv } from "./utils";

export const taxEnvSchema = z.object({
  TAXJAR_KEY: z.string().optional(),
});

export const taxEnv = parseEnv(taxEnvSchema);
export type TaxEnv = z.infer<typeof taxEnvSchema>;
