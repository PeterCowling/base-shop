import { z } from "zod";

export const themeLibraryEntrySchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    brandColor: z.string(),
    createdBy: z.string(),
    version: z.number().int().nonnegative().default(1),
    tokens: z.record(z.string()).default({}),
  })
  .strict();

export type ThemeLibraryEntry = z.infer<typeof themeLibraryEntrySchema>;
