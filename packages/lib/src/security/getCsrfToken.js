/** Create a header getter function from Request or SimpleReq headers */
function createHeaderGetter(headers) {
    if (typeof headers?.get === "function") {
        return (name) => headers.get(name) ?? undefined;
    }
    return (name) => headers?.[name];
}
/** Extract CSRF token from cookie header string */
function extractTokenFromCookies(cookieHeader) {
    return cookieHeader
        .split(";")
        .map((row) => row.trim().split("="))
        .find(([name, value]) => ["csrf_token", "csrf"].includes(name) &&
        value?.trim() &&
        !value.trim().startsWith("/"))?.[1]
        ?.trim();
}
/** Extract CSRF token from server-side request */
function getTokenFromRequest(req) {
    const headers = req.headers;
    const getHeader = createHeaderGetter(headers);
    const headerToken = getHeader("x-csrf-token")?.trim();
    if (headerToken)
        return headerToken;
    const reqUrl = req.url;
    if (reqUrl) {
        const queryToken = new URL(reqUrl, "http://dummy").searchParams
            .get("csrf_token")
            ?.trim();
        if (queryToken)
            return queryToken;
    }
    return extractTokenFromCookies(getHeader("cookie") ?? "") || undefined;
}
/** Generate a new CSRF token */
function generateToken() {
    if (typeof globalThis !== "undefined" &&
        typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}
/** Get or create CSRF token from browser document */
function getTokenFromDocument() {
    if (typeof document === "undefined")
        return undefined;
    let csrfToken = document
        // i18n-exempt: DOM selector; not user-facing copy
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content")
        ?.trim() ??
        document.cookie
            .split(";")
            .map((row) => row.trim())
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1]
            ?.trim();
    if (!csrfToken) {
        csrfToken = generateToken();
        // i18n-exempt: cookie attribute string; not user-facing copy
        document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${location.protocol === "https:" ? "; secure" : ""}`;
    }
    return csrfToken;
}
export function getCsrfToken(req) {
    if (req)
        return getTokenFromRequest(req);
    return getTokenFromDocument();
}
