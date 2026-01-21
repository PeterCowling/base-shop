import type { EnvLabel } from "../context/types";
export declare const SHOP_ID_HEADER = "x-shop-id";
export declare const REQUEST_ID_HEADER = "x-request-id";
export type ShopContext = {
    shopId: string;
    requestId: string;
    environment: EnvLabel;
    host?: string;
    canonicalHost?: string;
    runtimeId?: string;
};
export declare function getShopIdFromHeaders(headers: Headers): string | undefined;
export declare function requireShopIdFromHeaders(headers: Headers): string;
export declare function getRequestIdFromHeaders(headers: Headers): string | undefined;
export declare function getOrCreateRequestId(headers: Headers): string;
export declare function stripSpoofableShopHeaders(headers: Headers): Headers;
//# sourceMappingURL=shopContext.d.ts.map