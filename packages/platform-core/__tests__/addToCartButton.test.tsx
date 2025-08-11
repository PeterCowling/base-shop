// packages/platform-core/__tests__/addToCartButton.test.tsx

import { CartProvider, useCart } from "@/contexts/CartContext";
import AddToCartButton from "@platform-core/src/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@platform-core/products";
import { cartKey } from "../src/cartCookie";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
jest.mock("react", () => jest.requireActual("react"));
jest.mock("react-dom", () => jest.requireActual("react-dom"));

function Qty() {
  const [state] = useCart();
  const key = cartKey(PRODUCTS[0].id, "40");
  return <span data-testid="qty">{state[key]?.qty ?? 0}</span>;
}

describe("AddToCartButton", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("adds items to the cart", async () => {
    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      // POST
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cart: {
            [cartKey(PRODUCTS[0].id, "40")]: {
              sku: PRODUCTS[0],
              qty: 1,
              size: "40",
            },
          },
        }),
      });

    render(
      <CartProvider>
        <AddToCartButton sku={PRODUCTS[0]} size="40" />
        <Qty />
      </CartProvider>
    );

    const btn = screen.getByRole("button");
    expect(await screen.findByTestId("qty")).toHaveTextContent("0");

    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("1")
    );
  });

  it("shows an error when the server rejects the request", async () => {
    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      // POST error
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Out of stock" }),
      });

    render(
      <CartProvider>
        <AddToCartButton sku={PRODUCTS[0]} size="40" />
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
