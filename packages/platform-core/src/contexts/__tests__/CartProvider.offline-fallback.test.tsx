import { act, render, screen, waitFor, configure } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";
import { CartDisplay, clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

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
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("offline"));

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1")
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("falls back to cache and registers online listener when server responds non-ok", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    const addSpy = jest.spyOn(window, "addEventListener");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
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
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
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
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

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
    expect(warnSpy).toHaveBeenCalled();

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
    warnSpy.mockRestore();
  });

  it("removes online listener after successful sync", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ cart: mockCart }) });

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

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
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("logs error and keeps state and cache when sync fetch fails", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockRejectedValueOnce(new Error("sync failed"));

    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
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

    warnSpy.mockClear();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(warnSpy).toHaveBeenCalledTimes(1));

    expect(removeSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(localStorage.getItem("cart")).toBe(JSON.stringify(mockCart));

    warnSpy.mockRestore();
  });

  it("retains cached cart when sync response is non-ok", async () => {
    window.localStorage.setItem("cart", JSON.stringify(mockCart));
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const removeSpy = jest.spyOn(window, "removeEventListener");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

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
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
