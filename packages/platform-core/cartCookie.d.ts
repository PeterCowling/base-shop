import type { CartState } from "@types";
export declare const CART_COOKIE = "CART_STATE";
/** Stringify cart → safe cookie/localStorage value */
export declare function encodeCartCookie(state: CartState): string;
/** Parse cookie string → typed cart (never throws) */
export declare function decodeCartCookie(raw?: string | null): CartState;
/** Builds a Set-Cookie header (used client-side via document.cookie too) */
export declare function asSetCookieHeader(value: string): string;
