"use strict";
// packages/platform-core/src/cartCookie.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__test = exports.cartStateSchema = exports.cartLineSchema = exports.CART_COOKIE = void 0;
exports.encodeCartCookie = encodeCartCookie;
exports.decodeCartCookie = decodeCartCookie;
exports.asSetCookieHeader = asSetCookieHeader;
const core_1 = require("@acme/config/env/core");
const types_1 = require("@acme/types");
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
/* ------------------------------------------------------------------
 * Cookie constants
 * ------------------------------------------------------------------ */
exports.CART_COOKIE = "__Host-CART_ID";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/** Lazy secret accessor to avoid import‑time throws */
let _secret = null;
function getSecret() {
    if (_secret)
        return _secret;
    const { CART_COOKIE_SECRET: secret } = (0, core_1.loadCoreEnv)();
    if (!secret)
        throw new Error("env.CART_COOKIE_SECRET is required"); // i18n-exempt -- CORE-2422: developer-facing error message only
    _secret = secret;
    return _secret; // non‑null assertion to satisfy the string return type
}
/* ------------------------------------------------------------------
 * Zod schemas
 * ------------------------------------------------------------------ */
/** Schema for one cart line */
exports.cartLineSchema = zod_1.z
    .object({
    sku: types_1.skuSchema, // full SKU object
    qty: zod_1.z.number().int().min(0),
    size: zod_1.z.string().optional(),
})
    .strict();
/** Schema for full cart state */
exports.cartStateSchema = zod_1.z.record(zod_1.z.string(), exports.cartLineSchema);
/* ------------------------------------------------------------------
 * Helper functions
 * ------------------------------------------------------------------ */
/** Serialize arbitrary data into a signed cookie value. */
function encodeCartCookie(value) {
    const encoded = Buffer.from(value, "utf8").toString("base64url");
    const sig = crypto_1.default
        .createHmac("sha256", getSecret())
        .update(encoded)
        .digest("hex");
    return `${encoded}.${sig}`;
}
/**
 * Verify and extract the payload from a signed cookie value.
 * Returns `null` when the cookie is missing or invalid.
 */
function decodeCartCookie(raw) {
    if (!raw)
        return null;
    const [encoded, sig] = raw.split(".");
    if (!encoded || !sig)
        return null;
    const expected = crypto_1.default
        .createHmac("sha256", getSecret())
        .update(encoded)
        .digest("hex");
    try {
        if (crypto_1.default.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
            const decoded = Buffer.from(encoded, "base64url").toString("utf8");
            try {
                return JSON.parse(decoded);
            }
            catch {
                return decoded;
            }
        }
    }
    catch {
        /* fall through */
    }
    console.warn("Invalid cart cookie"); // i18n-exempt -- CORE-2422: diagnostic log, not user-facing
    return null;
}
/** Build the Set‑Cookie header value for HTTP responses. */
function asSetCookieHeader(value, maxAge = MAX_AGE, options = {}) {
    const parts = [`${exports.CART_COOKIE}=${value}`, "Path=/"];
    if (maxAge !== null)
        parts.push(`Max-Age=${maxAge}`);
    if (options.domain)
        parts.push(`Domain=${options.domain}`);
    parts.push("SameSite=Lax", "Secure", "HttpOnly");
    return parts.join("; ");
}
/** @internal - exposed for testing */
exports.__test = { getSecret };
