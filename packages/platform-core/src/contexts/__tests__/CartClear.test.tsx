import { act, render, screen, waitFor, configure } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";
import { CartDisplay, clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("clear action", () => {
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

  let dispatch: (action: any) => Promise<void>;
  let cartState: Record<string, any>;
  function Capture() {
    [cartState, dispatch] = useCart();
    return null;
  }

  let fetchMock: jest.Mock;
  let restoreFetch: () => void;

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
  });

  afterEach(() => {
    restoreFetch();
  });

  it("clears cart with correct payload", async () => {
    const cartWithItem = { sku1: { sku, qty: 1 } } as Record<string, any>;
    const empty = {} as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: cartWithItem }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: empty }) });

    render(
      <CartProvider>
        <Capture />
        <CartDisplay />
      </CartProvider>
    );

    await act(async () => {
      await dispatch({ type: "clear" });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({}),
      })
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(JSON.parse(localStorage.getItem("cart")!)).toEqual(empty);
  });

  it("throws on clear server error", async () => {
    const cartWithItem = { sku1: { sku, qty: 1 } } as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: cartWithItem }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "msg" }) });

    render(
      <CartProvider>
        <Capture />
        <CartDisplay />
      </CartProvider>
    );

    await expect(dispatch({ type: "clear" })).rejects.toThrow("msg");
  });

  it("clears cart and persists state", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    const setSpy = jest.spyOn(Storage.prototype, "setItem");

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await act(async () => {
      await dispatch({ type: "clear" });
    });

    await waitFor(() => expect(cartState).toEqual({}));
    expect(setSpy).toHaveBeenCalledWith("cart", JSON.stringify({}));
  });

  it("handles localStorage errors when clearing", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("fail");
    });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));

    await act(async () => {
      await dispatch({ type: "clear" });
    });

    await waitFor(() => expect(cartState).toEqual({}));
    expect(localStorage.getItem("cart")).toBeNull();
  });

  it("resets state if persisting cleared cart fails", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    const realSetItem = Storage.prototype.setItem;
    const setSpy = jest.spyOn(Storage.prototype, "setItem");
    setSpy.mockImplementationOnce(function (key, value) {
      return realSetItem.call(this, key, value as any);
    });
    setSpy.mockImplementationOnce(() => {
      throw new Error("fail");
    });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(initial.cart));
    expect(localStorage.getItem("cart")).toEqual(JSON.stringify(initial.cart));

    await act(async () => {
      await dispatch({ type: "clear" });
    });

    await waitFor(() => expect(cartState).toEqual({}));
    // localStorage still has old cart since persisting new state failed
    expect(localStorage.getItem("cart")).toEqual(JSON.stringify(initial.cart));
  });
});
