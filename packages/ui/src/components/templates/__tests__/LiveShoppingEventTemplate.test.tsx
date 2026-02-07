import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SKU } from "@acme/types";

import { LiveShoppingEventTemplate } from "../LiveShoppingEventTemplate";

const dispatch = jest.fn();
jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));
jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, dispatch],
}));

describe("LiveShoppingEventTemplate", () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  it("sends chat message and clears input", async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn();

    render(
      <LiveShoppingEventTemplate streamUrl="video.mp4" onSendMessage={onSendMessage} />
    );

    const input = screen.getByPlaceholderText("Say something…");
    await user.type(input, "Hello world");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSendMessage).toHaveBeenCalledWith("Hello world");
    expect(input).toHaveValue("");
  });

  it("shows empty states when no messages or products", () => {
    render(<LiveShoppingEventTemplate streamUrl="video.mp4" />);

    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    expect(
      screen.getByText("No products currently highlighted.")
    ).toBeInTheDocument();
  });

  it("triggers onAddToCart when CTA clicked", async () => {
    const user = userEvent.setup();
    const onAddToCart = jest.fn();
    const product: SKU = {
      id: "1",
      slug: "product-1",
      title: "Product 1",
      price: 1000,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/img.jpg", type: "image" }],
      sizes: [],
      description: "",
    };

    render(
      <LiveShoppingEventTemplate
        streamUrl="video.mp4"
        products={[product]}
        onAddToCart={onAddToCart}
      />
    );

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith(product);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
