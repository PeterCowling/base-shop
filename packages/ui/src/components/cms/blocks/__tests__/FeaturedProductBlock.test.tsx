import { fireEvent, render, screen } from "@testing-library/react";
import FeaturedProductBlock from "../FeaturedProductBlock";

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

jest.mock("@platform-core/src/components/shop/AddToCartButton.client", () =>
  function MockAddToCartButton(props) {
    return <button disabled={props.disabled}>Add to cart</button>;
  }
);

describe("FeaturedProductBlock", () => {
  const product = {
    id: "p1",
    slug: "p1",
    title: "Test Shoe",
    price: 10,
    deposit: 0,
    stock: 1,
    forSale: true,
    forRental: false,
    media: [{ url: "/img.jpg", type: "image" }],
    sizes: ["S", "M"],
    description: "",
  };

  it("renders product and enables add to cart after size selected", () => {
    render(<FeaturedProductBlock sku={product} />);
    expect(screen.getByText("Test Shoe")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /add to cart/i });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "M" } });
    expect(button).not.toBeDisabled();
  });
});
