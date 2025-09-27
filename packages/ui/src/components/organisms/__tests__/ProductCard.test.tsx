/* i18n-exempt file -- test literals for titles, prices, and buttons */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "../ProductCard";
import type { SKU } from "@acme/types";
import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

const dispatch = jest.fn();
jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));
jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, dispatch],
}));

describe("ProductCard", () => {
  beforeEach(() => {
    dispatch.mockClear();
  });
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

  it("renders product info and dispatches add action", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    expect(screen.getByAltText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$9.99")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "add", sku: product });
  });

  it("renders a video media item", () => {
    const videoProduct: SKU = {
      ...product,
      media: [{ url: "/video.mp4", type: "video" }],
    };
    const { container } = render(<ProductCard product={videoProduct} />);

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
  });

  it("supports layout props and onAddToCart callback", async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    const { container } = render(
      <ProductCard
        product={product}
        onAddToCart={onAdd}
        showImage={false}
        showPrice={false}
        width={100}
        height={200}
        padding="p-2"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(screen.queryByAltText("Test Product")).not.toBeInTheDocument();
    expect(screen.queryByText("$9.99")).not.toBeInTheDocument();
    expect(card).toHaveStyle({ width: "100px", height: "200px" });
    expect(card).toHaveClass("p-2");

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onAdd).toHaveBeenCalledWith(product);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
