import "server-only";

import { type ShopSettings } from "@acme/types";

export type Settings = ShopSettings;
export declare function getShopSettings(shop: string): Promise<Settings>;
export declare function saveShopSettings(shop: string, settings: Settings): Promise<void>;
export interface SettingsDiffEntry {
    timestamp: string;
    diff: Partial<Settings>;
}
export declare function diffHistory(shop: string): Promise<SettingsDiffEntry[]>;
export declare const jsonSettingsRepository: {
    getShopSettings: typeof getShopSettings;
    saveShopSettings: typeof saveShopSettings;
    diffHistory: typeof diffHistory;
};
