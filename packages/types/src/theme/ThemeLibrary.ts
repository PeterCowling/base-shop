export interface ThemeMetadata {
  name: string;
  brandColor: string;
  createdBy: string;
  version: number;
}

export interface ThemeLibraryEntry extends ThemeMetadata {
  id: string;
  theme: Record<string, unknown>;
}
