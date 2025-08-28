import { z } from "zod";

export const themeLibraryEntrySchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    brandColor: z.string(),
    createdBy: z.string(),
    version: z.string(),
    tokens: z.record(z.string()).default({}),
  })
  .strict();

export type ThemeLibraryEntry = z.infer<typeof themeLibraryEntrySchema>;
