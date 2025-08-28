export interface ThemeLibraryEntry {
  id: string;
  name: string;
  brandColor: string;
  createdBy: string;
  version: number;
  tokens: Record<string, string>;
}

export type ThemeLibrary = ThemeLibraryEntry[];
