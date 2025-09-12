import { act, render, screen, waitFor, configure } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";
import { clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("Cart actions", () => {
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
  function Consumer() {
    const [cart, d] = useCart();
    dispatch = d;
    return <div data-testid="count">{Object.keys(cart).length}</div>;
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

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(JSON.parse(localStorage.getItem("cart")!)).toEqual(expected);
  });

  it("throws when size required", async () => {
    const sizedSku = { ...sku, id: "sku2", sizes: ["M"] };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await expect(dispatch({ type: "add", sku: sizedSku })).rejects.toThrow(
      "Size is required"
    );
  });

  it("updates quantity", async () => {
    const result = { sku1: { sku, qty: 2 } } as Record<string, any>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: result }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

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
        <Consumer />
      </CartProvider>
    );

    await expect(
      dispatch({ type: "setQty", id: "sku1", qty: 2 })
    ).rejects.toThrow("msg");
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

    await expect(dispatch({ type: "remove", id: "sku1" })).rejects.toThrow(
      "msg"
    );
  });
});

describe("CartProvider dispatch", () => {
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
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ cart: {} }) });
  });

  afterEach(() => {
    restoreFetch();
  });

  it("throws when adding sized sku without size", async () => {
    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );
    await expect(
      dispatch({ type: "add", sku: skuWithSizes })
    ).rejects.toThrow("Size is required");
  });

  it("ignores unknown actions", async () => {
    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    await dispatch({ type: "unknown" } as any);

    expect(fetchMock).not.toHaveBeenCalled();
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

  it("adds item and syncs localStorage", async () => {
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

    await waitFor(() => expect(cartState).toEqual(added.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(added.cart));
  });

  it("removes item and syncs localStorage", async () => {
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

    await waitFor(() => expect(cartState).toEqual({}));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify({}));
  });

  it("updates quantity and syncs localStorage", async () => {
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

    await waitFor(() => expect(cartState).toEqual(updated.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(updated.cart));
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
});
