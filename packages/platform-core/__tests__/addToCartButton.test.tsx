// packages/platform-core/__tests__/addToCartButton.test.tsx

import AddToCartButton from "@/components/shop/AddToCartButton";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { PRODUCTS } from "@platform-core/products";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/lib/cartCookie", () => jest.requireActual("@/lib/cartCookie"));
jest.mock("@/contexts/CartContext", () =>
  jest.requireActual("@/contexts/CartContext")
);

function Qty() {
  const [state] = useCart();
  return <span data-testid="qty">{state[PRODUCTS[0].id]?.qty ?? 0}</span>;
}

describe("AddToCartButton", () => {
  it("adds items to the cart", () => {
    render(
      <CartProvider>
        <AddToCartButton sku={PRODUCTS[0]} />
        <Qty />
      </CartProvider>
    );

    const btn = screen.getByRole("button");
    expect(screen.getByTestId("qty").textContent).toBe("0");

    fireEvent.click(btn);

    expect(screen.getByTestId("qty").textContent).toBe("1");
  });
});
