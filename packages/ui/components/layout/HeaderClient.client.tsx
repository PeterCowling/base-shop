"use client";

import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

export default function HeaderClient({
  lang,
  initialQty,
  height = "h-16",
  padding = "px-6",
}: {
  lang: string;
  initialQty: number;
  height?: string;
  padding?: string;
}) {
  const [cart] = useCart();
  const [qty, setQty] = useState(initialQty);

  // keep qty in sync after hydration
  useEffect(() => {
    setQty(Object.values(cart).reduce((s, line) => s + line.qty, 0));
  }, [cart]);

  return (
    <header
      className={cn("flex items-center justify-between", height, padding)}
    >
      <Link href={`/${lang}`} className="text-xl font-bold">
        Base-Shop
      </Link>

      <nav className="flex items-center gap-6">
        <Link href={`/${lang}/shop`}>Shop</Link>
        <Link href={`/${lang}/checkout`} className="relative hover:underline">
          Cart
          {qty > 0 && (
            <span className="absolute -top-2 -right-3 rounded-full bg-red-600 px-1.5 text-xs text-white">
              {qty}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
