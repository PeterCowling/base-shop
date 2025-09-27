"use client";

import { useCart } from "@acme/platform-core/contexts/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "../../utils/style";
import ThemeToggle from "../ThemeToggle";
import { CurrencySwitcher } from "../molecules";

export default function HeaderClient({
  lang,
  initialQty,
  nav = [],
  height = "h-16",
  padding = "px-6",
}: {
  lang: string;
  initialQty: number;
  nav?: { label: string; url: string }[];
  height?: string;
  padding?: string;
}) {
  const [cart] = useCart();
  const [qty, setQty] = useState(initialQty);

  // keep qty in sync after hydration
  useEffect(() => {
    setQty(
      (Object.values(cart) as Array<{ qty: number }>).reduce(
        (s, line) => s + line.qty,
        0,
      ),
    );
  }, [cart]);

  return (
    <header
      className={cn("flex items-center justify-between", height, padding)}
    >
      <Link href={`/${lang}`} className="text-xl font-bold">
        Base-Shop
      </Link>

      <nav className="flex items-center gap-6" aria-label="Main navigation">
        {nav.map((item) => (
          <Link
            key={item.url}
            href={item.url.startsWith("/") ? `/${lang}${item.url}` : item.url}
          >
            {item.label}
          </Link>
        ))}
        <CurrencySwitcher />
        <ThemeToggle />
        <Link href={`/${lang}/checkout`} className="relative hover:underline">
          Cart
          {qty > 0 && (
            <span
              className="absolute -top-2 -end-3 rounded-full px-1.5 text-xs bg-danger text-danger-foreground"
              data-token="--color-danger"
            >
              <span
                className="text-danger-foreground"
                data-token="--color-danger-fg"
              >
                {qty}
              </span>
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
