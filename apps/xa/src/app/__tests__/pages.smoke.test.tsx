import fs from "node:fs";
import path from "node:path";

import * as React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react";

import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";

import { XA_BRANDS, XA_PRODUCTS } from "../../lib/demoData";
import { XA_SUBCATEGORIES } from "../../lib/xaCatalog";
import { XA_EDITS } from "../../lib/xaEdits";

const redirectMock = jest.fn();
const notFoundMock = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
  notFound: (...args: unknown[]) => notFoundMock(...args),
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

jest.mock("next/dynamic", () => {
  return (loader: unknown, options?: { loading?: React.ComponentType }) => {
    const Loading = options?.loading;
    return Loading ? (props: Record<string, unknown>) => <Loading {...props} /> : () => null;
  };
});

jest.mock("next/font/google", () => ({
  IBM_Plex_Mono: () => ({ className: "font-mono", variable: "--font-mono" }),
  Work_Sans: () => ({ className: "font-sans", variable: "--font-sans" }),
}));

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@acme/platform-core/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: "base", setTheme: jest.fn() }),
}));

jest.mock("../../lib/search/useXaProductSearch", () => ({
  useXaProductSearch: () => ({ products: [] }),
}));

jest.mock("../access/admin/AdminConsole.client", () => ({
  __esModule: true,
  default: () => <div />,
}));

function catalogMockFactory() {
  const actual = jest.requireActual("../../lib/xaCatalog");
  return {
    ...actual,
    isCategoryAllowed: () => true,
    isDepartmentAllowed: () => true,
  };
}

jest.mock("../../lib/xaCatalog", catalogMockFactory);
jest.mock("../../../lib/xaCatalog", catalogMockFactory, { virtual: true });
jest.mock("../../../../lib/xaCatalog", catalogMockFactory, { virtual: true });

jest.mock("../contexts/XaCartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCart: () => [{}, jest.fn()],
}), { virtual: true });
jest.mock("../../contexts/XaCartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCart: () => [{}, jest.fn()],
}));
jest.mock("../../../contexts/XaCartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCart: () => [{}, jest.fn()],
}), { virtual: true });
jest.mock("../../../../contexts/XaCartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCart: () => [{}, jest.fn()],
}), { virtual: true });

jest.mock("../contexts/XaWishlistContext", () => ({
  WishlistProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWishlist: () => [[], jest.fn()],
}), { virtual: true });
jest.mock("../../contexts/XaWishlistContext", () => ({
  WishlistProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWishlist: () => [[], jest.fn()],
}));
jest.mock("../../../contexts/XaWishlistContext", () => ({
  WishlistProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWishlist: () => [[], jest.fn()],
}), { virtual: true });
jest.mock("../../../../contexts/XaWishlistContext", () => ({
  WishlistProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWishlist: () => [[], jest.fn()],
}), { virtual: true });

const appRoot = path.join(process.cwd(), "src/app");

function listAppFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api") continue;
      out.push(...listAppFiles(fullPath));
      continue;
    }
    if (
      entry.name === "page.tsx" ||
      entry.name === "page.ts" ||
      entry.name === "layout.tsx" ||
      entry.name === "not-found.tsx" ||
      entry.name === "robots.ts"
    ) {
      out.push(fullPath);
    }
  }
  return out;
}

function readFirstLines(filePath: string, count = 3) {
  const content = fs.readFileSync(filePath, "utf-8");
  return content.split(/\r?\n/).slice(0, count).join("\n");
}

function isClientComponent(filePath: string) {
  const header = readFirstLines(filePath, 5);
  return header.includes("\"use client\"") || header.includes("'use client'");
}

function usesPromiseParams(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  return /params:\s*Promise</.test(content);
}

function usesPromiseSearchParams(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  return /searchParams\?:\s*Promise</.test(content) || /searchParams:\s*Promise</.test(content);
}

function buildParams(filePath: string) {
  const segments = filePath
    .slice(appRoot.length)
    .split(path.sep)
    .filter(Boolean);
  const params: Record<string, string> = {};
  for (const segment of segments) {
    if (!segment.startsWith("[") || !segment.endsWith("]")) continue;
    const name = segment.slice(1, -1);
    if (name === "handle") {
      if (filePath.includes(`${path.sep}brands${path.sep}`)) {
        params[name] = XA_BRANDS[0]?.handle ?? "designer";
      } else if (filePath.includes(`${path.sep}products${path.sep}`)) {
        params[name] = XA_PRODUCTS[0]?.slug ?? "product";
      } else {
        params[name] = "all";
      }
    } else if (name === "orderId") {
      params[name] = "order-1";
    } else if (name === "slug") {
      if (filePath.includes(`${path.sep}designer${path.sep}`)) {
        params[name] = XA_BRANDS[0]?.handle ?? "designer";
      } else if (filePath.includes(`${path.sep}edits${path.sep}`)) {
        params[name] = XA_EDITS[0]?.slug ?? "edit";
      } else if (filePath.includes(`${path.sep}products${path.sep}`)) {
        params[name] = XA_PRODUCTS[0]?.slug ?? "product";
      } else {
        params[name] = "slug";
      }
    } else if (name === "type") {
      if (filePath.includes(`${path.sep}bags${path.sep}`)) {
        params[name] = XA_SUBCATEGORIES.bags[0] ?? "tote";
      } else if (filePath.includes(`${path.sep}jewelry${path.sep}`)) {
        params[name] = XA_SUBCATEGORIES.jewelry[0] ?? "necklaces";
      } else {
        params[name] = XA_SUBCATEGORIES.clothing[0] ?? "outerwear";
      }
    } else if (name === "category") {
      params[name] = XA_SUBCATEGORIES.clothing[0] ?? "outerwear";
    } else {
      params[name] = "value";
    }
  }
  return params;
}

const appFiles = listAppFiles(appRoot).sort();

describe("XA pages", () => {
  it.each(appFiles)("loads %s", async (filePath) => {
    redirectMock.mockClear();
    notFoundMock.mockClear();
    const rel = path.relative(appRoot, filePath);
    const module = require(filePath) as { default?: (props?: any) => unknown };
    const Page = module.default;
    expect(Page).toBeDefined();

    if (!Page) return;

    const params = buildParams(filePath);
    const props: Record<string, unknown> = {};
    if (Object.keys(params).length) {
      props.params = usesPromiseParams(filePath) ? Promise.resolve(params) : params;
    }
    if (usesPromiseSearchParams(filePath)) {
      props.searchParams = Promise.resolve({ tab: "new-in" });
    }

    if (rel.endsWith("robots.ts")) {
      const result = (Page as () => unknown)();
      expect(result).toBeTruthy();
      return;
    }

    if (isClientComponent(filePath)) {
      render(<CurrencyProvider>{React.createElement(Page, props)}</CurrencyProvider>);
      return;
    }

    const result = await (Page as (p?: Record<string, unknown>) => Promise<unknown>)(props);
    if (result) {
      const element = result as React.ReactElement;
      if (React.isValidElement(element) && element.type === "html") {
        expect(element).toBeTruthy();
        return;
      }
      render(<CurrencyProvider>{element}</CurrencyProvider>);
    }
  });
});
