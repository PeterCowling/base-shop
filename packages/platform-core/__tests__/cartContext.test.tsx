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

describe("CartContext server actions", () => {
  let cart: any;
  const originalFetch = global.fetch;

  beforeEach(() => {
    cart = {};
    global.fetch = jest.fn((url: any, init?: any) => {
      if (!init || !init.method || init.method === "GET") {
        return Promise.resolve({ json: async () => ({ cart }) });
      }
      if (init.method === "POST") {
        cart[PRODUCTS[0].id] = { sku: PRODUCTS[0], qty: 1 };
        return Promise.resolve({ ok: true, json: async () => ({ cart }) });
      }
      if (init.method === "PATCH") {
        const body = JSON.parse(init.body);
        if (body.qty <= 0) delete cart[body.id];
        else {
          cart[body.id] = { sku: PRODUCTS[0], qty: body.qty };
        }
        return Promise.resolve({ ok: true, json: async () => ({ cart }) });
      }
      return Promise.resolve({ json: async () => ({ cart }) });
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("handles add, setQty and remove actions", async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = screen.getByTestId("qty");
    const add = screen.getByText("add");
    const set = screen.getByText("set");
    const remove = screen.getByText("remove");

    fireEvent.click(add);
    await waitFor(() => expect(qty.textContent).toBe("1"));

    fireEvent.click(add);
    await waitFor(() => expect(qty.textContent).toBe("2"));

    fireEvent.click(set);
    await waitFor(() => expect(qty.textContent).toBe("1"));

    fireEvent.click(remove);
    await waitFor(() => expect(qty.textContent).toBe("0"));
  });

  it("calls server API on actions", async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.click(screen.getByText("add"));

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(1);
    });
  });
});
