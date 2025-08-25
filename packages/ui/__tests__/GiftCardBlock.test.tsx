import { render, screen } from "@testing-library/react";
import GiftCardBlock from "../src/components/cms/blocks/GiftCardBlock";

jest.mock("@acme/platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: () => <button>Purchase</button>,
}));

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("GiftCardBlock", () => {
  it("exposes data-token attributes", () => {
    render(<GiftCardBlock denominations={[25, 50]} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("data-token", "--color-fg");
    expect(buttons[0].querySelector("span")).toHaveAttribute(
      "data-token",
      "--color-bg"
    );
    expect(buttons[1]).toHaveAttribute("data-token", "--color-bg");
  });
});
