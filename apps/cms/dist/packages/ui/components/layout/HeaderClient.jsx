"use client";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function HeaderClient({ lang, initialQty, }) {
    const [cart] = useCart();
    const [qty, setQty] = useState(initialQty);
    // keep qty in sync after hydration
    useEffect(() => {
        setQty(Object.values(cart).reduce((s, line) => s + line.qty, 0));
    }, [cart]);
    return (<header className="h-16 flex items-center justify-between px-6">
      <Link href={`/${lang}`} className="font-bold text-xl">
        Base-Shop
      </Link>

      <nav className="flex items-center gap-6">
        <Link href={`/${lang}/shop`}>Shop</Link>
        <Link href={`/${lang}/checkout`} className="relative hover:underline">
          Cart
          {qty > 0 && (<span className="absolute -right-3 -top-2 bg-red-600 text-white text-xs rounded-full px-1.5">
              {qty}
            </span>)}
        </Link>
      </nav>
    </header>);
}
