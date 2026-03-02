import * as React from "react";
import { act, render, waitFor } from "@testing-library/react";

const WISHLIST_STORAGE_KEY = "XA_WISHLIST_V1";

const productA = { id: "sku-a" } as const;
const productB = { id: "sku-b" } as const;

describe("XaWishlistContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  it("throws when useWishlist is used outside provider", async () => {
    const { useWishlist } = await import("../XaWishlistContext");
    const Broken = () => {
      useWishlist();
      return null;
    };

    expect(() => render(<Broken />)).toThrow("useWishlist must be inside WishlistProvider");
  });

  it("hydrates deduped ids from storage", async () => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(["sku-a", "sku-a", 42, "sku-b"]));
    const { WishlistProvider, useWishlist } = await import("../XaWishlistContext");

    let latestWishlist: string[] = [];

    function Harness() {
      const [wishlist] = useWishlist();
      React.useEffect(() => {
        latestWishlist = wishlist;
      }, [wishlist]);
      return null;
    }

    render(
      <WishlistProvider>
        <Harness />
      </WishlistProvider>,
    );

    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-a", "sku-b"]);
    });
  });

  it("supports add/toggle/remove/clear and persists", async () => {
    const { WishlistProvider, useWishlist } = await import("../XaWishlistContext");

    let dispatch:
      | ((
          action:
            | { type: "add"; sku: typeof productA }
            | { type: "remove"; skuId: string }
            | { type: "toggle"; sku: typeof productA }
            | { type: "clear" },
        ) => void)
      | null = null;
    let latestWishlist: string[] = [];

    function Harness() {
      const [wishlist, nextDispatch] = useWishlist();
      React.useEffect(() => {
        latestWishlist = wishlist;
        dispatch = nextDispatch;
      }, [wishlist, nextDispatch]);
      return null;
    }

    render(
      <WishlistProvider>
        <Harness />
      </WishlistProvider>,
    );

    await waitFor(() => {
      expect(dispatch).not.toBeNull();
    });

    act(() => {
      dispatch!({ type: "add", sku: productA });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-a"]);
    });

    // Duplicate add should be ignored.
    act(() => {
      dispatch!({ type: "add", sku: productA });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-a"]);
    });

    act(() => {
      dispatch!({ type: "add", sku: productB });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-b", "sku-a"]);
    });

    act(() => {
      dispatch!({ type: "toggle", sku: productA });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-b"]);
    });

    act(() => {
      dispatch!({ type: "add", sku: productA });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-a", "sku-b"]);
    });

    act(() => {
      dispatch!({ type: "remove", skuId: "sku-a" });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual(["sku-b"]);
    });

    act(() => {
      dispatch!({ type: "clear" });
    });
    await waitFor(() => {
      expect(latestWishlist).toEqual([]);
    });

    const persisted = localStorage.getItem(WISHLIST_STORAGE_KEY);
    expect(persisted).toBe("[]");
  });
});
