import { act, render, screen, waitFor, configure } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";
import {
  CartDisplay,
  clearCartStorage,
  setupFetchMock,
  mockNoWindow,
} from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

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

  let fetchMock: jest.Mock;
  let restoreFetch: () => void;
  let restoreWindow: () => void;

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
    restoreWindow = mockNoWindow();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cart: { sku1: { sku, qty: 1 } } }),
      });
  });

  afterEach(() => {
    restoreFetch();
    restoreWindow();
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
  let fetchMock: jest.Mock;
  let restoreFetch: () => void;

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
  });

  afterEach(() => {
    restoreFetch();
  });

  it("sets state and caches cart on success", async () => {
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
    fetchMock.mockRejectedValue(new Error("offline"));
    window.localStorage.setItem("cart", JSON.stringify(server.cart));
    const addSpy = jest.spyOn(window, "addEventListener");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("keeps state empty and does not register online listener when fetch fails with no cache", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const addSpy = jest.spyOn(window, "addEventListener");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0")
    );
    expect(addSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs error when cache read fails during sync", async () => {
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
    errorSpy.mockRestore();
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
  const mockCart = {
    sku1: { sku, qty: 1 },
  } as Record<string, { sku: SKU; qty: number }>;

  let fetchMock: jest.Mock;
  let restoreFetch: () => void;

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
  });

  afterEach(() => {
    restoreFetch();
  });

  it("loads cached cart when initial fetch fails", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("offline"));

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

  it("falls back to cache and registers online listener when server responds non-ok", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const addSpy = jest.spyOn(window, "addEventListener");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("syncs cached cart to server when back online", async () => {
    const updated = { cart: { sku1: { sku, qty: 2 } } };
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => updated,
    });

    const addSpy = jest.spyOn(window, "addEventListener");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    let cartState: Record<string, { sku: SKU; qty: number }>;
    let dispatch: (action: any) => Promise<void>;
    function Capture() {
      [cartState, dispatch] = useCart();
      return null;
    }

    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(cartState).toEqual(mockCart));
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(errorSpy).toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          lines: [
            {
              sku: { id: sku.id },
              qty: 1,
            },
          ],
        }),
      })
    );
    await waitFor(() => expect(cartState).toEqual(updated.cart));
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(updated.cart));
    errorSpy.mockRestore();
  });

  it("removes online listener after successful sync", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ cart: mockCart }) });

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );
    const handler = addSpy.mock.calls.find(([type]) => type === "online")![1] as () =>
      Promise<void>;

    await act(async () => {
      await handler();
    });

    expect(removeSpy).toHaveBeenCalledWith("online", handler);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs error and keeps state and cache when sync fetch fails", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockRejectedValueOnce(new Error("sync failed"));

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const setSpy = jest.spyOn(Storage.prototype, "setItem");

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function))
    );

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(mockCart));

    errorSpy.mockClear();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));

    expect(removeSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(mockCart));

    errorSpy.mockRestore();
  });

  it("retains cached cart when sync response is non-ok", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const removeSpy = jest.spyOn(window, "removeEventListener");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

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
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
