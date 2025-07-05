// packages/platform-core/utils/getShopFromPath.ts

/**
 * Return the shop slug from a CMS pathname.
 *
 * Empty path segments are removed before searching for `shop`,
 * ensuring paths with duplicate slashes are handled correctly.
 */
export function getShopFromPath(pathname?: string | null): string | undefined {
  if (!pathname) return undefined;
  const segments = pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("shop");
  return idx >= 0 ? segments[idx + 1] : undefined;
}
