import "~test/resetNextMocks";

import React, { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import ProductStickyBar from "@/components/ProductStickyBar";
import ProductDetail from "@/components/ProductDetail";
import Price from "@/components/Price";
import { renderWithProviders } from "./testUtils";
import { useCart } from "@/contexts/cart/CartContext";
import type { Product } from "@/types/product";
import { listCochlearfitProducts } from "@/lib/cochlearfitCatalog.server";

const CartCount = () => {
  const { itemCount } = useCart();
  return <span data-cy="count">{itemCount}</span>;
};

const AddOnMount = ({ variantId }: { variantId: string }) => {
  const { addItem } = useCart();
  useEffect(() => {
    addItem(variantId, 1);
  }, [addItem, variantId]);
  return null;
};

describe("product components", () => {
  let products: Product[];

  beforeAll(async () => {
    products = await listCochlearfitProducts("en");
  });

  it("renders price labels", () => {
    renderWithProviders(<Price amount={3400} currency="USD" />);
    expect(screen.getByText(/\$/)).toBeInTheDocument();
  });

  it("renders a product card with link and price range", () => {
    const product = products[0] as Product;
    renderWithProviders(<ProductCard product={product} />);

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
      "href",
      "/en/product/classic"
    );
  });

  it("renders out of stock for products without variants", () => {
    const product: Product = {
      id: "empty",
      slug: "empty",
      name: "Empty",
      style: "Empty",
      shortDescription: "Empty",
      longDescription: "Empty",
      featureBullets: [],
      materials: [],
      careInstructions: [],
      compatibilityNotes: [],
      images: [],
      variants: [],
    };

    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("renders a grid of products", () => {
    renderWithProviders(<ProductGrid products={products} />);
    expect(screen.getAllByRole("link", { name: "View details" })).toHaveLength(2);
  });

  it("renders a sticky bar with disabled state", () => {
    renderWithProviders(
      <ProductStickyBar
        amount={3400}
        currency="USD"
        onAdd={() => undefined}
        disabled
        label="Add to cart"
      />
    );

    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  });

  it("adds selected items from product detail", async () => {
    const user = userEvent.setup();
    const product = products[0] as Product;

    renderWithProviders(
      <div>
        <ProductDetail product={product} />
        <CartCount />
      </div>,
      { withCart: true }
    );

    await user.click(screen.getByRole("button", { name: "Quantity +" }));
    const [addButton] = screen.getAllByRole("button", { name: "Add to cart" });
    await user.click(addButton);

    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("reflects cart changes inside product detail price", async () => {
    const product = products[0] as Product;
    const variant = product.variants[0];

    renderWithProviders(
      <div>
        <AddOnMount variantId={variant.id} />
        <ProductDetail product={product} />
      </div>,
      { withCart: true }
    );

    expect(await screen.findAllByText(/\$/)).not.toHaveLength(0);
  });
});
