import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SKU } from "@acme/types";
import FeaturedProductBlock from "../FeaturedProductBlock";

jest.mock("@acme/platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: (props: any) => (
    <button disabled={props.disabled}>Add to cart</button>
  ),
}));
jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
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

  it("returns null when no product data is provided", () => {
    const { container } = render(<FeaturedProductBlock />);
    expect(container.firstChild).toBeNull();
  });

  it("shows secondary media and badges when available", () => {
    const skuWithExtras: SKU & { badges?: { sale?: boolean; new?: boolean } } = {
      ...sku,
      media: [
        { url: "/img-primary.jpg", type: "image", altText: "Primary" },
        { url: "/img-secondary.jpg", type: "image", altText: "Secondary" },
      ],
      badges: { sale: true, new: true },
    };
    render(<FeaturedProductBlock sku={skuWithExtras} />);
    expect(screen.getByAltText("Primary")).toBeInTheDocument();
    expect(screen.getByAltText("Secondary")).toBeInTheDocument();
    expect(screen.getByTestId("badge-sale")).toBeInTheDocument();
    expect(screen.getByTestId("badge-new")).toBeInTheDocument();
  });
});
