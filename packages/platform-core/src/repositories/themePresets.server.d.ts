import "server-only";

export declare function getThemePresets(shop: string): Promise<Record<string, Record<string, string>>>;
export declare function saveThemePreset(shop: string, name: string, tokens: Record<string, string>): Promise<void>;
export declare function deleteThemePreset(shop: string, name: string): Promise<void>;
