const ABSOLUTE_URL_PATTERN = /^[A-Za-z][A-Za-z\d+\-.]*:\/\//;

/** Ensure a path or URL does not end with a trailing slash (except root "/"). */
export const ensureNoTrailingSlash = (value: string): string => {
  if (value === "" || value === "/") return "/";

  if (ABSOLUTE_URL_PATTERN.test(value)) {
    try {
      const parsed = new URL(value);
      const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
      return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
    } catch {
      // Fall back to string handling if parsing fails.
    }
  }

  const trimmed = value.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};
