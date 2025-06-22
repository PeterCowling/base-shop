/* -------- constants -------- */
export const CART_COOKIE = "CART_STATE";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/* -------- helpers -------- */
/** Stringify cart → safe cookie/localStorage value */
export function encodeCartCookie(state) {
    return encodeURIComponent(JSON.stringify(state));
}
/** Parse cookie string → typed cart (never throws) */
export function decodeCartCookie(raw) {
    try {
        return raw ? JSON.parse(decodeURIComponent(raw)) : {};
    }
    catch {
        return {};
    }
}
/** Builds a Set-Cookie header (used client-side via document.cookie too) */
export function asSetCookieHeader(value) {
    return `${CART_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}
