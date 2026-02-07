/**
 * Return the shop slug from a CMS pathname or query string.
 *
 * Empty path segments are removed before searching for either `shop` or
 * `shops`, ensuring paths with duplicate slashes are handled correctly. The
 * `?shop=` query parameter takes precedence if present.
 */
export declare function getShopFromPath(pathname?: string | null): string | undefined;
//# sourceMappingURL=getShopFromPath.d.ts.map