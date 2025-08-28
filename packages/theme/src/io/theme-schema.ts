import { z } from "zod";

export const themeMetadataSchema = z.object({
  name: z.string().min(1),
  brandColor: z.string().min(1),
  createdBy: z.string().min(1),
  version: z.number().int().min(1),
});

export const themeLibraryEntrySchema = themeMetadataSchema.extend({
  id: z.string().min(1),
  theme: z.record(z.any()),
});

export type ThemeLibraryEntry = z.infer<typeof themeLibraryEntrySchema>;

export function parseThemeLibraryEntry(data: unknown): ThemeLibraryEntry {
  return themeLibraryEntrySchema.parse(data);
}
