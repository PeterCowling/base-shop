"use client";

import { useEffect, useState } from "react";

interface Discount {
  code: string;
  description?: string;
  discountPercent: number;
  active?: boolean;
  redemptions?: number;
}

export default function DiscountsPage() {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  async function load() {
    const res = await fetch("/api/marketing/discounts");
    if (res.ok) {
      setDiscounts(await res.json());
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
        body: JSON.stringify({ code, description, discountPercent: percent }),
      });
      setStatus(res.ok ? "Saved" : "Failed");
      if (res.ok) await load();
    } catch {
      setStatus("Failed");
    }
  }

  async function toggle(d: Discount) {
    await fetch("/api/marketing/discounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: d.code, active: !d.active }),
    });
    await load();
  }

  async function remove(code: string) {
    await fetch(`/api/marketing/discounts?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="p-4 space-y-6">
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

      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b p-2">Code</th>
            <th className="border-b p-2">Description</th>
            <th className="border-b p-2">Discount %</th>
            <th className="border-b p-2">Redemptions</th>
            <th className="border-b p-2">Status</th>
            <th className="border-b p-2" />
          </tr>
        </thead>
        <tbody>
          {discounts.map((d) => (
            <tr key={d.code} className="border-b">
              <td className="p-2 font-mono">{d.code}</td>
              <td className="p-2">{d.description}</td>
              <td className="p-2">{d.discountPercent}</td>
              <td className="p-2">{d.redemptions ?? 0}</td>
              <td className="p-2">
                <button
                  className="underline"
                  type="button"
                  onClick={() => toggle(d)}
                >
                  {d.active === false ? "Inactive" : "Active"}
                </button>
              </td>
              <td className="p-2">
                <button
                  className="text-red-600 underline"
                  type="button"
                  onClick={() => remove(d.code)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {discounts.length === 0 && (
            <tr>
              <td className="p-2" colSpan={6}>
                No discounts.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
