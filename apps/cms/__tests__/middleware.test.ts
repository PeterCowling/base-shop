// packages/platform-core/__tests__/middleware.test.ts
import { jest } from "@jest/globals";
import type { getToken as GetTokenFn } from "next-auth/jwt";
import { middleware } from "../src/middleware";

// ---------------------------------------------------------------------------
// Mock next-auth/jwt
// ---------------------------------------------------------------------------
jest.mock("next-auth/jwt", () => {
  const actual = jest.requireActual(
    "next-auth/jwt"
  ) as typeof import("next-auth/jwt");
  return {
    __esModule: true,
    ...actual,
    getToken: jest.fn(), // we’ll stub per-test
  };
});

// get a strongly-typed handle to the mocked function
const getToken = (await import("next-auth/jwt"))
  .getToken as unknown as jest.MockedFunction<typeof GetTokenFn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createRequest(path: string) {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as any;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
afterEach(() => jest.resetAllMocks());

describe("middleware", () => {
  it("unauthenticated requests are redirected to /login", async () => {
    getToken.mockResolvedValueOnce(null);

    const req = createRequest("/shop/foo/products");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("viewers accessing admin routes are rewritten to /403", async () => {
    getToken.mockResolvedValueOnce({ role: "viewer" } as any);

    const req = createRequest("/shop/foo/products/1/edit");
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-rewrite")).toContain("/403");
  });
});
