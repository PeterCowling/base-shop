import { act, configure,render, waitFor } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { CartProvider, useCart } from "../CartContext";

import { clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("Cart dispatch: setQty", () => {
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

  it("updates quantity", async () => {
    const result = { sku1: { sku, qty: 2 } } as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: result }) });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await act(async () => {
      await dispatch({ type: "setQty", id: "sku1", qty: 2 });
    });

    expect(JSON.parse(localStorage.getItem("cart")!)).toEqual(result);
  });

  it("throws on setQty server error", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "msg" }) });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await expect(
      dispatch({ type: "setQty", id: "sku1", qty: 2 })
    ).rejects.toThrow("msg");
  });

  it("updates quantity with correct payload and syncs localStorage", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    const updated = { cart: { sku1: { sku, qty: 3 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => updated });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await act(async () => {
      await dispatch({ type: "setQty", id: "sku1", qty: 3 });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ id: "sku1", qty: 3 }),
      })
    );
    await waitFor(() => expect(cartState).toEqual(updated.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(updated.cart));
  });

  it("propagates fetch errors when setting quantity", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await expect(
      dispatch({ type: "setQty", id: "sku1", qty: 2 })
    ).rejects.toThrow("offline");
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(initial.cart));
  });
});

