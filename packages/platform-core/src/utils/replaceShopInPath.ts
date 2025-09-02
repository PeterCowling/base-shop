// packages/platform-core/utils/replaceShopInPath.ts

/**
 * Replace the shop slug in a CMS pathname with a new value.
 *
 * If the pathname does not contain a shop segment, the original
 * pathname is returned. When no pathname is provided, a default
 * `/cms/shop/<shop>` path is generated.
 */
export function replaceShopInPath(
  pathname: string | null | undefined,
  shop: string
): string {
  if (!pathname) return `/cms/shop/${shop}`;
  const segments = pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("shop");
  if (idx >= 0) {
    if (idx + 1 < segments.length) {
      segments[idx + 1] = shop;
    } else {
      segments.push(shop);
    }
    return "/" + segments.join("/");
  }
  return pathname;
}
