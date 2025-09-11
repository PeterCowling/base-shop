/* eslint-env jest */
/* apps/cms/__tests__/middleware.test.ts */

import type { JWT } from "next-auth/jwt";
import { middleware } from "../src/middleware";

/* -------------------------------------------------------------------------- */
/*  Mock `next-auth/jwt` so that ESM‑only `jose` is never imported            */
/* -------------------------------------------------------------------------- */
jest.mock("next-auth/jwt", () => ({
  __esModule: true,
  getToken: jest.fn(),
}));

import { getToken as mockedGetToken } from "next-auth/jwt";
const getToken = mockedGetToken as jest.MockedFunction<
  typeof import("next-auth/jwt").getToken
>;

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

afterEach(() => jest.resetAllMocks());

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("middleware", () => {
  it("redirects unauthenticated users to /login", async () => {
    getToken.mockResolvedValueOnce(null);

    const res = await middleware(createRequest("/cms/shop/foo/products"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/login/i);
  });

  it("rewrites viewers hitting admin routes to /403", async () => {
    getToken.mockResolvedValueOnce({ role: "viewer" } as JWT);

    const res = await middleware(
      createRequest("/cms/shop/foo/products/1/edit")
    );

    expect(res.headers.get("x-middleware-rewrite")).toContain("/403");
  });

  it("allows authorised users through", async () => {
    getToken.mockResolvedValueOnce({ role: "admin" } as JWT);

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
    expect(getToken).not.toHaveBeenCalled();
  });

  it("skips auth logic for static assets", async () => {
    let res = await middleware(createRequest("/favicon.ico"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(getToken).not.toHaveBeenCalled();

    res = await middleware(createRequest("/_next/static/chunk.js"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(getToken).not.toHaveBeenCalled();
  });

  it("rewrites roles without read access to /403 with shop query", async () => {
    getToken.mockResolvedValueOnce({ role: "ghost" } as JWT);

    const res = await middleware(createRequest("/cms/foo/products"));

    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toContain(
      "/403?shop=foo"
    );
  });
});
