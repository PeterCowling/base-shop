import { type z } from "zod";

import { externalDsSchema } from "@acme/types/ds/ExternalDs";

export { externalDsSchema };
export type ExternalDs = z.infer<typeof externalDsSchema>;

export function parseDsPackage(data: unknown): ExternalDs {
  return externalDsSchema.parse(data);
}
