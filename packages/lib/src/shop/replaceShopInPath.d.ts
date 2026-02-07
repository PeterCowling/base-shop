/**
 * Replace the shop slug in a pathname with a new value.
 *
 * Supports both CMS paths like `/cms/shop/<id>` and public paths
 * like `/shops/<id>`. If the pathname does not contain a relevant
 * segment, CMS paths fall back to `/cms/shop/<shop>` while other
 * paths are returned unchanged.
 */
export declare function replaceShopInPath(pathname: string | null | undefined, shop: string): string;
//# sourceMappingURL=replaceShopInPath.d.ts.map