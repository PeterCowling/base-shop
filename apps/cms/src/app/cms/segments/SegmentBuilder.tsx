"use client";

import { useState } from "react";

interface Filter {
  value: string;
}

export default function SegmentBuilder() {
  const [shop, setShop] = useState("");
  const [id, setId] = useState("");
  const [filters, setFilters] = useState<Filter[]>([{ value: "" }]);
  const [status, setStatus] = useState<string | null>(null);

  function updateFilter(idx: number, value: string) {
    setFilters((prev) => prev.map((f, i) => (i === idx ? { value } : f)));
  }

  function addFilter() {
    setFilters((prev) => [...prev, { value: "" }]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const body = {
        shop,
        id,
        filters: filters
          .filter((f) => f.value)
          .map((f) => ({ field: "type", value: f.value })),
      };
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setStatus(res.ok ? "Saved" : "Failed");
      if (res.ok) {
        setId("");
        setFilters([{ value: "" }]);
      }
    } catch {
      setStatus("Failed");
    }
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <input
        className="w-full border p-2"
        placeholder="Shop"
        value={shop}
        onChange={(e) => setShop(e.target.value)}
      />
      <input
        className="w-full border p-2"
        placeholder="Segment ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      {filters.map((f, i) => (
        <input
          key={i}
          className="w-full border p-2"
          placeholder="Event type"
          value={f.value}
          onChange={(e) => updateFilter(i, e.target.value)}
        />
      ))}
      <div className="flex gap-2">
        <button type="button" className="border px-4 py-2" onClick={addFilter}>
          Add filter
        </button>
        <button type="submit" className="border px-4 py-2">
          Save
        </button>
      </div>
      {status && <p>{status}</p>}
    </form>
  );
}
