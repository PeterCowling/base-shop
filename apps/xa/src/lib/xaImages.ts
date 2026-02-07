const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_XA_IMAGES_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const DEFAULT_VARIANT =
  (process.env.NEXT_PUBLIC_XA_IMAGES_VARIANT ?? "").trim() || "public";

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+/, "");
}

function hasVariant(path: string): boolean {
  return path.includes("/");
}

export function buildXaImageUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = normalizePath(path);
  if (!normalized) return "";

  // Fallback to serving from Next.js /public when no image CDN is configured.
  if (!IMAGE_BASE_URL) return `/${normalized}`;

  const resolvedPath = hasVariant(normalized)
    ? normalized
    : `${normalized}/${DEFAULT_VARIANT}`;

  return `${IMAGE_BASE_URL}/${resolvedPath}`;
}
