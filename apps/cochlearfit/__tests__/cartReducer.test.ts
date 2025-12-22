import { cartReducer, initialCartState } from "@/contexts/cart/cartReducer";
import { MAX_QTY, MIN_QTY } from "@/lib/quantity";

describe("cartReducer", () => {
  it("adds new items and clamps quantities", () => {
    const state = cartReducer(initialCartState, {
      type: "add",
      payload: { variantId: "classic-kids-sand", quantity: MAX_QTY + 5 },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0].variantId).toBe("classic-kids-sand");
    expect(state.items[0].quantity).toBe(MAX_QTY);
  });

  it("updates quantities for existing items", () => {
    const state = cartReducer(initialCartState, {
      type: "add",
      payload: { variantId: "classic-kids-sand", quantity: 2 },
    });

    const next = cartReducer(state, {
      type: "add",
      payload: { variantId: "classic-kids-sand", quantity: 1 },
    });

    expect(next.items[0].quantity).toBe(3);
  });

  it("removes items", () => {
    const state = cartReducer(initialCartState, {
      type: "add",
      payload: { variantId: "classic-kids-sand", quantity: 2 },
    });

    const next = cartReducer(state, {
      type: "remove",
      payload: { variantId: "classic-kids-sand" },
    });

    expect(next.items).toHaveLength(0);
  });

  it("sets quantities with clamping", () => {
    const state = cartReducer(initialCartState, {
      type: "add",
      payload: { variantId: "classic-kids-sand", quantity: 2 },
    });

    const next = cartReducer(state, {
      type: "setQuantity",
      payload: { variantId: "classic-kids-sand", quantity: 0 },
    });

    expect(next.items[0].quantity).toBe(MIN_QTY);
  });

  it("hydrates and normalizes items", () => {
    const next = cartReducer(initialCartState, {
      type: "hydrate",
      payload: [
        { variantId: "classic-kids-sand", quantity: 15 },
        { variantId: "", quantity: 2 },
      ],
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(MAX_QTY);
  });

  it("clears items", () => {
    const state = cartReducer(initialCartState, {
      type: "add",
      payload: { variantId: "classic-kids-sand", quantity: 2 },
    });

    const next = cartReducer(state, { type: "clear" });

    expect(next.items).toHaveLength(0);
  });
});
