// apps/cms/__tests__/middleware.integration.test.ts
/* eslint-env jest */

import type { JWT } from "next-auth/jwt";
import { middleware } from "../src/middleware";

/* -------------------------------------------------------------------------- */
/* Mock `next-auth/jwt` *completely* so the ESM-only `jose` bundle never      */
/* reaches Jest.  We expose only the symbol(s) our middleware touches.        */
/* -------------------------------------------------------------------------- */
jest.mock("next-auth/jwt", () => ({
  __esModule: true,
  getToken: jest.fn(),
}));

/* -------------------------------------------------------------------------- */
/* Mock `next/server` with minimal behaviour that our assertions inspect.     */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* Typed handles to the mocked functions                                      */
/* -------------------------------------------------------------------------- */
import { getToken as mockedGetToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const getToken = mockedGetToken as jest.MockedFunction<
  typeof import("next-auth/jwt").getToken
>;
const redirect = NextResponse.redirect as jest.Mock;
const next = NextResponse.next as jest.Mock;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
afterEach(() => jest.clearAllMocks());

type MiddlewareRequest = Parameters<typeof middleware>[0];

function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString()); // match Next.js behaviour
  return { nextUrl: url, url: url.toString() } as unknown as MiddlewareRequest;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */
describe("middleware integration", () => {
  it("redirects unauthenticated requests to /login", async () => {
    getToken.mockResolvedValueOnce(null);

    const req = createRequest("/cms/shop/foo/products");
    const res = await middleware(req);

    expect(redirect).toHaveBeenCalled();
    const target = redirect.mock.calls[0][0] as URL;
    expect(target.pathname).toBe("/login");
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
