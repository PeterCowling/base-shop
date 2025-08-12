import { act, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";

type CartState = Record<string, { sku: SKU; qty: number; size?: string }>

function CartDisplay() {
  const [cart] = useCart();
  return <span data-testid="count">{Object.keys(cart).length}</span>;
}

describe("CartProvider offline fallback", () => {
  const sku: SKU = {
    id: "sku1",
    slug: "sku1",
    title: "Test",
    price: 100,
    deposit: 0,
    forSale: true,
    forRental: false,
    images: [{ url: "img", type: "image" }],
    sizes: [],
    description: "desc",
  };
  const mockCart: CartState = {
    sku1: { sku, qty: 1 },
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    // @ts-expect-error override
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // @ts-expect-error restore
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("loads cached cart when initial fetch fails", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("syncs cached cart to server when back online", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ cart: mockCart }) });

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/cart",
        expect.objectContaining({ method: "PUT" })
      )
    );
  });
});

