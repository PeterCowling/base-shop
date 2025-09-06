import React from "react";
import { render, screen } from "@testing-library/react";

describe("Price", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("uses explicit currency prop over context", async () => {
    jest.doMock("../src/contexts/CurrencyContext", () => ({
      __esModule: true,
      useCurrency: () => ["EUR", () => {}],
      CurrencyProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
      ),
    }));
    const { Price } = await import("../src/components/shop/ProductCard");
    const { CurrencyProvider } = await import(
      "../src/contexts/CurrencyContext"
    );
    render(
      <CurrencyProvider>
        <Price amount={1000} currency="USD" />
      </CurrencyProvider>,
    );
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
  });

  it("falls back to context when currency prop missing", async () => {
    jest.doMock("../src/contexts/CurrencyContext", () => ({
      __esModule: true,
      useCurrency: () => ["EUR", () => {}],
      CurrencyProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
      ),
    }));
    const { Price } = await import("../src/components/shop/ProductCard");
    const { CurrencyProvider } = await import(
      "../src/contexts/CurrencyContext"
    );
    render(
      <CurrencyProvider>
        <Price amount={1000} />
      </CurrencyProvider>,
    );
    expect(screen.getByText("€1,000.00")).toBeInTheDocument();
  });

  it("defaults to EUR when no context is provided", async () => {
    jest.doMock("../src/contexts/CurrencyContext", () => ({
      __esModule: true,
      useCurrency: () => [undefined, () => {}],
      CurrencyProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
      ),
    }));
    const { Price } = await import("../src/components/shop/ProductCard");
    render(<Price amount={500} />);
    expect(screen.getByText("€500.00")).toBeInTheDocument();
  });
});

