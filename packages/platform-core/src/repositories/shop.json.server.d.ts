import "server-only";
import { type Shop } from "@acme/types";
export declare function getShopById<T extends Shop>(shop: string): Promise<T>;
export declare function updateShopInRepo<T extends Shop>(shop: string, patch: Partial<T> & {
    id: string;
}): Promise<T>;
export declare const jsonShopRepository: {
    getShopById: typeof getShopById;
    updateShopInRepo: typeof updateShopInRepo;
};
export { getShopById as getShopJson };
