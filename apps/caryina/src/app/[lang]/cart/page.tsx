"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useCart } from "@acme/platform-core/contexts/CartContext";

function formatEur(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function CartPage() {
  const [cart, dispatch] = useCart();
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang ?? "en";

  const lines = Object.entries(cart);

  if (!lines.length) {
    return (
      <section className="space-y-6 py-12 text-center">
        <h1 className="text-3xl font-display">Your cart is empty</h1>
        <p className="text-muted-foreground">Add some items to get started.</p>
        <Link href={`/${lang}/shop`} className="text-sm hover:underline">
          Continue shopping
        </Link>
      </section>
    );
  }

  const total = lines.reduce((sum, [, line]) => sum + line.sku.price * line.qty, 0);

  function handleDecrease(key: string, qty: number) {
    if (qty <= 1) {
      void dispatch({ type: "remove", id: key });
    } else {
      void dispatch({ type: "setQty", id: key, qty: qty - 1 });
    }
  }

  function handleIncrease(key: string, qty: number) {
    void dispatch({ type: "setQty", id: key, qty: qty + 1 });
  }

  function handleRemove(key: string) {
    void dispatch({ type: "remove", id: key });
  }

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-display">Your cart</h1>
      <ul className="divide-y list-none" data-cy="cart-list">
        {lines.map(([key, line]) => (
          <li key={key} className="flex items-center gap-4 py-4">
            <div className="flex-1 space-y-0.5">
              <p className="font-medium">{String(line.sku.title)}</p>
              <p className="text-sm text-muted-foreground">{formatEur(line.sku.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => handleDecrease(key, line.qty)}
                className="flex h-11 w-11 items-center justify-center rounded-full border text-sm hover:bg-muted"
              >
                {"\u2212"}
              </button>
              <span className="w-6 text-center text-sm" data-cy="cart-qty">
                {line.qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => handleIncrease(key, line.qty)}
                className="flex h-11 w-11 items-center justify-center rounded-full border text-sm hover:bg-muted"
              >
                +
              </button>
            </div>
            <p className="w-20 text-end text-sm font-medium">
              {formatEur(line.sku.price * line.qty)}
            </p>
            <button
              type="button"
              aria-label="Remove item"
              onClick={() => handleRemove(key)}
              className="min-h-11 min-w-11 text-sm text-muted-foreground hover:text-foreground"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t pt-4">
        <p className="font-medium">Total</p>
        <p className="text-xl font-medium" data-cy="cart-total">
          {formatEur(total)}
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/${lang}/checkout`}
          className="btn-primary rounded-full px-8 py-3 text-sm"
        >
          Proceed to payment
        </Link>
        <Link
          href={`/${lang}/shop`}
          className="rounded-full px-6 py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
