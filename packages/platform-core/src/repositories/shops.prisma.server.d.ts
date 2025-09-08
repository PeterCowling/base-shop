import "server-only";
import { type Shop } from "@acme/types";
export declare function applyThemeData(data: Shop): Promise<Shop>;
export declare function readShop(shop: string): Promise<Shop>;
export declare function writeShop(
  shop: string,
  patch: Partial<Shop> & { id: string },
): Promise<Shop>;

