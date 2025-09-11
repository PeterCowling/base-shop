// packages/shared-utils/src/replaceShopInPath.ts

/**
 * Replace the shop slug in a pathname with a new value.
 *
 * Supports both CMS paths like `/cms/shop/<id>` and public paths
 * like `/shops/<id>`. If the pathname does not contain a relevant
 * segment, CMS paths fall back to `/cms/shop/<shop>` while other
 * paths are returned unchanged.
 */
export function replaceShopInPath(
  pathname: string | null | undefined,
  shop: string
): string {
  if (!pathname) return `/cms/shop/${shop}`;

  const hasTrailingSlash = pathname.endsWith("/");
  const [path, q] = pathname.split("?");
  let query = q;
  let trailingSlash = path.endsWith("/");

  if (hasTrailingSlash && !trailingSlash) {
    trailingSlash = true;
    if (query) query = query.replace(/\/$/, "");
  }

  const segments = path.split("/").filter(Boolean);
  const idxShop = segments.indexOf("shop");
  const idxShops = segments.indexOf("shops");

  if (idxShop >= 0) {
    if (idxShop + 1 < segments.length) {
      segments[idxShop + 1] = shop;
    } else {
      segments.push(shop);
    }
    let newPath = "/" + segments.join("/");
    if (trailingSlash) newPath += "/";
    return query ? `${newPath}?${query}` : newPath;
  }

  if (idxShops >= 0) {
    if (idxShops + 1 < segments.length) {
      segments[idxShops + 1] = shop;
    } else {
      segments.push(shop);
    }
    let newPath = "/" + segments.join("/");
    if (trailingSlash) newPath += "/";
    return query ? `${newPath}?${query}` : newPath;
  }

  if (segments[0] === "cms") {
    let base = `/cms/shop/${shop}`;
    if (trailingSlash) base += "/";
    return query ? `${base}?${query}` : base;
  }

  return pathname;
}
