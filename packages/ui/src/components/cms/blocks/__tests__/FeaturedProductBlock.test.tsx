import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SKU } from "@acme/types";
import FeaturedProductBlock from "../FeaturedProductBlock";

jest.mock("@platform-core/src/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: (props: any) => (
    <button disabled={props.disabled}>Add to cart</button>
  ),
}));
jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("FeaturedProductBlock", () => {
  const sku: SKU = {
    id: "1",
    slug: "prod-1",
    title: "Test Product",
    price: 100,
    deposit: 0,
    stock: 5,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["S", "M"],
    description: "",
  };

  it("renders product info and variant selector", async () => {
    render(<FeaturedProductBlock sku={sku} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    const button = screen.getByRole("button", { name: /add to cart/i });
    expect(button).toBeDisabled();
    await userEvent.selectOptions(select, "S");
    expect(button).not.toBeDisabled();
  });
});
