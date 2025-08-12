"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Input } from "../atoms/shadcn";

export interface SearchBarProps {
  /** Suggestions to filter based on the search query */
  suggestions: string[];
  /** Controlled query value */
  value?: string;
  /** Callback when the query changes */
  onValueChange?(value: string): void;
  /** Callback when a suggestion is selected */
  onSelect?(value: string): void;
  /** Callback when a search is manually submitted */
  onSearch?(value: string): void;
  placeholder?: string;
  /** Whether search results are loading */
  loading?: boolean;
}

export function SearchBar({
  suggestions,
  value,
  onValueChange,
  onSelect,
  onSearch,
  placeholder = "Search…",
  loading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(value ?? "");
  const [matches, setMatches] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Sync internal state with controlled value
  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

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
    onValueChange?.(value);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onValueChange?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (matches.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % matches.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
              return;
            }
            if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault();
              handleSelect(matches[activeIndex]);
              return;
            }
          }
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
        role="searchbox"
        aria-expanded={matches.length > 0}
      />
      <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4" />
      {loading && (
        <div role="status" className="absolute right-2 top-2 text-sm">
          Loading…
        </div>
      )}
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow"
        >
          {matches.map((m, i) => (
            <li
              role="option"
              aria-selected={i === activeIndex}
              data-active={i === activeIndex || undefined}
              key={m}
              onMouseDown={() => handleSelect(m)}
              className="text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1"
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
