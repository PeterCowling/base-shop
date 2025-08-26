// packages/platform-core/__tests__/addToCartButton.test.tsx

// Use the platform-core CartContext instead of the app-specific alias.
import { CartProvider, useCart } from "@platform-core/contexts/CartContext";
import AddToCartButton from "@platform-core/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@platform-core/products";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
jest.mock("react", () => jest.requireActual("react"));
jest.mock("react-dom", () => jest.requireActual("react-dom"));

function Qty() {
  const [state] = useCart();
  const size = PRODUCTS[0].sizes[0];
  const id = `${PRODUCTS[0].id}:${size}`;
  return <span data-testid="qty">{state[id]?.qty ?? 0}</span>;
}

describe("AddToCartButton", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("adds items to the cart", async () => {
    const size = PRODUCTS[0].sizes[0];
    const id = `${PRODUCTS[0].id}:${size}`;
    const quantity = 2;
    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      // POST
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cart: { [id]: { sku: PRODUCTS[0], qty: quantity, size } },
        }),
      });

    render(
      <CartProvider>
        <AddToCartButton sku={PRODUCTS[0]} size={size} quantity={quantity} />
        <Qty />
      </CartProvider>
    );

    const btn = screen.getByRole("button");
    expect(await screen.findByTestId("qty")).toHaveTextContent("0");

    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe(
        quantity.toString()
      )
    );
  });

  it("shows an error when the server rejects the request", async () => {
    const size = PRODUCTS[0].sizes[0];
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
        <AddToCartButton sku={PRODUCTS[0]} size={size} />
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
