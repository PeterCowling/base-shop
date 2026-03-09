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
