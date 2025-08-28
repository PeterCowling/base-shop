/* eslint-env jest */

import type { JWT } from "next-auth/jwt";
import { middleware } from "../middleware";

// Mock RBAC helpers to control permission checks
jest.mock("@auth/rbac", () => ({
  __esModule: true,
  canRead: jest.fn(() => true),
  canWrite: jest.fn(() => true),
}));

// Minimal env config for auth secret
jest.mock("@acme/config", () => ({
  __esModule: true,
  env: { NEXTAUTH_SECRET: "test" },
}));

// Mock next-auth token retrieval
jest.mock("next-auth/jwt", () => ({
  __esModule: true,
  getToken: jest.fn(),
}));

// Mock Next.js middleware helpers
jest.mock("next/server", () => ({
  __esModule: true,
  NextResponse: {
    redirect: jest.fn((url: URL) =>
      new Response(null, { status: 307, headers: { location: url.toString() } })
    ),
    next: jest.fn(() =>
      new Response(null, { headers: { "x-middleware-next": "1" } })
    ),
    rewrite: jest.fn((url: URL, init?: ResponseInit) =>
      new Response(null, {
        status: init?.status ?? 200,
        headers: { "x-middleware-rewrite": url.toString() },
      })
    ),
  },
}));

import { getToken as mockedGetToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { render, screen } from "@testing-library/react";

const getToken = mockedGetToken as jest.MockedFunction<
  typeof import("next-auth/jwt").getToken
>;
const redirect = NextResponse.redirect as jest.Mock;
const next = NextResponse.next as jest.Mock;
const rewrite = NextResponse.rewrite as jest.Mock;

function createRequest(path: string) {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as unknown as Parameters<
    typeof middleware
  >[0];
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("/cms access", () => {
  it("redirects unauthenticated requests to /login", async () => {
    getToken.mockResolvedValueOnce(null);

    const res = await middleware(createRequest("/cms"));

    expect(redirect).toHaveBeenCalled();
    const target = redirect.mock.calls[0][0] as URL;
    expect(target.pathname).toBe("/login");
    expect(res.status).toBe(307);
  });

  it("allows authenticated users to view shop list", async () => {
    getToken.mockResolvedValueOnce({ role: "admin" } as JWT);

    const res = await middleware(createRequest("/cms"));
    expect(next).toHaveBeenCalled();
    expect(res.headers.get("x-middleware-next")).toBe("1");

    jest.doMock("../lib/listShops", () => ({
      listShops: jest.fn().mockResolvedValue(["alpha", "beta"]),
    }));
    const ShopIndexPage = (await import("../app/cms/shop/page")).default;
    const ui = await ShopIndexPage();
    render(ui);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("returns 403 for roles without read access", async () => {
    const { canRead } = (await import("@auth/rbac")) as {
      canRead: jest.Mock;
      canWrite: jest.Mock;
    };
    canRead.mockReturnValueOnce(false);
    getToken.mockResolvedValueOnce({ role: "stranger" } as JWT);

    const res = await middleware(createRequest("/cms"));

    expect(rewrite).toHaveBeenCalled();
    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toContain("/403");
  });
});

