import { act, configure,render, screen, waitFor } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { CartProvider, useCart } from "../CartContext";

import { clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("Cart dispatch: remove", () => {
  const sku: SKU = {
    id: "sku1",
    slug: "sku1",
    title: "Test",
    price: 100,
    deposit: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "img", type: "image" }],
    sizes: [],
    description: "desc",
  };

  let fetchMock: jest.Mock;
  let restoreFetch: () => void;
  let dispatch: (action: any) => Promise<void>;
  let cartState: Record<string, any>;

  function Consumer() {
    const [cart, d] = useCart();
    dispatch = d;
    return <div data-testid="count">{Object.keys(cart).length}</div>;
  }

  function Capture() {
    [cartState, dispatch] = useCart();
    return null;
  }

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
  });

  afterEach(() => {
    restoreFetch();
  });

  it("removes item", async () => {
    const cartWithItem = { sku1: { sku, qty: 1 } } as Record<string, any>;
    const empty = {} as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: cartWithItem }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: empty }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await act(async () => {
      await dispatch({ type: "remove", id: "sku1" });
    });

    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(JSON.parse(localStorage.getItem("cart")!)).toEqual(empty);
  });

  it("throws on remove server error", async () => {
    const cartWithItem = { sku1: { sku, qty: 1 } } as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: cartWithItem }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "msg" }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await expect(dispatch({ type: "remove", id: "sku1" })).rejects.toThrow(
      "msg"
    );
  });

  it("removes item with correct payload and syncs localStorage", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await act(async () => {
      await dispatch({ type: "remove", id: "sku1" });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ id: "sku1" }),
      })
    );
    await waitFor(() => expect(cartState).toEqual({}));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify({}));
  });

  it("propagates fetch errors when removing", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await expect(dispatch({ type: "remove", id: "sku1" })).rejects.toThrow(
      "offline"
    );
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(initial.cart));
  });

  it("removes item even if localStorage.setItem fails", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    const setSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("fail");
      });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await act(async () => {
      await dispatch({ type: "remove", id: "sku1" });
    });

    await waitFor(() => expect(cartState).toEqual({}));
    expect(setSpy).toHaveBeenCalled();
    setSpy.mockRestore();
  });
});

