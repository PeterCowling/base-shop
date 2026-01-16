import "~test/resetNextMocks";

import React, { useEffect } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CartContents from "@/components/cart/CartContents";
import CartSummary from "@/components/cart/CartSummary";
import CartItemRow from "@/components/cart/CartItemRow";
import CartIconButton from "@/components/CartIconButton";
import { useCart } from "@/contexts/cart/CartContext";
import type { Product } from "@/types/product";
import { getVariantById } from "@/lib/catalog";
import { listCochlearfitProducts } from "@/lib/cochlearfitCatalog.server";
import { renderWithProviders } from "./testUtils";

const AddItemOnMount = ({ variantId, quantity }: { variantId: string; quantity: number }) => {
  const { addItem } = useCart();
  useEffect(() => {
    addItem(variantId, quantity);
  }, [addItem, quantity, variantId]);
  return null;
};

const CartRowHarness = ({ products }: { products: Product[] }) => {
  const { items, addItem } = useCart();

  useEffect(() => {
    addItem("classic-kids-sand", 1);
  }, [addItem]);

  const item = items[0];
  if (!item) return null;

  const product = products.find((p) => p.slug === "classic");
  const variant = getVariantById(products, item.variantId);
  if (!product || !variant) return null;

  return <CartItemRow item={item} product={product} variant={variant} />;
};

describe("cart components", () => {
  let products: Product[];

  beforeAll(async () => {
    products = await listCochlearfitProducts("en");
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders empty cart state", () => {
    renderWithProviders(<CartContents products={products} />, { withCart: true });
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the shop" })).toHaveAttribute(
      "href",
      "/en/shop"
    );
  });

  it("renders cart items and summary", async () => {
    renderWithProviders(
      <div>
        <AddItemOnMount variantId="classic-kids-sand" quantity={2} />
        <CartContents products={products} />
      </div>,
      { withCart: true }
    );

    expect(await screen.findByText("Classic Secure")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("disables checkout when cart is empty", () => {
    renderWithProviders(<CartSummary />, { withCart: true });
    const link = screen.getByRole("link", { name: "Proceed to checkout" });
    expect(link).toHaveAttribute("aria-disabled", "true");
  });

  it("shows cart icon count when items exist", async () => {
    renderWithProviders(
      <div>
        <AddItemOnMount variantId="classic-kids-sand" quantity={3} />
        <CartIconButton />
      </div>,
      { withCart: true }
    );

    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("updates quantity and removes items", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <div>
        <CartRowHarness products={products} />
      </div>,
      { withCart: true }
    );

    const row = await screen.findByText("Classic Secure");
    const container = row.closest(".surface");
    if (!container) throw new Error("Row container missing");
    const scoped = within(container);

    await user.click(scoped.getByRole("button", { name: "Quantity +" }));
    expect(scoped.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Classic Secure")).not.toBeInTheDocument();
  });
});
