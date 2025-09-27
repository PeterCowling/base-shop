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
  /** Optional search query to display */
  query?: string;
}

export function SearchBar({
  suggestions,
  onSelect,
  onSearch,
  placeholder = "Search…",
  label,
  query: initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [matches, setMatches] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputId = useId();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (isSelecting || !focused) {
      setMatches((prev) => (prev.length ? [] : prev));
      setHighlightedIndex((prev) => (prev !== -1 ? -1 : prev));
      return;
    }
    if (!query) {
      setMatches((prev) => (prev.length ? [] : prev));
      setHighlightedIndex((prev) => (prev !== -1 ? -1 : prev));
      return;
    }
    const q = query.toLowerCase();
    const nextMatches = suggestions
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 5);
    setMatches((prev) =>
      prev.length === nextMatches.length && prev.every((v, i) => v === nextMatches[i])
        ? prev
        : nextMatches
    );
    setHighlightedIndex((prev) => (prev !== -1 ? -1 : prev));
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
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (matches.length > 0) {
              setHighlightedIndex((prev) => (prev + 1) % matches.length);
            }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (matches.length > 0) {
              setHighlightedIndex((prev) =>
                (prev - 1 + matches.length) % matches.length
              );
            }
          } else if (e.key === "Enter") {
            if (highlightedIndex >= 0 && matches[highlightedIndex]) {
              e.preventDefault();
              handleSelect(matches[highlightedIndex]);
            } else {
              setMatches([]);
              onSearch?.(query);
            }
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
        className="pe-8"
      />
      <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-2 end-2 h-4 w-4" />
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow"
        >
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${inputId}-option-${i}`}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={() => handleSelect(m)}
              className={`text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1 ${
                i === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
