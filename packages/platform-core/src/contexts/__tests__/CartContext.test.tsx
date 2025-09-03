import { act, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";

type CartState = Record<string, { sku: SKU; qty: number; size?: string }>

function CartDisplay() {
  const [cart] = useCart();
  return <span data-testid="count">{Object.keys(cart).length}</span>;
}

describe("CartProvider offline fallback", () => {
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
  const mockCart: CartState = {
    sku1: { sku, qty: 1 },
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    // @ts-expect-error override
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // @ts-expect-error restore
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("loads cached cart when initial fetch fails", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("falls back to cache when server responds non-ok", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({})
    });

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("syncs cached cart to server when back online", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ cart: mockCart }) });

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/cart",
        expect.objectContaining({ method: "PUT" })
      )
    );
  });

  it("removes online listener after successful sync", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ cart: mockCart }) });

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );
    const handler = addSpy.mock.calls.find(([type]) => type === "online")![1] as () => Promise<void>;

    await act(async () => {
      await handler();
    });

    expect(removeSpy).toHaveBeenCalledWith("online", handler);
  });

  it("logs error and keeps listener when sync fetch fails", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockRejectedValueOnce(new Error("sync failed"));

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );

    errorSpy.mockClear();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));

    expect(removeSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
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

  const originalFetch = global.fetch;
  let dispatch: (action: any) => Promise<void>;
  let cartState: CartState;

  function Capture() {
    [cartState, dispatch] = useCart();
    return null;
  }

  beforeEach(() => {
    window.localStorage.clear();
    // @ts-expect-error override
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ cart: {} }) });
  });

  afterEach(() => {
    // @ts-expect-error restore
    global.fetch = originalFetch;
    jest.restoreAllMocks();
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
    const fetchMock = global.fetch as jest.Mock;
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

  it("adds item and syncs localStorage", async () => {
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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

  it("throws server error message when response not ok", async () => {
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
});

