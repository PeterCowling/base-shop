import "server-only";
import { type ShopSettings } from "../../types/src";
export declare function getShopSettings(shop: string): Promise<ShopSettings>;
export declare function saveShopSettings(shop: string, settings: ShopSettings): Promise<void>;
export interface SettingsDiffEntry {
    timestamp: string;
    diff: Partial<ShopSettings>;
}
export declare function diffHistory(shop: string): Promise<SettingsDiffEntry[]>;
