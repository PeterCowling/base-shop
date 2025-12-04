import * as React from 'react';
import { useCart } from '@acme/platform-core/contexts/CartContext';

export function CartStatus(props: React.HTMLAttributes<HTMLDivElement>) {
  const [cart, dispatch] = useCart() as [Record<string, { qty: number }>, (a: any) => void];
  const count = React.useMemo(() => Object.values(cart).reduce((n, l) => n + (l?.qty ?? 0), 0), [cart]);
  const clear = React.useCallback(() => {
    for (const id of Object.keys(cart)) dispatch({ type: 'remove', id });
  }, [cart, dispatch]);
  const { style, ...rest } = props;
  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 12,
        zIndex: 20,
        ...style,
      }}
      {...rest}
      className="flex items-center gap-2"
    >
      <span className="rounded-full bg-surface-2 text-foreground px-3 py-2 text-sm shadow border border-border">
        Cart items: {count}
      </span>
      <button
        onClick={clear}
        className="text-sm px-3 py-2 rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-surface-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background min-h-10 min-w-10"
      >
        Clear
      </button>
    </div>
  );
}
