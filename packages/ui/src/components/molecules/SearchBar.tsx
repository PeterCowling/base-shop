"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useId, useState } from "react";
import { Input } from "../atoms/shadcn";

export interface SearchBarProps {
  /** Suggestions to filter based on the search query */
  suggestions: string[];
  /** Callback when a suggestion is selected */
  onSelect?(value: string): void;
  /** Callback when a search is manually submitted */
  onSearch?(value: string): void;
  placeholder?: string;
  /** Accessible label for the search input */
  label: string;
}

export function SearchBar({
  suggestions,
  onSelect,
  onSearch,
  placeholder = "Search…",
  label,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (isSelecting || !focused) {
      setMatches([]);
      return;
    }
    if (!query) {
      setMatches([]);
      return;
    }
    const q = query.toLowerCase();
    setMatches(
      suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [query, suggestions, isSelecting, focused]);

  const handleSelect = (value: string) => {
    setIsSelecting(true);
    setQuery(value);
    setMatches([]);
    onSelect?.(value);
  };

  return (
    <div className="relative w-full max-w-sm">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Input
        id={inputId}
        type="search"
        aria-label={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setMatches([]);
            onSearch?.(query);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (isSelecting) {
            setIsSelecting(false);
            return;
          }
          onSearch?.(query);
        }}
        placeholder={placeholder}
        className="pr-8"
      />
      <MagnifyingGlassIcon
        className="text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4"
        data-token="--color-muted"
      />
      {matches.length > 0 && (
        <ul
          className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow"
          data-token="--color-bg"
        >
          {matches.map((m) => (
            <li
              key={m}
              onMouseDown={() => handleSelect(m)}
              className="text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1"
              data-token="--color-fg"
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
