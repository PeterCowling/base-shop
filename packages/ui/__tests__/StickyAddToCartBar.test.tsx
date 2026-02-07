import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SKU } from "@acme/types";

import { StickyAddToCartBar } from "../src/components/organisms/StickyAddToCartBar";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("StickyAddToCartBar", () => {
  const product: SKU = {
    id: "1",
    slug: "test-product",
    title: "Test Product",
    price: 9.99,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [],
    sizes: [],
    description: "",
  } as any;

  it("renders product info and fires add to cart", async () => {
    const handleAdd = jest.fn();
    const user = userEvent.setup();
    render(<StickyAddToCartBar product={product} onAddToCart={handleAdd} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();

    await user.tab();
    await user.keyboard("{Enter}");
    expect(handleAdd).toHaveBeenCalledWith(product);
  });
});
