import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";

import { Price } from "../Price";

const MockCurrencyContext = React.createContext<[
  Currency,
  () => void,
]>(["EUR", jest.fn()]);

function MockCurrencyProvider({
  currency,
  children,
}: {
  currency: Currency;
  children: React.ReactNode;
}) {
  const value = React.useMemo<[Currency, () => void]>(() => [currency, jest.fn()], [currency]);
  return <MockCurrencyContext.Provider value={value}>{children}</MockCurrencyContext.Provider>;
}

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => React.useContext(MockCurrencyContext),
}));

describe("Price", () => {
  it("uses context currency when no currency prop provided", () => {
    const { container } = render(
      <MockCurrencyProvider currency="EUR">
        <Price amount={1234.56} />
      </MockCurrencyProvider>,
    );
    expect(screen.getByText("€1,234.56")).toBeInTheDocument();
  });

  it("overrides context currency with explicit prop", () => {
    render(
      <MockCurrencyProvider currency="EUR">
        <Price amount={1234.56} currency="USD" />
      </MockCurrencyProvider>,
    );
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });
});
