import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/contexts/cart/CartContext";
import type { Product } from "@/types/product";
import { listCochlearfitProducts } from "@/lib/cochlearfitCatalog.server";

const STORAGE_KEY = "cochlearfit:cart";

const CartHarness = () => {
  const { itemCount, subtotal, addItem, setQuantity, removeItem, clear } = useCart();

  return (
    <div>
      <div data-cy="count">{itemCount}</div>
      <div data-cy="subtotal">{subtotal}</div>
      <button type="button" onClick={() => addItem("classic-kids-sand", 2)}>
        Add
      </button>
      <button type="button" onClick={() => setQuantity("classic-kids-sand", 1)}>
        Set
      </button>
      <button type="button" onClick={() => removeItem("classic-kids-sand")}>
        Remove
      </button>
      <button type="button" onClick={clear}>
        Clear
      </button>
    </div>
  );
};

const HydrationHarness = () => {
  const { itemCount } = useCart();
  return <div data-cy="count">{itemCount}</div>;
};

const AddOnMount = () => {
  const { addItem } = useCart();
  useEffect(() => {
    addItem("classic-kids-sand", 1);
  }, [addItem]);
  return null;
};

describe("CartContext", () => {
  let products: Product[] = [];

  beforeAll(async () => {
    products = await listCochlearfitProducts("en");
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("throws when used outside provider", () => {
    const Broken = () => {
      useCart();
      return null;
    };

    expect(() => render(<Broken />)).toThrow("useCart must be used within CartProvider");
  });

  it("hydrates from storage", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [{ variantId: "classic-kids-sand", quantity: 2 }],
      })
    );

    render(
      <CartProvider products={products}>
        <HydrationHarness />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
  });

  it("updates cart totals through actions", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider products={products}>
        <CartHarness />
      </CartProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("6800");

    await user.click(screen.getByRole("button", { name: "Set" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("3400");

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("saves on cart changes", async () => {
    render(
      <CartProvider products={products}>
        <AddOnMount />
      </CartProvider>
    );

    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toContain("classic-kids-sand");
    });
  });
});
