type SimpleReq = { headers?: Record<string, string | undefined>; url?: string };

type HeadersLike = Headers | Record<string, string | undefined>;

/** Create a header getter function from Request or SimpleReq headers */
function createHeaderGetter(headers?: HeadersLike): (name: string) => string | undefined {
  if (typeof (headers as Headers)?.get === "function") {
    return (name: string) => (headers as Headers).get(name) ?? undefined;
  }
  return (name: string) => (headers as Record<string, string | undefined>)?.[name];
}

/** Extract CSRF token from cookie header string */
function extractTokenFromCookies(cookieHeader: string): string | undefined {
  return cookieHeader
    .split(";")
    .map((row: string) => row.trim().split("="))
    .find(
      ([name, value]: string[]) =>
        ["csrf_token", "csrf"].includes(name) &&
        value?.trim() &&
        !value.trim().startsWith("/")
    )?.[1]
    ?.trim();
}

/** Extract CSRF token from server-side request */
function getTokenFromRequest(req: Request | SimpleReq): string | undefined {
  const headers = (req as unknown as { headers?: HeadersLike }).headers;
  const getHeader = createHeaderGetter(headers);

  const headerToken = getHeader("x-csrf-token")?.trim();
  if (headerToken) return headerToken;

  const reqUrl = (req as unknown as { url?: string }).url;
  if (reqUrl) {
    const queryToken = new URL(reqUrl, "http://dummy").searchParams
      .get("csrf_token")
      ?.trim();
    if (queryToken) return queryToken;
  }

  return extractTokenFromCookies(getHeader("cookie") ?? "") || undefined;
}

/** Generate a new CSRF token */
function generateToken(): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID === "function"
  ) {
    return (globalThis as { crypto: { randomUUID: () => string } }).crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

/** Get or create CSRF token from browser document */
function getTokenFromDocument(): string | undefined {
  if (typeof document === "undefined") return undefined;

  let csrfToken =
    document
      // i18n-exempt: DOM selector; not user-facing copy
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content")
      ?.trim() ??
    document.cookie
      .split(";")
      .map((row) => row.trim())
      .find((row) => row.startsWith("csrf_token="))
      ?.split("=")[1]
      ?.trim();

  if (!csrfToken) {
    csrfToken = generateToken();
    // i18n-exempt: cookie attribute string; not user-facing copy
    document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${
      location.protocol === "https:" ? "; secure" : ""
    }`;
  }
  return csrfToken;
}

export function getCsrfToken(req?: Request | SimpleReq): string | undefined {
  if (req) return getTokenFromRequest(req);
  return getTokenFromDocument();
}
