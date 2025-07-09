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

function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as unknown as MiddlewareRequest;
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

  it("allows through a valid CMS locale when authorised", async () => {
    getToken.mockResolvedValueOnce({ role: "admin" } as JWT);

    const res = await middleware(createRequest("/cms/de"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects invalid CMS case to /login (Next‑Auth flow)", async () => {
    const res = await middleware(createRequest("/CMS/DE"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/login/i);
  });

  it("redirects unknown CMS locale to /login", async () => {
    const res = await middleware(createRequest("/cms/zz"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/login/i);
  });
});
