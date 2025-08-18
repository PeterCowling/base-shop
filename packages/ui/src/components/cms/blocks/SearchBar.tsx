"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Input } from "../../atoms/shadcn";
import { getShopFromPath } from "@acme/platform-core/utils";

interface Result {
  slug: string;
  title: string;
}

export interface SearchBarProps {
  placeholder?: string;
  limit?: number;
}

export default function SearchBar({
  placeholder = "Search products…",
  limit = 5,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = new URL("/api/products", origin);
        url.searchParams.set("q", query);
        const shop = getShopFromPath(
          typeof window !== "undefined" ? window.location.pathname : undefined
        );
        if (shop) url.searchParams.set("shop", shop);
        const res = await fetch(url.toString(), { signal: controller.signal });
        const data: Result[] = await res.json();
        setResults(data.slice(0, limit));
      } catch {
        // ignore
      }
    };
    load();
    return () => controller.abort();
  }, [query, limit]);

  const handleSelect = (r: Result) => {
    setQuery(r.title);
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pr-8"
      />
      <MagnifyingGlassIcon
        className="text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4"
        data-token="--color-muted-fg"
      />
      {results.length > 0 && (
        <ul
          className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow"
          data-token="--color-bg"
        >
          {results.map((r) => (
            <li
              key={r.slug}
              onMouseDown={() => handleSelect(r)}
              className="text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1"
              data-token="--color-fg"
            >
              {r.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
