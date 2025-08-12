"use client";

import { useEffect, useState } from "react";
import { Input } from "../../atoms/shadcn";
import { ProductGrid } from "../../organisms/ProductGrid";
import type { Product } from "../../organisms/ProductCard";

interface Props {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Maximum number of results to fetch */
  limit?: number;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search products…",
  limit,
  className,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const url = new URL("/api/products", window.location.origin);
        url.searchParams.set("q", query);
        if (limit) url.searchParams.set("limit", String(limit));
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) return;
        const data: Product[] = await res.json();
        setResults(data);
      } catch {
        /* ignore errors */
      }
    };
    load();
    return () => controller.abort();
  }, [query, limit]);

  return (
    <div className={className}>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mb-4"
      />
      {results.length > 0 ? (
        <ProductGrid products={results} minItems={1} maxItems={limit} />
      ) : query ? (
        <p>No results found.</p>
      ) : null}
    </div>
  );
}

