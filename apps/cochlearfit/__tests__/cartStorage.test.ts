import { loadCart, saveCart } from "@/contexts/cart/cartStorage";
import { MAX_QTY } from "@/lib/quantity";

const STORAGE_KEY = "cochlearfit:cart";

describe("cartStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when storage is empty or invalid", () => {
    expect(loadCart()).toBeNull();
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadCart()).toBeNull();
  });

  it("returns null when versions mismatch", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 0, items: [{ variantId: "classic-kids-sand", quantity: 2 }] })
    );
    expect(loadCart()).toBeNull();
  });

  it("loads and clamps stored cart items", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [
          { variantId: "classic-kids-sand", quantity: MAX_QTY + 2 },
          { variantId: "", quantity: 1 },
        ],
      })
    );

    const items = loadCart();
    expect(items).toEqual([
      { variantId: "classic-kids-sand", quantity: MAX_QTY },
      { variantId: "", quantity: 1 },
    ]);
  });

  it("saves cart items with version and clamped quantities", () => {
    saveCart([{ variantId: "classic-kids-sand", quantity: MAX_QTY + 3 }]);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain("\"version\":1");
    expect(stored).toContain(`\"quantity\":${MAX_QTY}`);
  });
});
