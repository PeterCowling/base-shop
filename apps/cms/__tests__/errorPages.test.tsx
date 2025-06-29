import { render, screen } from "@testing-library/react";

import AccessDenied from "../src/app/403/page";
import { middleware } from "../src/middleware";
import NotFound from "../src/not-found";

jest.mock("next-auth/jwt", () => ({
  __esModule: true,
  getToken: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

import { getToken as mockedGetToken } from "next-auth/jwt";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

// 🔑  Use `typeof mockedGetToken`, no extra import-type alias needed
const getToken = mockedGetToken as jest.MockedFunction<typeof mockedGetToken>;
const mockSearch = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

afterEach(() => jest.resetAllMocks());

type MiddlewareRequest = Parameters<typeof middleware>[0];
function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as unknown as MiddlewareRequest;
}

describe("CMS error pages", () => {
  it("redirects unauthenticated users to /login", async () => {
    getToken.mockResolvedValueOnce(null);
    const req = createRequest("/cms/shop");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("renders the 403 Access denied page", () => {
    mockSearch.mockReturnValue(
      new URLSearchParams() as unknown as ReadonlyURLSearchParams
    );
    render(<AccessDenied />);
    expect(screen.getByText(/403 – Access denied/)).toBeInTheDocument();
    expect(screen.getByText(/Back to catalogue/)).toBeInTheDocument();
  });

  it("renders the 404 page for missing routes", () => {
    render(<NotFound />);
    expect(screen.getByText(/Page not found/)).toBeInTheDocument();
  });
});
