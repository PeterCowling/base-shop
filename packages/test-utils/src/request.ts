export type JsonRequestInit = RequestInit & { url?: string };

/**
 * Build a standard WHATWG Request with a JSON body and proper headers.
 * Defaults to POST and `http://localhost` unless overridden.
 */
export function jsonRequest(body: unknown, init: JsonRequestInit = {}): Request {
  const url = init.url || "http://localhost";
  const method = init.method || "POST";
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(url, {
    ...init,
    method,
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Minimal NextRequest-like stub for route tests that call `req.json()` and
 * optionally read cookies. Use when the handler signature is `NextRequest`.
 */
export function asNextJson<T extends object>(
  body: T,
  options: { cookies?: Record<string, string>; url?: string; headers?: Record<string, string> } = {}
): any {
  const url = options.url || "http://localhost";
  const headersLower: Record<string, string> = {};
  for (const [k, v] of Object.entries(options.headers || {})) {
    headersLower[k.toLowerCase()] = v;
  }
  return {
    json: async () => body,
    cookies: {
      get: (name: string) =>
        options.cookies && name in options.cookies
          ? { name, value: options.cookies[name] }
          : undefined,
    },
    headers: {
      get: (key: string) => headersLower[key.toLowerCase()] ?? null,
    },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as any;
}
