/* eslint-env jest */
/* apps/cms/__tests__/middleware.test.ts */

import type { JWT } from "next-auth/jwt";
import { middleware } from "../src/middleware";
import { __setMockToken, __resetMockToken } from "next-auth/jwt";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
type MiddlewareRequest = Parameters<typeof middleware>[0];

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

function createRequest(
  path: string,
  { method = "GET", headers = {}, cookies = {} }: RequestOptions = {}
): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return {
    nextUrl: url,
    url: url.toString(),
    method,
    headers: new Headers(headers),
    cookies: {
      get(name: string) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  } as unknown as MiddlewareRequest;
}

afterEach(() => {
  jest.resetAllMocks();
  __resetMockToken();
});

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("middleware", () => {
  it("redirects unauthenticated users to /login", async () => {
    __setMockToken(null);

    const res = await middleware(createRequest("/cms/shop/foo/products"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/login/i);
  });

  it("rewrites viewers hitting admin routes to /403", async () => {
    __setMockToken({ role: "viewer" } as JWT);

    const res = await middleware(
      createRequest("/cms/shop/foo/products/1/edit")
    );

    expect(res.headers.get("x-middleware-rewrite")).toContain("/403");
  });

  it("allows authorised users through", async () => {
    __setMockToken({ role: "admin" } as JWT);

    const res = await middleware(createRequest("/cms/shop/foo/products"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects mutating API requests without CSRF tokens", async () => {
    const res = await middleware(
      createRequest("/api/test", { method: "POST" })
    );
    expect(res.status).toBe(403);
  });

  it("allows mutating API requests with matching CSRF tokens", async () => {
    const res = await middleware(
      createRequest("/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "token" },
        cookies: { csrf_token: "token" },
      })
    );
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("bypasses CSRF for API GET requests", async () => {
    const res = await middleware(createRequest("/api/test"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("skips auth logic for static assets", async () => {
    let res = await middleware(createRequest("/favicon.ico"));
    expect(res.headers.get("x-middleware-next")).toBe("1");

    res = await middleware(createRequest("/_next/static/chunk.js"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("rewrites roles without read access to /403 with shop query", async () => {
    __setMockToken({ role: "ghost" } as JWT);

    const res = await middleware(createRequest("/cms/foo/products"));

    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toContain(
      "/403?shop=foo"
    );
  });
});
