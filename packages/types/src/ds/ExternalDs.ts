import { z } from "zod";

export const externalDsSchema = z
  .object({
    tokens: z.record(z.string()),
  })
  .strict();

export type ExternalDs = z.infer<typeof externalDsSchema>;
