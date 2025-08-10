// packages/platform-core/__tests__/cartContext.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../contexts/CartContext";
import { PRODUCTS } from "../products";

function TestComponent() {
  const [state, dispatch] = useCart();
  const line = state[PRODUCTS[0].id];

  return (
    <div>
      <span data-testid="qty">{line?.qty ?? 0}</span>
      <button onClick={() => dispatch({ type: "add", sku: PRODUCTS[0] })}>
        add
      </button>
      <button onClick={() => dispatch({ type: "remove", id: PRODUCTS[0].id })}>
        remove
      </button>
      <button
        onClick={() => dispatch({ type: "setQty", id: PRODUCTS[0].id, qty: 0 })}
      >
        set
      </button>
    </div>
  );
}

describe("CartContext", () => {
  it("handles add, setQty and remove actions", async () => {
    const responses = [
      // initial GET
      { cart: {} },
      // add
      { cart: { [PRODUCTS[0].id]: { sku: PRODUCTS[0], qty: 1 } } },
      // add again
      { cart: { [PRODUCTS[0].id]: { sku: PRODUCTS[0], qty: 2 } } },
      // setQty -> 1
      { cart: { [PRODUCTS[0].id]: { sku: PRODUCTS[0], qty: 1 } } },
      // remove
      { cart: {} },
    ];

    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ ok: true, json: async () => responses.shift() })
      ) as any;

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = screen.getByTestId("qty");
    const add = screen.getByText("add");
    const set = screen.getByText("set");
    const remove = screen.getByText("remove");

    await waitFor(() => expect(qty.textContent).toBe("0"));

    fireEvent.click(add);
    await waitFor(() => expect(qty.textContent).toBe("1"));

    fireEvent.click(add);
    await waitFor(() => expect(qty.textContent).toBe("2"));

    fireEvent.click(set);
    await waitFor(() => expect(qty.textContent).toBe("1"));

    fireEvent.click(remove);
    await waitFor(() => expect(qty.textContent).toBe("0"));
  });
});
