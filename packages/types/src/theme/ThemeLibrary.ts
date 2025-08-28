import { z } from "zod";

export const themeLibrarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brandColor: z.string(),
    createdBy: z.string(),
    version: z.number().default(1),
    themeDefaults: z.record(z.string()).default({}),
    themeOverrides: z.record(z.string()).default({}),
    themeTokens: z.record(z.string()).default({}),
  })
  .strict();

export type ThemeLibraryEntry = z.infer<typeof themeLibrarySchema>;
