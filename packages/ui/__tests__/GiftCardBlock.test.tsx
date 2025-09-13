import { fireEvent, render, screen } from "@testing-library/react";
import GiftCardBlock from "../src/components/cms/blocks/GiftCardBlock";

const addToCartMock = jest.fn();
jest.mock("@acme/platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: (props: any) => {
    addToCartMock(props);
    return <button>Purchase</button>;
  },
}));

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("GiftCardBlock", () => {
  beforeEach(() => {
    addToCartMock.mockClear();
  });

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

  it("updates selected amount and passes sku to AddToCartButton", () => {
    render(<GiftCardBlock denominations={[25, 50]} />);
    const [first, second] = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent !== "Purchase");

    fireEvent.click(second);

    expect(addToCartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sku: expect.objectContaining({ price: 50 }),
      })
    );
    expect(second).toHaveAttribute("data-token", "--color-fg");
    expect(first).toHaveAttribute("data-token", "--color-bg");
  });

  it("renders terms and conditions when provided", () => {
    render(
      <GiftCardBlock denominations={[25, 50]} description="Terms apply" />
    );
    expect(screen.getByText("Terms apply")).toBeInTheDocument();
  });
});
