import { act, render, screen, waitFor, configure } from "@testing-library/react";
import { CartProvider } from "../CartContext";
import { CartDisplay, clearCartStorage, setupFetchMock } from "./cartTestUtils";
import type { SKU } from "@acme/types";

configure({ testIdAttribute: "data-testid" });

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
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

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

  it("keeps state empty and does not register online listener when fetch fails with no cache", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const addSpy = jest.spyOn(window, "addEventListener");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <CartProvider>
        <CartDisplay />
      </CartProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0")
    );
    expect(addSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("logs error when cache read fails during sync", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const getSpy = jest.spyOn(Storage.prototype, "getItem");
    getSpy.mockReturnValueOnce(JSON.stringify(server.cart));
    getSpy.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
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

    expect(warnSpy).toHaveBeenCalled();
    expect(screen.getByTestId("count").textContent).toBe("1");
    warnSpy.mockRestore();
  });
});
