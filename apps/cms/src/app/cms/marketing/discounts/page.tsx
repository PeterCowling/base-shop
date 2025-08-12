"use client";

import { useEffect, useState } from "react";

interface Discount {
  code: string;
  description?: string;
  discountPercent: number;
  active: boolean;
  redemptions: number;
}

export default function DiscountsPage() {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [items, setItems] = useState<Discount[]>([]);

  async function load() {
    const res = await fetch("/api/marketing/discounts");
    if (res.ok) {
      setItems(await res.json());
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch("/api/marketing/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, description, discountPercent: percent, active: true }),
      });
      setStatus(res.ok ? "Saved" : "Failed");
      if (res.ok) {
        setCode("");
        setDescription("");
        setPercent(0);
        load();
      }
    } catch {
      setStatus("Failed");
    }
  }

  async function toggle(item: Discount) {
    await fetch("/api/marketing/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: item.code, active: !item.active }),
    });
    await load();
  }

  async function remove(code: string) {
    await fetch("/api/marketing/discounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    await load();
  }

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={create} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Discount %"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
        />
        <button className="border px-4 py-2" type="submit">
          Create
        </button>
        {status && <p>{status}</p>}
      </form>

      <ul className="space-y-2">
        {items.map((d) => (
          <li key={d.code} className="flex items-center gap-2">
            <span className="flex-1">
              {d.code} - {d.discountPercent}% ({d.redemptions})
            </span>
            <button
              className="border px-2 py-1"
              onClick={() => toggle(d)}
            >
              {d.active ? "Deactivate" : "Activate"}
            </button>
            <button
              className="border px-2 py-1"
              onClick={() => remove(d.code)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
