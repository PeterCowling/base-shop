const CONTRACT_ROUTE_ROOT_SEGMENTS = new Set(["catalog", "drafts", "deploy", "upload"]);

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function resolveContractRoot(baseUrl: string): URL {
  const base = new URL(ensureTrailingSlash(baseUrl));
  const segments = base.pathname.split("/").filter(Boolean);
  const routeRootIndex = segments.findIndex((segment) => CONTRACT_ROUTE_ROOT_SEGMENTS.has(segment));
  const rootSegments = routeRootIndex < 0 ? segments : segments.slice(0, routeRootIndex);
  base.pathname = rootSegments.length > 0 ? `/${rootSegments.join("/")}/` : "/";
  base.search = "";
  base.hash = "";
  return base;
}

/**
 * Build a full contract URL from a pathname segment.
 * Reads `XA_CATALOG_CONTRACT_BASE_URL` from process.env, resolves the contract
 * root, and appends the given pathname.
 *
 * Throws via the supplied `onError` callback when the base URL is missing or
 * invalid, so callers can raise their own domain-specific error types.
 */
export function buildCatalogContractUrl(
  pathname: string,
  onError: (reason: "missing" | "invalid") => Error,
): string {
  const baseUrl = (process.env.XA_CATALOG_CONTRACT_BASE_URL ?? "").trim();
  if (!baseUrl) {
    throw onError("missing");
  }
  let root: URL;
  try {
    root = resolveContractRoot(baseUrl);
  } catch {
    throw onError("invalid");
  }
  return new URL(pathname, root).toString();
}
