import { z } from "zod";

export const upgradeComponentSchema = z
  .object({
    file: z.string(),
    componentName: z.string(),
    oldChecksum: z.string().nullish(),
    newChecksum: z.string(),
  })
  .strict();

export type UpgradeComponent = z.infer<typeof upgradeComponentSchema>;

export const shopMetadataSchema = z
  .object({
    lastUpgrade: z.string().datetime().optional(),
    componentVersions: z.record(z.string()).optional(),
  })
  .catchall(z.unknown());

export type ShopMetadata = z.infer<typeof shopMetadataSchema>;
