import { z } from "zod";

export const upgradeComponentSchema = z
  .object({
    file: z.string(),
    componentName: z.string(),
    oldChecksum: z.string(),
    newChecksum: z.string(),
  })
  .strict();

export type UpgradeComponent = z.infer<typeof upgradeComponentSchema>;
