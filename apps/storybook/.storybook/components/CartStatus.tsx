import * as React from 'react';
import { useCart } from '@acme/platform-core/contexts/CartContext';

export function CartStatus() {
  const [cart, dispatch] = useCart() as [Record<string, { qty: number }>, (a: any) => void];
  const count = React.useMemo(() => Object.values(cart).reduce((n, l) => n + (l?.qty ?? 0), 0), [cart]);
  const clear = React.useCallback(() => {
    for (const id of Object.keys(cart)) dispatch({ type: 'remove', id });
  }, [cart, dispatch]);
  return (
    <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ background: '#111', color: '#fff', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>
        Cart items: {count}
      </span>
      <button onClick={clear} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #999', background: '#fff' }}>Clear</button>
    </div>
  );
}
