import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StickyAddToCartBar } from "./StickyAddToCartBar";
import type { SKU } from "@acme/types";
import "@testing-library/jest-dom";
import "../../../../../test/resetNextMocks";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("StickyAddToCartBar scroll behavior", () => {
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

  it("remains visible on scroll and triggers add to cart", async () => {
    const handleAdd = jest.fn();
    const user = userEvent.setup();

    render(
      <div data-cy="scroll-container" style={{ height: "100px", overflowY: "auto" }}>
        <div style={{ height: "200px" }} />
        <StickyAddToCartBar product={product} onAddToCart={handleAdd} />
        <div style={{ height: "200px" }} />
      </div>
    );

    const container = screen.getByTestId("scroll-container");
    fireEvent.scroll(container, { target: { scrollTop: 150 } });

    const button = screen.getByRole("button", { name: /add to cart/i });
    expect(button).toBeVisible();

    await user.click(button);
    expect(handleAdd).toHaveBeenCalledWith(product);
  });
});
