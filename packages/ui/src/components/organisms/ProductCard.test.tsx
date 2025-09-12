import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SKU } from "@acme/types";
import { ProductCard } from "./ProductCard";
import "@testing-library/jest-dom";
import "../../../../../test/resetNextMocks";

const dispatch = jest.fn();
jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));
jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, dispatch],
}));

describe("ProductCard interactions", () => {
  const product: SKU = {
    id: "1",
    slug: "test-product",
    title: "Test Product",
    price: 9.99,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img.jpg", type: "image" }],
    sizes: [],
    description: "",
  };

  beforeEach(() => {
    dispatch.mockClear();
  });

  it("handles hover and click to add item", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductCard product={product} ctaLabel="Add to wishlist" />
    );

    const card = container.firstChild as HTMLElement;
    await user.hover(card);
    expect(card).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /add to wishlist/i })
    );
    expect(dispatch).toHaveBeenCalledWith({ type: "add", sku: product });
  });

  it("triggers wishlist callback when provided", async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(
      <ProductCard
        product={product}
        onAddToCart={onAdd}
        ctaLabel="Add to wishlist"
        showImage={false}
        showPrice={false}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /add to wishlist/i })
    );
    expect(onAdd).toHaveBeenCalledWith(product);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
