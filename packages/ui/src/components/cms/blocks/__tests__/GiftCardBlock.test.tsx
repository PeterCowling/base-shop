import { render, screen } from "@testing-library/react";
import GiftCardBlock from "../GiftCardBlock";

jest.mock("@platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: () => <button>Purchase</button>,
}));
jest.mock("@platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("GiftCardBlock", () => {
  it("renders denominations and purchase button", () => {
    render(<GiftCardBlock denominations={[25, 50]} description="Gift" />);
    expect(screen.getByText("Gift")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "$25.00" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "$50.00" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /purchase/i })).toBeInTheDocument();
  });
});
