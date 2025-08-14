// packages/template-app/src/app/account/swaps/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { CartState } from "@acme/types";

export default function SwapPage() {
  const [cart, setCart] = useState<CartState>({});
  const [oldSku, setOldSku] = useState<string | null>(null);
  const [newSku, setNewSku] = useState("");

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setCart(data.cart || {}));
  }, []);

  const handleSwap = async () => {
    if (!oldSku || !newSku) return;
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: oldSku }),
    });
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: { id: newSku }, qty: 1 }),
    });
    const res = await fetch("/api/cart");
    const data = await res.json();
    setCart(data.cart || {});
    setOldSku(null);
    setNewSku("");
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Swap Items</h1>
      <ul className="mb-4 space-y-2">
        {Object.entries(cart).map(([id, line]) => (
          <li key={id} className="flex items-center gap-2">
            <input
              type="radio"
              name="oldSku"
              value={id}
              checked={oldSku === id}
              onChange={() => setOldSku(id)}
            />
            <span>{line.sku.title}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New SKU"
          value={newSku}
          onChange={(e) => setNewSku(e.target.value)}
          className="w-40 rounded border px-2 py-1"
        />
        <button
          className="rounded bg-blue-500 px-4 py-1 text-white"
          onClick={handleSwap}
        >
          Swap
        </button>
      </div>
    </div>
  );
}
