// packages/platform-core/__tests__/CartContext.test.tsx
import React from "react";
import fetchMock from "jest-fetch-mock";
import "jest-localstorage-mock";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../src/contexts/CartContext";
import { PRODUCTS } from "../src/products/index";

fetchMock.enableMocks();

const getRequestPath = (input: RequestInfo) => {
  const raw = input instanceof Request ? input.url : input;
  return new URL(typeof raw === "string" ? raw : String(raw), "http://localhost")
    .pathname;
};

function TestComponent() {
  const [state, dispatch] = useCart();
  const size = PRODUCTS[0].sizes[0];
  const id = `${PRODUCTS[0].id}:${size}`;
  const line = state[id];

  return (
    <div>
      <span data-cy="qty">{line?.qty ?? 0}</span>
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

beforeEach(() => {
  fetchMock.resetMocks();
  localStorage.clear();
  jest.restoreAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("CartContext", () => {
  it("loads cart from API and caches it", async () => {
    const size = PRODUCTS[0].sizes[0];
    const id = `${PRODUCTS[0].id}:${size}`;
    const cart = { [id]: { sku: PRODUCTS[0], qty: 2, size } };
    fetchMock.mockResponseOnce(JSON.stringify({ cart }));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = screen.getByTestId("qty");
    await waitFor(() => expect(qty.textContent).toBe("2"));
    expect(getRequestPath(fetchMock.mock.calls[0][0])).toBe("/api/cart");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify(cart)
    );
  });

  it("falls back to cached cart and syncs on online", async () => {
    const size = PRODUCTS[0].sizes[0];
    const id = `${PRODUCTS[0].id}:${size}`;
    const cached = { [id]: { sku: PRODUCTS[0], qty: 2, size } };
    localStorage.setItem("cart", JSON.stringify(cached));
    fetchMock.mockRejectOnce(new Error("fail"));
    fetchMock.mockResponseOnce(JSON.stringify({ cart: {} }));

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = screen.getByTestId("qty");
    await waitFor(() => expect(qty.textContent).toBe("2"));
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );
    const handler = addSpy.mock.calls.find((c) => c[0] === "online")?.[1] as EventListener;

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(2));
    const putReq = fetchMock.mock.calls[1][0] as Request;
    expect(getRequestPath(putReq)).toBe("/api/cart");
    expect(putReq.method).toBe("PUT");
    await waitFor(() => expect(qty.textContent).toBe("0"));
    expect(localStorage.setItem).toHaveBeenLastCalledWith("cart", "{}");
    expect(removeSpy).toHaveBeenCalledWith("online", handler);
  });

  it("handles localStorage errors when reading cache", async () => {
    fetchMock.mockRejectOnce(new Error("fail"));
    const addSpy = jest.spyOn(window, "addEventListener");
    (localStorage.getItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("ls fail");
    });

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = screen.getByTestId("qty");
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );
    expect(qty.textContent).toBe("0");
  });

  it("throws when adding SKU requiring size without one", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ cart: {} }));
    let dispatch: ReturnType<typeof useCart>[1] | undefined;

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

  it("handles add, setQty and remove actions", async () => {
    const size = PRODUCTS[0].sizes[0];
    const id = `${PRODUCTS[0].id}:${size}`;
    fetchMock
      .mockResponseOnce(JSON.stringify({ cart: {} }))
      .mockResponseOnce(
        JSON.stringify({ cart: { [id]: { sku: PRODUCTS[0], qty: 1, size } } })
      )
      .mockResponseOnce(
        JSON.stringify({ cart: { [id]: { sku: PRODUCTS[0], qty: 3, size } } })
      )
      .mockResponseOnce(JSON.stringify({ cart: {} }));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const qty = screen.getByTestId("qty");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const add = screen.getByText("add");
    const set = screen.getByText("set");
    const remove = screen.getByText("remove");

    fireEvent.click(add);
    await waitFor(() => expect(qty.textContent).toBe("1"));
    const postReq = fetchMock.mock.calls[1][0] as Request;
    expect(getRequestPath(postReq)).toBe("/api/cart");
    expect(postReq.method).toBe("POST");
    expect(await postReq.text()).toBe(
      JSON.stringify({ sku: { id: PRODUCTS[0].id }, qty: 1, size })
    );

    fireEvent.click(set);
    await waitFor(() => expect(qty.textContent).toBe("3"));
    const patchReq = fetchMock.mock.calls[2][0] as Request;
    expect(getRequestPath(patchReq)).toBe("/api/cart");
    expect(patchReq.method).toBe("PATCH");
    expect(await patchReq.text()).toBe(
      JSON.stringify({ id, qty: 0 })
    );

    fireEvent.click(remove);
    await waitFor(() => expect(qty.textContent).toBe("0"));
    const deleteReq = fetchMock.mock.calls[3][0] as Request;
    expect(getRequestPath(deleteReq)).toBe("/api/cart");
    expect(deleteReq.method).toBe("DELETE");
    expect(await deleteReq.text()).toBe(JSON.stringify({ id }));
  });

  it("throws API error message from dispatch", async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ cart: {} }))
      .mockResponseOnce(JSON.stringify({ error: "nope" }), { status: 400 });

    let dispatch: ReturnType<typeof useCart>[1] | undefined;
    render(
      <CartProvider>
        <CaptureDispatch onReady={(d) => (dispatch = d)} />
      </CartProvider>
    );

    await waitFor(() => expect(dispatch).toBeDefined());
    await expect(
      dispatch!({ type: "add", sku: PRODUCTS[0], size: PRODUCTS[0].sizes[0] })
    ).rejects.toThrow("nope");
  });

  it("throws default error when dispatch API fails without message", async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ cart: {} }))
      .mockResponseOnce(JSON.stringify({}), { status: 500 });

    let dispatch: ReturnType<typeof useCart>[1] | undefined;
    render(
      <CartProvider>
        <CaptureDispatch onReady={(d) => (dispatch = d)} />
      </CartProvider>
    );

    await waitFor(() => expect(dispatch).toBeDefined());
    await expect(
      dispatch!({ type: "add", sku: PRODUCTS[0], size: PRODUCTS[0].sizes[0] })
    ).rejects.toThrow("Cart update failed");
  });

  it("throws when used outside provider", () => {
    function Naked() {
      useCart();
      return null;
    }
    expect(() => render(<Naked />)).toThrow("inside CartProvider");
  });
});
