import { z } from "zod";
import { localeSchema } from "./Product";

export const shopSettingsSchema = z.object({
  languages: z.array(localeSchema),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;
