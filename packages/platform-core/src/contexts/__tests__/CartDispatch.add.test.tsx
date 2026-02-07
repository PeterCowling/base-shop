import { act, configure,render, screen, waitFor } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { CartProvider, useCart } from "../CartContext";

import { clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("Cart dispatch: add", () => {
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

  const skuWithSizes: SKU = {
    id: "sku2",
    slug: "sku2",
    title: "Test",
    price: 100,
    deposit: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "img", type: "image" }],
    sizes: ["s"],
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

  it("adds item and caches cart", async () => {
    const expected = { sku1: { sku, qty: 1 } } as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: expected }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(JSON.parse(localStorage.getItem("cart")!)).toEqual(expected);
  });

  it("throws when adding sized sku without size", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    await expect(
      dispatch({ type: "add", sku: skuWithSizes })
    ).rejects.toThrow("Size is required");
  });

  it("sends POST request with expected payload when adding", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await dispatch({ type: "add", sku, qty: 1 });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sku: { id: sku.id }, qty: 1, size: undefined }),
      })
    );
  });

  it("defaults quantity to 1 when qty omitted", async () => {
    const added = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => added });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sku: { id: sku.id }, qty: 1, size: undefined }),
      })
    );
    await waitFor(() => expect(cartState).toEqual(added.cart));
  });

  it("adds sized item and syncs localStorage", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    const added = {
      cart: { sku2: { sku: skuWithSizes, qty: 1, size: "s" } },
    };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => added });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await dispatch({ type: "add", sku: skuWithSizes, size: "s" });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sku: { id: skuWithSizes.id },
          qty: 1,
          size: "s",
        }),
      })
    );
    await waitFor(() => expect(cartState).toEqual(added.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(added.cart));
  });

  it("adds item with correct payload and syncs localStorage", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cart: {} }),
    });
    const added = { cart: { sku1: { sku, qty: 2 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => added });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await dispatch({ type: "add", sku, qty: 2 });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sku: { id: sku.id }, qty: 2, size: undefined }),
      })
    );
    await waitFor(() => expect(cartState).toEqual(added.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(added.cart));
  });

  it("continues dispatch when localStorage.setItem throws", async () => {
    const added = { cart: { sku1: { sku, qty: 1 } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => added });
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    await waitFor(() => expect(cartState).toEqual(added.cart));
    expect(setSpy).toHaveBeenCalled();
    setSpy.mockRestore();
  });

  it("throws server error message when response not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await expect(dispatch({ type: "add", sku })).rejects.toThrow("bad");
  });

  it("throws default error when response json fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("oops");
      },
    });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await expect(dispatch({ type: "add", sku })).rejects.toThrow(
      "Cart update failed"
    );
  });

  it("ignores error field in successful response", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    const added = { cart: { sku1: { sku, qty: 1 } }, error: "bad" };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => added });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    await waitFor(() => expect(cartState).toEqual(added.cart));
  });

  it("uses qty 1 by default when adding", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cart: { sku1: { sku, qty: 1 } } }),
      });

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({
      sku: { id: sku.id },
      qty: 1,
    });
    await waitFor(() =>
      expect(cartState).toEqual({ sku1: { sku, qty: 1 } })
    );
  });
});

