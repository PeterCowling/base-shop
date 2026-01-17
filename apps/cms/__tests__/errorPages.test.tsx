import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { __setMockToken, __resetMockToken } from "next-auth/jwt";

const translations = {
  "notFound.title": "404 – Page not found",
  "notFound.desc": "Sorry, the page you are looking for does not exist.",
  "notFound.back": "Back to CMS",
};

const translator = (key: string) =>
  translations[key as keyof typeof translations] ?? key;

const useTranslations = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations,
}));

// Stub Zod initializer to avoid top-level await in CommonJS tests
jest.mock("@acme/zod-utils/initZod", () => ({}));

// Import modules after mocks so Next.js internals aren't executed
import { middleware } from "../src/middleware";
import NotFound from "../src/app/not-found";
// Require instead of ESM import to avoid hoisting issues with jest.mock
const AccessDenied = require("../src/app/403/page").default;

import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

const mockSearch = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

afterEach(() => {
  jest.resetAllMocks();
  __resetMockToken();
});

type MiddlewareRequest = Parameters<typeof middleware>[0];
function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return {
    nextUrl: url,
    url: url.toString(),
    headers: new Headers(),
    cookies: {
      get: () => undefined,
    },
    method: "GET",
  } as unknown as MiddlewareRequest;
}

describe("CMS error pages", () => {
  beforeEach(() => {
    useTranslations.mockResolvedValue(translator);
  });

  it("redirects unauthenticated users to /login", async () => {
    __setMockToken(null);
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

  it("renders the 404 page for missing routes", async () => {
    render(await NotFound());
    expect(screen.getByText(/Page not found/)).toBeInTheDocument();
  });
});
