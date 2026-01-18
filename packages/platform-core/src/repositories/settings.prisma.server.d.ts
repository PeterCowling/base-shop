import "server-only";
import type { Settings, SettingsDiffEntry } from "./settings.json.server";
export declare function getShopSettings(shop: string): Promise<Settings>;
export declare function saveShopSettings(shop: string, settings: Settings): Promise<void>;
export declare function diffHistory(shop: string): Promise<SettingsDiffEntry[]>;
export declare const prismaSettingsRepository: {
    getShopSettings: typeof getShopSettings;
    saveShopSettings: typeof saveShopSettings;
    diffHistory: typeof diffHistory;
};
