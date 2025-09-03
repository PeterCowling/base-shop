// packages/platform-core/__tests__/CartContext.test.tsx
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../src/contexts/CartContext";
import { PRODUCTS } from "../src/products/index";

function TestComponent() {
  const [state, dispatch] = useCart();
  const size = PRODUCTS[0].sizes[0];
  const id = `${PRODUCTS[0].id}:${size}`;
  const line = state[id];

  return (
    <div>
      <span data-testid="qty">{line?.qty ?? 0}</span>

      <button onClick={() => dispatch({ type: "add", sku: PRODUCTS[0], size })}>
        add
      </button>
      <button onClick={() => dispatch({ type: "remove", id })}>remove</button>
      <button onClick={() => dispatch({ type: "setQty", id, qty: 0 })}>set</button>
    </div>
  );
}

function CaptureDispatch({
  onReady,
}: {
  onReady: (dispatch: ReturnType<typeof useCart>[1]) => void;
}) {
  const [, dispatch] = useCart();
  React.useEffect(() => {
    onReady(dispatch);
  }, [dispatch, onReady]);
  return null;
}

describe("CartContext actions", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("handles add, setQty and remove actions", async () => {
    const size = PRODUCTS[0].sizes[0];
    const id = `${PRODUCTS[0].id}:${size}`;
    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      // add
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cart: { [id]: { sku: PRODUCTS[0], qty: 1, size } } }),
      })
      // setQty
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cart: { [id]: { sku: PRODUCTS[0], qty: 3, size } } }),
      })
      // remove
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = await screen.findByTestId("qty");
    const add = screen.getByText("add");
    const set = screen.getByText("set");
    const remove = screen.getByText("remove");

    fireEvent.click(add);
    await waitFor(() => expect(qty.textContent).toBe("1"));
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/cart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sku: { id: PRODUCTS[0].id },
          qty: 1,
          size,
        }),
      })
    );

    fireEvent.click(set);
    await waitFor(() => expect(qty.textContent).toBe("3"));
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/cart",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ id, qty: 0 }),
      })
    );

    fireEvent.click(remove);
    await waitFor(() => expect(qty.textContent).toBe("0"));
    expect(global.fetch).toHaveBeenNthCalledWith(
      4,
      "/api/cart",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ id }),
      })
    );
  });

  it("throws when adding SKU requiring size without one", async () => {
    let dispatch: ReturnType<typeof useCart>[1] | undefined;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <CaptureDispatch onReady={(d) => (dispatch = d)} />
      </CartProvider>
    );

    await waitFor(() => expect(dispatch).toBeDefined());
    await expect(
      dispatch!({ type: "add", sku: PRODUCTS[0] })
    ).rejects.toThrow("Size is required");
  });

  it("falls back to localStorage and syncs on online", async () => {
    const size = PRODUCTS[0].sizes[0];
    const id = `${PRODUCTS[0].id}:${size}`;
    const cached = { [id]: { sku: PRODUCTS[0], qty: 2, size } };
    localStorage.setItem("cart", JSON.stringify(cached));

    global.fetch = jest
      .fn()
      // initial GET fails
      .mockRejectedValueOnce(new Error("fail"))
      // sync PUT succeeds
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = await screen.findByTestId("qty");
    expect(qty.textContent).toBe("2");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("online"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({ method: "PUT" })
    );
    await waitFor(() => expect(qty.textContent).toBe("0"));
    expect(localStorage.getItem("cart")).toBe("{}");
  });

  it("throws when cart API response is non-ok", async () => {
    let dispatch: ReturnType<typeof useCart>[1] | undefined;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "nope" }) });

    render(
      <CartProvider>
        <CaptureDispatch onReady={(d) => (dispatch = d)} />
      </CartProvider>
    );

    await waitFor(() => expect(dispatch).toBeDefined());
    await expect(
      dispatch!({
        type: "add",
        sku: PRODUCTS[0],
        size: PRODUCTS[0].sizes[0],
      })
    ).rejects.toThrow("nope");
  });

  it("throws when used outside provider", () => {
    function Naked() {
      useCart();
      return null;
    }
    const orig = console.error;
    console.error = () => {};
    expect(() => render(<Naked />)).toThrow("inside CartProvider");
    console.error = orig;
  });
});

