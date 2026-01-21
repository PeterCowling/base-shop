import React from "react";
import { render, screen } from "@testing-library/react";

import HeaderClient from "../src/components/layout/HeaderClient.client";

// Mutable cart state for mocking useCart
let currentCart: Record<string, { qty: number }> = {};

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [currentCart, jest.fn()],
}));

jest.mock("../src/components/ThemeToggle", () => {
  const ThemeToggle = () => <div data-testid="theme-toggle" />;
  (ThemeToggle as any).displayName = "ThemeToggleMock";
  return ThemeToggle;
});

jest.mock("../src/components/molecules", () => {
  const CurrencySwitcher = () => <div data-testid="currency-switcher" />;
  (CurrencySwitcher as any).displayName = "CurrencySwitcherMock";
  return { CurrencySwitcher };
});

describe("HeaderClient behavior", () => {
  beforeEach(() => {
    currentCart = {};
  });

  it("shows cart quantity badge when items present and updates on cart change", () => {
    const { rerender } = render(
      <HeaderClient lang="en" initialQty={0} nav={[]} />,
    );

    const queryBadge = () => screen.queryByTestId("cart-qty-badge");

    // Initially no badge
    expect(queryBadge()).toBeNull();

    // Add items to cart and rerender to trigger effect
    currentCart = { a: { qty: 2 }, b: { qty: 3 } };
    rerender(<HeaderClient lang="en" initialQty={0} nav={[]} />);

    // Badge shows sum of qty
    expect(screen.getByTestId("cart-qty-badge")).toHaveTextContent("5");

    // Remove items and verify badge disappears
    currentCart = {};
    rerender(<HeaderClient lang="en" initialQty={0} nav={[]} />);
    expect(queryBadge()).toBeNull();
  });
});
