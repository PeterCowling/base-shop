export function buildCanonicalUrl(baseUrl: string, path: string): string {
  if (!baseUrl && !path) return "";
  if (!baseUrl) return path;
  if (!path) return baseUrl.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(path)) {
    try {
      const absolute = new URL(path);
      const urlStr = absolute.toString();
      // Preserve trailing slash (align with server behavior)
      return urlStr;
    } catch {
      return path;
    }
  }

  try {
    const url = new URL(path, baseUrl);
    // Preserve trailing slash (align with server behavior)
    return url.toString();
  } catch {
    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}
