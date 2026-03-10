/**
 * Normalizes a catalog image/file path value.
 * - Trims whitespace
 * - Returns empty string for empty input
 * - Passes through absolute HTTP/HTTPS URLs unchanged
 * - Strips leading slashes from relative paths
 */
export const ABSOLUTE_HTTP_URL_RE = /^https?:\/\//i;

export function normalizeCatalogPath(pathValue: string): string {
  const trimmed = pathValue.trim();
  if (!trimmed) return "";
  if (ABSOLUTE_HTTP_URL_RE.test(trimmed)) return trimmed;
  return trimmed.replace(/^\/+/, "");
}
