import { fireEvent, render, screen } from "@testing-library/react";
import AddToCartButton from "../components/shop/AddToCartButton";
// @ts-ignore
import { CartProvider, useCart } from "../contexts/CartContext.tsx";
import { PRODUCTS } from "../products";
jest.mock("@/lib/cartCookie", () => jest.requireActual("../cartCookie.ts"));
jest.mock("@/contexts/CartContext", () =>
  jest.requireActual("../contexts/CartContext.tsx")
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
