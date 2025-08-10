// packages/platform-core/__tests__/addToCartButton.test.tsx

import { CartProvider, useCart } from "@/contexts/CartContext";
import AddToCartButton from "@platform-core/src/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@platform-core/products";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/cartCookie", () => jest.requireActual("@/lib/cartCookie"));
jest.mock("@/contexts/CartContext", () =>
  jest.requireActual("@/contexts/CartContext")
);
jest.mock("react", () => jest.requireActual("react"));
jest.mock("react-dom", () => jest.requireActual("react-dom"));

function Qty() {
  const [state] = useCart();
  return <span data-testid="qty">{state[PRODUCTS[0].id]?.qty ?? 0}</span>;
}

describe("AddToCartButton", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("adds items to the cart", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ ok: true }) })
    ) as any;

    render(
      <CartProvider>
        <AddToCartButton sku={PRODUCTS[0]} />
        <Qty />
      </CartProvider>
    );

    const btn = screen.getByRole("button");
    expect(screen.getByTestId("qty").textContent).toBe("0");

    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("1")
    );
  });

  it("shows an error when the server rejects the request", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: "Out of stock" }),
      })
    ) as any;

    render(
      <CartProvider>
        <AddToCartButton sku={PRODUCTS[0]} />
        <Qty />
      </CartProvider>
    );

    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByText("Out of stock")).toBeInTheDocument()
    );
    expect(screen.getByTestId("qty").textContent).toBe("0");
  });
});
