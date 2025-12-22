import type { CartAction, CartItem, CartState } from "@/types/cart";
import { clampQuantity, MIN_QTY } from "@/lib/quantity";

export const initialCartState: CartState = {
  items: [],
  updatedAt: 0,
};

const withTimestamp = (items: CartItem[]): CartState => ({
  items,
  updatedAt: Date.now(),
});

const normalizeItems = (items: CartItem[]): CartItem[] => {
  return items
    .map((item) => ({
      variantId: item.variantId,
      quantity: clampQuantity(item.quantity),
    }))
    .filter((item) => item.variantId && item.quantity >= MIN_QTY);
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate": {
      const items = normalizeItems(action.payload);
      return withTimestamp(items);
    }
    case "add": {
      const { variantId, quantity } = action.payload;
      const nextItems = [...state.items];
      const index = nextItems.findIndex((item) => item.variantId === variantId);
      const nextQuantity = clampQuantity(quantity);
      if (index >= 0) {
        const existing = nextItems[index];
        if (!existing) {
          return withTimestamp(nextItems);
        }
        nextItems[index] = {
          variantId: existing.variantId,
          quantity: clampQuantity(existing.quantity + nextQuantity),
        };
      } else {
        nextItems.push({ variantId, quantity: nextQuantity });
      }
      return withTimestamp(nextItems);
    }
    case "remove": {
      const nextItems = state.items.filter(
        (item) => item.variantId !== action.payload.variantId
      );
      return withTimestamp(nextItems);
    }
    case "setQuantity": {
      const nextItems = state.items.map((item) => {
        if (item.variantId !== action.payload.variantId) return item;
        return {
          ...item,
          quantity: clampQuantity(action.payload.quantity),
        };
      });
      return withTimestamp(normalizeItems(nextItems));
    }
    case "clear": {
      return withTimestamp([]);
    }
    default:
      return state;
  }
}
