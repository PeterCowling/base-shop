import type { getToken as GetTokenFn, JWT } from "next-auth/jwt";
import { middleware } from "../src/middleware";

jest.mock("next-auth/jwt", () => {
  const actual = jest.requireActual(
    "next-auth/jwt"
  ) as typeof import("next-auth/jwt");
  return {
    __esModule: true,
    ...actual,
    getToken: jest.fn(),
  };
});

jest.mock("next/server", () => ({
  __esModule: true,
  NextResponse: {
    redirect: jest.fn(
      (url: URL) =>
        new Response(null, {
          status: 307,
          headers: { location: url.toString() },
        })
    ),
    next: jest.fn(
      () => new Response(null, { headers: { "x-middleware-next": "1" } })
    ),
    rewrite: jest.fn(
      (url: URL, init?: ResponseInit) =>
        new Response(null, {
          status: init?.status ?? 200,
          headers: { "x-middleware-rewrite": url.toString() },
        })
    ),
  },
}));

import { getToken as mockedGetToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const getToken = mockedGetToken as jest.MockedFunction<typeof GetTokenFn>;
const redirect = NextResponse.redirect as jest.Mock;
const next = NextResponse.next as jest.Mock;

afterEach(() => jest.resetAllMocks());

type MiddlewareRequest = Parameters<typeof middleware>[0];
function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as unknown as MiddlewareRequest;
}

describe("middleware integration", () => {
  it("redirects unauthenticated requests to /login", async () => {
    getToken.mockResolvedValueOnce(null);
    const req = createRequest("/cms/shop/foo/products");
    const res = await middleware(req);
    expect(redirect).toHaveBeenCalled();
    const url = redirect.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/login");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows authenticated requests", async () => {
    getToken.mockResolvedValueOnce({ role: "admin" } as JWT);
    const req = createRequest("/cms/shop/foo/products");
    const res = await middleware(req);
    expect(next).toHaveBeenCalled();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
