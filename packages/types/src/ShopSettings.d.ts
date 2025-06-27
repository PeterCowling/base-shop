import { z } from "zod";
export declare const shopSettingsSchema: z.ZodObject<
  {
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
  },
  "strip",
  z.ZodTypeAny,
  {
    languages?: readonly ("en" | "de" | "it")[];
  },
  {
    languages?: readonly ("en" | "de" | "it")[];
  }
>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map
