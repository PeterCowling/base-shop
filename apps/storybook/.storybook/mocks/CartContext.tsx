import * as React from "react";

type SKU = { id: string; title: string; price: number };
type CartLine = { sku: SKU; qty: number; size?: string };
type CartState = Record<string, CartLine>;

type Action =
  | { type: "add"; sku: SKU; size?: string }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number };

const Ctx = React.createContext<[CartState, (a: Action) => void] | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>({});
  const dispatch = React.useCallback((a: Action) => {
    setState((prev) => {
      switch (a.type) {
        case "add": {
          const id = a.sku.id;
          const current = prev[id];
          const nextQty = (current?.qty ?? 0) + 1;
          return { ...prev, [id]: { sku: a.sku, qty: nextQty, size: a.size } };
        }
        case "remove": {
          const { [a.id]: _removed, ...rest } = prev;
          return rest;
        }
        case "setQty": {
          const line = prev[a.id];
          if (!line) return prev;
          return { ...prev, [a.id]: { ...line, qty: Math.max(0, a.qty) } };
        }
      }
    });
  }, []);
  const value = React.useMemo(() => [state, dispatch] as [CartState, (a: Action) => void], [state, dispatch]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider (storybook mock)");
  return v;
}

