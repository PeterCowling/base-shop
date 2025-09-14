import { renderToStaticMarkup } from "react-dom/server";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";

// Mock the next/font/google module to provide deterministic font variables
jest.mock("next/font/google", () => ({
  Geist: (opts: { variable: string }) => ({ variable: opts.variable }),
  Geist_Mono: (opts: { variable: string }) => ({ variable: opts.variable }),
}));

// Mock the context providers to expose DOM markers for assertions
jest.mock("@/contexts/CurrencyContext", () => ({
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="currency-provider">{children}</div>
  ),
  useCurrency: () => ["EUR", jest.fn()],
}));

jest.mock("@/contexts/CartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="cart-provider">{children}</div>
  ),
  useCart: () => [{}, jest.fn()],
}));

describe("RootLayout", () => {
  it("applies Geist fonts and wraps children with providers", async () => {
    const { default: RootLayout } = await import("./layout");

    const markup = renderToStaticMarkup(
      <RootLayout>
        <span>child content</span>
      </RootLayout>
    );

    const dom = new DOMParser().parseFromString(markup, "text/html");

    // Verify fonts are applied to the html element
    const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
    const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

    expect(dom.documentElement.classList.contains(geistSans.variable)).toBe(
      true,
    );
    expect(dom.documentElement.classList.contains(geistMono.variable)).toBe(
      true,
    );

    // Ensure children are wrapped with CurrencyProvider and CartProvider
    const currency = dom.querySelector('[data-cy="currency-provider"]');
    const cart = dom.querySelector('[data-cy="cart-provider"]');
    expect(currency?.contains(cart as Node)).toBe(true);
    expect(cart?.textContent).toBe("child content");
  });
});

