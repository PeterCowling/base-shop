// packages/platform-core/__tests__/cartContext.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../contexts/CartContext";
import { PRODUCTS } from "../products";

function TestComponent() {
  const [state, dispatch] = useCart();
  const size = PRODUCTS[0].sizes[0];
  const id = `${PRODUCTS[0].id}:${size}`;
  const line = state[id];

  return (
    <div>
      <span data-testid="qty">{line?.qty ?? 0}</span>

      <button
        onClick={() => dispatch({ type: "add", sku: PRODUCTS[0], size })}
      >
        add
      </button>
      <button onClick={() => dispatch({ type: "remove", id })}>remove</button>
      <button onClick={() => dispatch({ type: "setQty", id, qty: 0 })}>set</button>
    </div>
  );
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

    fireEvent.click(set);
    await waitFor(() => expect(qty.textContent).toBe("3"));

    fireEvent.click(remove);
    await waitFor(() => expect(qty.textContent).toBe("0"));
  });
});
