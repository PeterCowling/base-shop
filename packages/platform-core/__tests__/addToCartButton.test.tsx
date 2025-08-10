// packages/platform-core/__tests__/addToCartButton.test.tsx

import { CartProvider, useCart } from "@/contexts/CartContext";
import AddToCartButton from "@platform-core/src/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@platform-core/products";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
    let cart: any = {};
    global.fetch = jest.fn((url: any, init?: any) => {
      if (!init || !init.method || init.method === "GET") {
        return Promise.resolve({ json: async () => ({ cart }) });
      }
      if (init.method === "POST") {
        cart[PRODUCTS[0].id] = { sku: PRODUCTS[0], qty: 1 };
        return Promise.resolve({ ok: true, json: async () => ({ cart }) });
      }
      return Promise.resolve({ json: async () => ({ cart }) });
    }) as any;

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
    const cart: any = {};
    global.fetch = jest.fn((url: any, init?: any) => {
      if (!init || !init.method || init.method === "GET") {
        return Promise.resolve({ json: async () => ({ cart }) });
      }
      if (init.method === "POST") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Out of stock" }),
        });
      }
      return Promise.resolve({ json: async () => ({ cart }) });
    }) as any;

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
