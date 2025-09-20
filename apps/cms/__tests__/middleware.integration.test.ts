// apps/cms/__tests__/middleware.integration.test.ts
/* eslint-env jest */

import type { JWT } from "next-auth/jwt";
import { middleware } from "../src/middleware";
import { __setMockToken, __resetMockToken } from "next-auth/jwt";
import { canRead as mockedCanRead, canWrite as mockedCanWrite } from "@auth/rbac";

/* -------------------------------------------------------------------------- */
/* Mock RBAC helpers so importing middleware doesn't pull in JSON modules.   */
/* -------------------------------------------------------------------------- */
jest.mock("@auth/rbac", () => ({
  __esModule: true,
  canRead: jest.fn(() => true),
  canWrite: jest.fn(() => true),
}));

/* -------------------------------------------------------------------------- */
/* Provide minimal env config to satisfy auth secret lookup.                  */
/* -------------------------------------------------------------------------- */
jest.mock("@acme/config", () => ({
  __esModule: true,
  env: { NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!" },
}));

/* -------------------------------------------------------------------------- */
/* Mock `next-auth/jwt` *completely* so the ESM-only `jose` bundle never      */
/* reaches Jest.  We expose only the symbol(s) our middleware touches.        */
/* -------------------------------------------------------------------------- */
// Use centralized next-auth/jwt mock via moduleNameMapper

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
import { NextResponse } from "next/server";
const redirect = NextResponse.redirect as jest.Mock;
const next = NextResponse.next as jest.Mock;
const rewrite = NextResponse.rewrite as jest.Mock;
const canRead = mockedCanRead as jest.MockedFunction<
  typeof import("@auth/rbac").canRead
>;
const canWrite = mockedCanWrite as jest.MockedFunction<
  typeof import("@auth/rbac").canWrite
>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
afterEach(() => {
  jest.clearAllMocks();
  __resetMockToken();
});

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
    __setMockToken(null);

    const req = createRequest("/cms/shop/foo/products");
    const res = await middleware(req);

    expect(redirect).toHaveBeenCalled();
    const target = redirect.mock.calls[0][0] as URL;
    expect(target.pathname).toBe("/login");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows authenticated requests", async () => {
    __setMockToken({ role: "admin" } as JWT);

    const req = createRequest("/cms/shop/foo/products");
    const res = await middleware(req);

    expect(next).toHaveBeenCalled();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("rewrites to /403 when read access is denied", async () => {
    __setMockToken({ role: "viewer" } as JWT);
    canRead.mockReturnValueOnce(false);

    const req = createRequest("/cms");
    const res = await middleware(req);

    expect(rewrite).toHaveBeenCalled();
    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost/403");
  });

  it("rewrites admin paths to /403?shop=<slug> when write access is denied", async () => {
    __setMockToken({ role: "viewer" } as JWT);
    canWrite.mockReturnValueOnce(false);

    const req = createRequest("/cms/shop/foo/settings");
    const res = await middleware(req);

    expect(rewrite).toHaveBeenCalled();
    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/403?shop=foo"
    );
  });

  it("allows viewers with read access to /cms", async () => {
    __setMockToken({ role: "viewer" } as JWT);
    canRead.mockReturnValueOnce(true);

    const req = createRequest("/cms");
    const res = await middleware(req);

    expect(next).toHaveBeenCalled();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("bypasses auth for Next.js static assets", async () => {
    __setMockToken(null);

    const req = createRequest("/_next/static/chunk.js");
    const res = await middleware(req);

    expect(next).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
