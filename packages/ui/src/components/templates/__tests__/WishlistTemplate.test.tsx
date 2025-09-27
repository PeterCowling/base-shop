/* i18n-exempt file -- test titles and UI copy are asserted literally */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { WishlistTemplate, type WishlistItem } from "../WishlistTemplate";
import "../../../../../../test/resetNextMocks";

jest.mock("../../atoms/Price", () => ({
  Price: ({ amount }: { amount: number | string }) => (
    <div data-cy="price">{amount}</div>
  ),
}));

describe("WishlistTemplate", () => {
  const item: WishlistItem = {
    id: "1",
    slug: "p1",
    title: "Product 1",
    price: 100,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img.jpg", type: "image" }],
    sizes: [],
    description: "",
    quantity: 1,
  };

  it("renders items and triggers callbacks", async () => {
    const onAdd = jest.fn();
    const onRemove = jest.fn();
    render(
      <WishlistTemplate
        items={[item]}
        onAddToCart={onAdd}
        onRemove={onRemove}
      />
    );

    expect(screen.getByText("Wishlist")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByTestId("price")).toHaveTextContent("100");
    expect(screen.getByText("x1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onAdd).toHaveBeenCalledWith(item);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith(item);
  });

  it("renders without action buttons when callbacks are missing", () => {
    render(<WishlistTemplate items={[item]} />);

    expect(
      screen.queryByRole("button", { name: /add to cart/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a video element when media type is video", () => {
    const videoItem: WishlistItem = {
      ...item,
      id: "2",
      media: [{ url: "/vid.mp4", type: "video" }],
    };

    const { container } = render(<WishlistTemplate items={[videoItem]} />);
    expect(container.querySelector("video")).toBeInTheDocument();
  });
});
