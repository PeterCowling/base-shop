"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CART_COOKIE = void 0;
exports.encodeCartCookie = encodeCartCookie;
exports.decodeCartCookie = decodeCartCookie;
exports.asSetCookieHeader = asSetCookieHeader;
/* -------- constants -------- */
exports.CART_COOKIE = "CART_STATE";
var MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/* -------- helpers -------- */
/** Stringify cart → safe cookie/localStorage value */
function encodeCartCookie(state) {
    return encodeURIComponent(JSON.stringify(state));
}
/** Parse cookie string → typed cart (never throws) */
function decodeCartCookie(raw) {
    try {
        return raw ? JSON.parse(decodeURIComponent(raw)) : {};
    }
    catch (_a) {
        return {};
    }
}
/** Builds a Set-Cookie header (used client-side via document.cookie too) */
function asSetCookieHeader(value) {
    return "".concat(exports.CART_COOKIE, "=").concat(value, "; Path=/; Max-Age=").concat(MAX_AGE, "; SameSite=Lax");
}
