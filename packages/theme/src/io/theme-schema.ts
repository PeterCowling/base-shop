import { type z } from "zod";

import { themeLibrarySchema } from "@acme/types/theme/ThemeLibrary";

export { themeLibrarySchema };
export type ThemeLibraryEntry = z.infer<typeof themeLibrarySchema>;

export function parseTheme(data: unknown): ThemeLibraryEntry {
  return themeLibrarySchema.parse(data);
}
