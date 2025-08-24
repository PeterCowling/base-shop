import "server-only";
import { type Shop } from "@acme/types";
export { diffHistory, getShopSettings, saveShopSettings, type SettingsDiffEntry, } from "./settings.server";
export declare function readShop(shop: string): Promise<Shop>;
export declare function writeShop(shop: string, patch: Partial<Shop> & {
    id: string;
}): Promise<Shop>;
