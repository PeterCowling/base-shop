// apps/cms/__tests__/middleware.test.ts
/* eslint-env jest */

import type { JWT } from "next-auth/jwt";
import { middleware } from "../src/middleware";

/* -------------------------------------------------------------------------- */
/* Mock **everything** from `next-auth/jwt` so the real package —which pulls  */
/* in ESM-only `jose`— is never loaded.                                       */
/* -------------------------------------------------------------------------- */
jest.mock("next-auth/jwt", () => ({
  __esModule: true,
  // the tests access only `getToken`
  getToken: jest.fn(),
}));

/** Strongly-typed handle to the mocked getToken */
import { getToken as mockedGetToken } from "next-auth/jwt";
const getToken = mockedGetToken as jest.MockedFunction<
  typeof import("next-auth/jwt").getToken
>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
type MiddlewareRequest = Parameters<typeof middleware>[0];

/** Create a minimal NextRequest look-alike for the middleware */
function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  // Next.js adds a `.clone()` method; we stub it for parity.
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as unknown as MiddlewareRequest;
}

afterEach(() => jest.resetAllMocks());

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */
describe("middleware", () => {
  it("redirects unauthenticated users to /login", async () => {
    getToken.mockResolvedValueOnce(null);

    const req = createRequest("/cms/shop/foo/products");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("rewrites viewers hitting admin routes to /403", async () => {
    const viewerToken = { role: "viewer" } as JWT;
    getToken.mockResolvedValueOnce(viewerToken);

    const req = createRequest("/cms/shop/foo/products/1/edit");
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-rewrite")).toContain("/403");
  });
});
