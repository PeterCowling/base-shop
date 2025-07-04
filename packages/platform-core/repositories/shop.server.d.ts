import "server-only";
import { type Shop } from "../../types/src";
export declare function getShopById<T extends {
    id: string;
} = Shop>(shop: string): Promise<T>;
export declare function updateShopInRepo<T extends {
    id: string;
} = Shop>(shop: string, patch: Partial<T> & {
    id: string;
}): Promise<T>;
