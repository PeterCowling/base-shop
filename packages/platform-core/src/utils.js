export function getShopFromPath(pathname) {
    const m = pathname.match(/\/shops\/([^/]+)/);
    return m ? m[1] : null;
}
export function replaceShopInPath(pathname, nextShop) {
    return pathname.includes("/shops/") ? pathname.replace(/\/shops\/[^/]+/, `/shops/${nextShop}`) : pathname;
}
export const logger = {
    info: (...a) => console.log(...a),
    warn: (...a) => console.warn(...a),
    error: (...a) => console.error(...a),
    debug: (...a) => console.debug(...a),
};
