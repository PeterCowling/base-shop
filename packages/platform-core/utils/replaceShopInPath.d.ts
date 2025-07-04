/**
 * Replace the shop slug in a CMS pathname with a new value.
 *
 * If the pathname does not contain a shop segment, return
 * `/cms/shop/<shop>` instead.
 */
export declare function replaceShopInPath(pathname: string | null | undefined, shop: string): string;
