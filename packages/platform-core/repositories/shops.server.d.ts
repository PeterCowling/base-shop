import "server-only";
import { type Shop } from "../../types/src";
export { diffHistory, getShopSettings, saveShopSettings, type SettingsDiffEntry, } from "./settings.server";
export declare function readShop(shop: string): Promise<Shop>;
