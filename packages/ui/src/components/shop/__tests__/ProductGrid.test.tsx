import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductGrid } from "../../organisms/ProductGrid";

jest.mock("../../organisms/ProductCard", () => {
  const React = require("react");
  return {
    __esModule: true,
    ProductCard: ({ product, showImage, showPrice, ctaLabel }: any) => (
      <div data-cy="product-card">
        {product.title}-{String(showImage)}-{String(showPrice)}-{ctaLabel}
      </div>
    ),
  };
});

jest.mock("../../overlays/ProductQuickView", () => {
  const React = require("react");
  return {
    __esModule: true,
    ProductQuickView: ({ product, open }: any) =>
      open ? <div data-cy="quick-view">{product.title}</div> : null,
  };
});

const makeProduct = (id: string) => ({
  id,
  title: `Product ${id}`,
} as any);

describe("ProductGrid", () => {
  it("renders provided products and passes props", () => {
    const products = [makeProduct("1"), makeProduct("2")];
    render(
      <ProductGrid
        products={products}
        columns={2}
        showImage={false}
        showPrice={false}
        ctaLabel="Buy"
      />
    );
    const cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Product 1-false-false-Buy");
  });

  it("renders empty grid when no products", () => {
    render(<ProductGrid products={[]} columns={3} />);
    expect(screen.queryAllByTestId("product-card")).toHaveLength(0);
  });

  it("shows quick view when enabled", async () => {
    const user = userEvent.setup();
    const product = makeProduct("3");
    render(
      <ProductGrid
        products={[product]}
        enableQuickView
      />
    );
    const btn = screen.getByRole("button", {
      name: /quick view product 3/i,
    });
    await user.click(btn);
    expect(screen.getByTestId("quick-view")).toHaveTextContent("Product 3");
  });

  it("hides quick view when disabled", () => {
    const product = makeProduct("4");
    render(<ProductGrid products={[product]} />);
    expect(
      screen.queryByRole("button", {
        name: /quick view/i,
      })
    ).toBeNull();
  });
});
