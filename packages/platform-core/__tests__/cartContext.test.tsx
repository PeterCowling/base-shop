import { fireEvent, render, screen, waitFor } from "@testing-library/react";
// @ts-ignore
import { CartProvider, useCart } from "../contexts/CartContext.tsx";
import { PRODUCTS } from "../products";
jest.mock("@/lib/cartCookie", () => jest.requireActual("../cartCookie.ts"));

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

describe("CartContext reducer", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "";
  });

  it("handles add, setQty and remove actions", () => {
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
    expect(qty.textContent).toBe("1");

    fireEvent.click(add);
    expect(qty.textContent).toBe("2");

    fireEvent.click(set);
    expect(qty.textContent).toBe("1");

    fireEvent.click(remove);
    expect(qty.textContent).toBe("0");
  });

  it("persists to localStorage and cookies", async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    fireEvent.click(screen.getByText("add"));
    await waitFor(() => {
      expect(localStorage.getItem("CART_STATE")).toBeTruthy();
    });
    const encoded = localStorage.getItem("CART_STATE")!;
    expect(document.cookie).toContain(`CART_STATE=${encoded}`);
  });
});
