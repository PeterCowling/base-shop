/** Ensure a path or URL ends with a trailing slash. */
export const ensureTrailingSlash = (p: string): string =>
  p === "" ? "/" : p === "/" || p.endsWith("/") ? p : `${p}/`;
