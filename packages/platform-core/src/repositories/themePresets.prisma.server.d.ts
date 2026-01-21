import "server-only";

export declare const prismaThemePresetRepository: {
  getThemePresets(shop: string): Promise<Record<string, Record<string, string>>>;
  saveThemePreset(
    shop: string,
    name: string,
    tokens: Record<string, string>,
  ): Promise<void>;
  deleteThemePreset(shop: string, name: string): Promise<void>;
};
