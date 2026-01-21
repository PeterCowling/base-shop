/**
 * Return the shop slug from a CMS pathname or query string.
 *
 * Empty path segments are removed before searching for either `shop` or
 * `shops`, ensuring paths with duplicate slashes are handled correctly. The
 * `?shop=` query parameter takes precedence if present.
 */
export function getShopFromPath(pathname?: string | null): string | undefined {
  if (!pathname) return undefined;

  // Support paths that include a `?shop=` query parameter. We attempt to parse
  // the string as a URL relative to a dummy base so that both absolute and
  // relative paths are handled. If the parameter exists and has a value, return
  // it immediately.
  try {
    const url = new URL(pathname, "http://dummy");
    const slug = url.searchParams.get("shop");
    if (slug) return slug;
    pathname = url.pathname;
  } catch {
    // Ignore URL parsing errors and fall back to the raw pathname.
  }

  const segments = pathname.split("/").filter(Boolean);

  // Check for singular "shop" segment first.
  let idx = segments.indexOf("shop");
  if (idx >= 0) return segments[idx + 1];

  // Also handle paths that use the plural "shops" segment.
  idx = segments.indexOf("shops");
  return idx >= 0 ? segments[idx + 1] : undefined;
}
