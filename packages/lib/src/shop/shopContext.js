export const SHOP_ID_HEADER = "x-shop-id";
export const REQUEST_ID_HEADER = "x-request-id";
function newRequestId() {
    try {
        return crypto.randomUUID();
    }
    catch {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
}
export function getShopIdFromHeaders(headers) {
    const raw = headers.get(SHOP_ID_HEADER);
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
}
export function requireShopIdFromHeaders(headers) {
    const shopId = getShopIdFromHeaders(headers);
    if (!shopId) {
        throw new Error("Missing shop context"); // i18n-exempt -- internal error message
    }
    return shopId;
}
export function getRequestIdFromHeaders(headers) {
    const raw = headers.get(REQUEST_ID_HEADER);
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
}
export function getOrCreateRequestId(headers) {
    return getRequestIdFromHeaders(headers) ?? newRequestId();
}
export function stripSpoofableShopHeaders(headers) {
    const next = new Headers(headers);
    next.delete(SHOP_ID_HEADER);
    return next;
}
