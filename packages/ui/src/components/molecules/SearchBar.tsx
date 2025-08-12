"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Input } from "../atoms/shadcn";

export interface SearchBarProps {
  /** Suggestions to filter based on the search query */
  suggestions: string[];
  /** Callback when a suggestion is selected */
  onSelect?(value: string): void;
  /** Callback when a search is manually submitted */
  onSearch?(value: string): void;
  placeholder?: string;
}

export function SearchBar({
  suggestions,
  onSelect,
  onSearch,
  placeholder = "Search…",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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
    setActiveIndex(-1);
  }, [query, suggestions, isSelecting, focused]);

  const handleSelect = (value: string) => {
    setIsSelecting(true);
    setQuery(value);
    setMatches([]);
    setActiveIndex(-1);
    onSelect?.(value);
    setTimeout(() => setIsSelecting(false), 0);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Input
        type="search"
        value={query}
        aria-activedescendant={
          activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
        }
        aria-controls={matches.length > 0 ? "search-options" : undefined}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && matches.length > 0) {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % matches.length);
          } else if (e.key === "ArrowUp" && matches.length > 0) {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter") {
            if (activeIndex >= 0 && matches[activeIndex]) {
              e.preventDefault();
              handleSelect(matches[activeIndex]);
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
        className="pr-8"
      />
      <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4" />
      {matches.length > 0 && (
        <ul
          id="search-options"
          role="listbox"
          className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow"
        >
          {matches.map((m, idx) => (
            <li
              id={`search-option-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              key={m}
              onMouseDown={() => handleSelect(m)}
              className={`text-fg cursor-pointer px-3 py-1 hover:bg-accent hover:text-accent-foreground ${
                idx === activeIndex ? "bg-accent text-accent-foreground" : ""
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
