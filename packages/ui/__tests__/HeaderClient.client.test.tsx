import { render, screen } from "@testing-library/react";
import React from "react";
import HeaderClient from "../src/components/layout/HeaderClient.client";

// Mutable cart state for mocking useCart
let currentCart: Record<string, { qty: number }> = {};

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [currentCart, jest.fn()],
}));

jest.mock("../src/components/ThemeToggle", () => () => (
  <div data-testid="theme-toggle" />
));

jest.mock("../src/components/molecules", () => ({
  CurrencySwitcher: () => <div data-testid="currency-switcher" />,
}));

describe("HeaderClient behavior", () => {
  beforeEach(() => {
    currentCart = {};
  });

  it("shows cart quantity badge when items present and updates on cart change", () => {
    const { rerender } = render(
      <HeaderClient lang="en" initialQty={0} nav={[]} />,
    );

    // Initially no badge
    expect(screen.queryByText(/^\s*\d+\s*$/)).toBeNull();

    // Add items to cart and rerender to trigger effect
    currentCart = { a: { qty: 2 }, b: { qty: 3 } };
    rerender(<HeaderClient lang="en" initialQty={0} nav={[]} />);

    // Badge shows sum of qty
    expect(screen.getByText("5")).toBeInTheDocument();

    // Remove items and verify badge disappears
    currentCart = {};
    rerender(<HeaderClient lang="en" initialQty={0} nav={[]} />);
    expect(screen.queryByText("5")).toBeNull();
  });
});

