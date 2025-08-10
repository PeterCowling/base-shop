"use client";

import { useState } from "react";

export default function DiscountsPage() {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

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
    } catch {
      setStatus("Failed");
    }
  }

  return (
    <form onSubmit={create} className="space-y-2 p-4">
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
  );
}
