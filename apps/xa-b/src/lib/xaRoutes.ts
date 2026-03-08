function buildHref(pathname: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    search.set(key, value);
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getProductHref(handle: string): string {
  return buildHref("/product", { handle });
}

export function getDesignerHref(handle: string, tab?: string): string {
  return buildHref("/designer", { handle, tab });
}

export function getCollectionHref(handle: string): string {
  return buildHref("/collection", { handle });
}
