"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Input } from "../atoms/shadcn";

export interface SearchBarProps {
  /** Suggestions to filter based on the search query */
  suggestions: string[];
  /** Callback when a suggestion is selected */
  onSelect?(value: string): void;
  placeholder?: string;
}

export function SearchBar({
  suggestions,
  onSelect,
  placeholder = "Search…",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<string[]>([]);

  useEffect(() => {
    if (!query) {
      setMatches([]);
      return;
    }
    const q = query.toLowerCase();
    setMatches(
      suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [query, suggestions]);

  const handleSelect = (value: string) => {
    setQuery(value);
    setMatches([]);
    onSelect?.(value);
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
      <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4" />
      {matches.length > 0 && (
        <ul className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow">
          {matches.map((m) => (
            <li
              key={m}
              onMouseDown={() => handleSelect(m)}
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1"
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
