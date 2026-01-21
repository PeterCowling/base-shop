import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useCart } from "@acme/platform-core/contexts/CartContext";

import { ProductCard } from "../src/components/organisms/ProductCard";

jest.mock("@acme/platform-core/contexts/CartContext");

const product: any = { id: "1", title: "Prod", price: 10 };

describe("ProductCard", () => {
  const mockUseCart = useCart as unknown as jest.Mock;

  beforeEach(() => {
    mockUseCart.mockReturnValue([{}, jest.fn()]);
  });

  it("calls onAddToCart when button is clicked", async () => {
    const handleAdd = jest.fn();
    render(
      <ProductCard
        product={product}
        onAddToCart={handleAdd}
        showImage={false}
        showPrice={false}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(handleAdd).toHaveBeenCalledWith(product);
  });

  it("dispatches add action when no onAddToCart provided", async () => {
    const dispatch = jest.fn();
    mockUseCart.mockReturnValue([{}, dispatch]);
    render(
      <ProductCard product={product} showImage={false} showPrice={false} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "add", sku: product });
  });
});
