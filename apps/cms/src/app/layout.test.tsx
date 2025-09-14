import { render, screen } from "@testing-library/react";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";

// Mock the context providers to expose DOM markers for assertions
jest.mock("@/contexts/CurrencyContext", () => ({
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="currency-provider">{children}</div>
  ),
  useCurrency: () => ["EUR", jest.fn()],
}));

jest.mock("@/contexts/CartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="cart-provider">{children}</div>
  ),
  useCart: () => [{}, jest.fn()],
}));

describe("RootLayout", () => {
  it("applies Geist fonts and wraps children with providers", async () => {
    const { default: RootLayout } = await import("./layout");

    render(
      <RootLayout>
        <span>child content</span>
      </RootLayout>
    );

    // Verify fonts are applied to the html element
    const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
    const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

    expect(document.documentElement).toHaveClass(geistSans.variable);
    expect(document.documentElement).toHaveClass(geistMono.variable);

    // Ensure children are wrapped with CurrencyProvider and CartProvider
    const currency = screen.getByTestId("currency-provider");
    const cart = screen.getByTestId("cart-provider");
    expect(currency).toContainElement(cart);
    expect(cart).toContainElement(screen.getByText("child content"));
  });
});

