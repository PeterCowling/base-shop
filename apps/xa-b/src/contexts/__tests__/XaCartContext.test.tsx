import * as React from "react";
import { act, render, waitFor } from "@testing-library/react";

const CART_STORAGE_KEY = "XA_CART_V1";

const baseProduct = {
  id: "sku-1",
  slug: "studio-jacket",
  title: "Studio Jacket",
  status: "live",
  sizes: ["S", "M", "L"],
} as const;

describe("XaCartContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("throws when useCart is used outside provider", async () => {
    const { useCart } = await import("../XaCartContext");
    const Broken = () => {
      useCart();
      return null;
    };

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Broken />)).toThrow("useCart must be inside CartProvider");
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("hydrates sanitized cart from storage", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        "sku-1:M": { sku: baseProduct, qty: 2, size: "M" },
        bad: { sku: null, qty: "x" },
      }),
    );

    const { CartProvider, useCart } = await import("../XaCartContext");

    let latestCart: Record<string, { qty: number; size?: string }> = {};

    function Harness() {
      const [cart] = useCart();
      React.useEffect(() => {
        latestCart = cart;
      }, [cart]);
      return null;
    }

    render(
      <CartProvider>
        <Harness />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(Object.keys(latestCart)).toEqual(["sku-1:M"]);
      expect(latestCart["sku-1:M"]?.qty).toBe(1);
      expect(latestCart["sku-1:M"]?.size).toBe("M");
    });
  });

  it("enforces size requirement and status-based availability guardrails", async () => {
    const { CartProvider, useCart } = await import("../XaCartContext");

    let dispatch:
      | ((action: { type: "add"; sku: typeof baseProduct; size?: string; qty?: number }) => Promise<void>)
      | null = null;
    let totalQty = 0;

    function Harness() {
      const [cart, nextDispatch] = useCart();
      React.useEffect(() => {
        dispatch = nextDispatch;
        totalQty = Object.values(cart).reduce((sum, line) => sum + line.qty, 0);
      }, [cart, nextDispatch]);
      return null;
    }

    render(
      <CartProvider>
        <Harness />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(dispatch).not.toBeNull();
    });

    await expect(dispatch!({ type: "add", sku: baseProduct, qty: 1 })).rejects.toThrow("Size is required");

    await act(async () => {
      await dispatch!({ type: "add", sku: baseProduct, size: "M", qty: 2 });
    });
    await expect(dispatch!({ type: "add", sku: baseProduct, size: "M", qty: 2 })).rejects.toThrow(
      "Out of stock",
    );
    await expect(
      dispatch!({
        type: "add",
        sku: { ...baseProduct, id: "sku-2", slug: "studio-jacket-2", status: "out_of_stock" },
        size: "M",
        qty: 1,
      }),
    ).rejects.toThrow(
      "Out of stock",
    );

    expect(totalQty).toBe(1);
  });

  it("adds, updates, removes, and clears lines and persists state", async () => {
    const { CartProvider, useCart } = await import("../XaCartContext");

    let dispatch:
      | ((
          action:
            | { type: "add"; sku: typeof baseProduct; size?: string; qty?: number }
            | { type: "setQty"; id: string; qty: number }
            | { type: "remove"; id: string }
            | { type: "clear" },
        ) => Promise<void>)
      | null = null;
    let lineQty = 0;
    let totalQty = 0;

    function Harness() {
      const [cart, nextDispatch] = useCart();
      React.useEffect(() => {
        dispatch = nextDispatch;
        totalQty = Object.values(cart).reduce((sum, line) => sum + line.qty, 0);
        lineQty = cart["sku-1:M"]?.qty ?? 0;
      }, [cart, nextDispatch]);
      return null;
    }

    render(
      <CartProvider>
        <Harness />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(dispatch).not.toBeNull();
    });

    await act(async () => {
      await dispatch!({ type: "add", sku: baseProduct, size: "M", qty: 2 });
    });
    await waitFor(() => {
      expect(totalQty).toBe(1);
      expect(lineQty).toBe(1);
    });

    const afterAdd = localStorage.getItem(CART_STORAGE_KEY) ?? "";
    expect(afterAdd).toContain("sku-1:M");

    await act(async () => {
      await dispatch!({ type: "setQty", id: "sku-1:M", qty: 1 });
    });
    await waitFor(() => {
      expect(lineQty).toBe(1);
    });

    await act(async () => {
      await dispatch!({ type: "remove", id: "sku-1:M" });
    });
    await waitFor(() => {
      expect(totalQty).toBe(0);
    });

    await act(async () => {
      await dispatch!({ type: "add", sku: baseProduct, size: "M", qty: 2 });
    });
    await waitFor(() => {
      expect(totalQty).toBe(1);
    });

    await act(async () => {
      await dispatch!({ type: "clear" });
    });
    await waitFor(() => {
      expect(totalQty).toBe(0);
    });

    await act(async () => {
      await dispatch!({ type: "add", sku: baseProduct, size: "M", qty: 2 });
    });
    await waitFor(() => {
      expect(totalQty).toBe(1);
    });

    await act(async () => {
      await dispatch!({ type: "setQty", id: "sku-1:M", qty: 0 });
    });
    await waitFor(() => {
      expect(totalQty).toBe(0);
    });
  });
});
