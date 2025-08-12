"use client";

import { useEffect, useState } from "react";
import { Input } from "../../atoms/shadcn";
import type { Product } from "../../organisms/ProductCard";

interface Props {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Maximum number of results to fetch */
  limit?: number;
}

export default function SearchBar({
  placeholder = "Search products…",
  limit = 5,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(q)}&limit=${limit}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setResults(data);
      } catch {
        // ignore errors
      }
    };
    load();
    return () => controller.abort();
  }, [query, limit]);

  return (
    <div className="space-y-2">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((p) => (
            <li key={p.id}>{p.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

