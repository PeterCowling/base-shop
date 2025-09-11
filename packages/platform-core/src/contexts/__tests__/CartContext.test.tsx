import { act, render, screen, waitFor, configure } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";

configure({ testIdAttribute: "data-testid" });
import type { SKU } from "@acme/types";

type CartState = Record<string, { sku: SKU; qty: number; size?: string }>

function CartDisplay() {
  const [cart] = useCart();
  return <span data-testid="count">{Object.keys(cart).length}</span>;
}

describe("useCart", () => {
  it("throws when used outside CartProvider", () => {
    function Test() {
      useCart();
      return null;
    }
    expect(() => render(<Test />)).toThrow("useCart must be inside CartProvider");
  });
});

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

  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    // @ts-expect-error restore
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("adds item and caches cart", async () => {
    const expected = { sku1: { sku, qty: 1 } } satisfies CartState;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
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
    // @ts-expect-error override
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });

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
    const result = { sku1: { sku, qty: 2 } } satisfies CartState;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
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
    // @ts-expect-error override
    global.fetch = jest
      .fn()
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
    const cartWithItem = { sku1: { sku, qty: 1 } } satisfies CartState;
    const empty = {} satisfies CartState;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
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
    const cartWithItem = { sku1: { sku, qty: 1 } } satisfies CartState;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
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

  it("clears cart", async () => {
    const cartWithItem = { sku1: { sku, qty: 1 } } satisfies CartState;
    const empty = {} satisfies CartState;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: cartWithItem }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: empty }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await act(async () => {
      await dispatch({ type: "clear" });
    });

    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(JSON.parse(localStorage.getItem("cart")!)).toEqual(empty);
  });

  it("throws on clear server error", async () => {
    const cartWithItem = { sku1: { sku, qty: 1 } } satisfies CartState;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: cartWithItem }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "msg" }) });

    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await expect(dispatch({ type: "clear" })).rejects.toThrow("msg");
  });
});

describe("CartProvider without window", () => {
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

  const originalWindow = global.window;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // @ts-expect-error override
    global.window = undefined;
    // @ts-expect-error override
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cart: { sku1: { sku, qty: 1 } } }),
      });
  });

  afterEach(() => {
    // @ts-expect-error restore
    global.window = originalWindow;
    // @ts-expect-error restore
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("handles add without window", async () => {
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
  });
});

describe("CartProvider initial load", () => {
  const sku = { id: "sku123", sizes: [] } as unknown as SKU;
  const server = { cart: { sku123: { qty: 1, sku } } };
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

  it("sets state and caches cart on success", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, json: async () => server });
    const setSpy = jest.spyOn(Storage.prototype, "setItem");

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(setSpy).toHaveBeenCalledWith("cart", JSON.stringify(server.cart));
  });

  it("handles cache write failures gracefully", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, json: async () => server });
    jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("fail");
      });

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(localStorage.getItem("cart")).toBeNull();
  });

  it("falls back to cached cart on failure and registers online listener", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new Error("offline"));
    window.localStorage.setItem("cart", JSON.stringify(server.cart));
    const addSpy = jest.spyOn(window, "addEventListener");

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
  });

  it("registers online listener and keeps state empty when fetch fails with no cache", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new Error("offline"));
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const addSpy = jest.spyOn(window, "addEventListener");

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0")
    );
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
  });

  it("logs error when cache read fails during sync", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new Error("offline"));
    const getSpy = jest.spyOn(Storage.prototype, "getItem");
    getSpy.mockReturnValueOnce(JSON.stringify(server.cart));
    getSpy.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const addSpy = jest.spyOn(window, "addEventListener");

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(screen.getByTestId("count").textContent).toBe("1");
  });
});

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
    const updated = { cart: { sku1: { sku, qty: 2 } } };
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => updated,
    });

    const addSpy = jest.spyOn(window, "addEventListener");

    let cartState: CartState;
    function Capture() {
      [cartState] = useCart();
      return null;
    }

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(mockCart));
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/cart",
        expect.objectContaining({ method: "PUT" })
      )
    );
    await waitFor(() => expect(cartState).toEqual(updated.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(updated.cart));
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

  it("retains cached cart when sync response is non-ok", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const removeSpy = jest.spyOn(window, "removeEventListener");

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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(removeSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(mockCart));
    expect(screen.getByTestId("count").textContent).toBe("1");
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

  it("sends POST request with expected payload when adding", async () => {
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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

  it("sends DELETE request and throws on error when removing", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
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

    await expect(dispatch({ type: "remove", id: "sku1" })).rejects.toThrow("bad");

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ id: "sku1" }),
      })
    );
  });

  it("sends PATCH request and throws on error when setting quantity", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => initial });
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

    await expect(
      dispatch({ type: "setQty", id: "sku1", qty: 2 })
    ).rejects.toThrow("bad");

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ id: "sku1", qty: 2 }),
      })
    );
  });

  it("continues dispatch when localStorage.setItem throws", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) });
    const added = { cart: { sku1: { sku, qty: 1 } } };
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

  it("propagates fetch errors when removing", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
  let cartState: CartState;
  function Capture() {
    [cartState, dispatch] = useCart();
    return null;
  }

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

  it("clears cart and persists state", async () => {
    const initial = { cart: { sku1: { sku, qty: 1 } } };
    const fetchMock = global.fetch as jest.Mock;
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
    const fetchMock = global.fetch as jest.Mock;
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
});

