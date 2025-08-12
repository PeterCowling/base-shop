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
  /** Optional initial query */
  query?: string;
}

export function SearchBar({
  suggestions,
  onSelect,
  onSearch,
  placeholder = "Search…",
  query = "",
}: SearchBarProps) {
  const [value, setValue] = useState(query);
  useEffect(() => setValue(query), [query]);
  const [matches, setMatches] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (isSelecting || !focused) {
      setMatches([]);
      return;
    }
    if (!value) {
      setMatches([]);
      return;
    }
    const q = value.toLowerCase();
    setMatches(
      suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [value, suggestions, isSelecting, focused]);

  const handleSelect = (value: string) => {
    setIsSelecting(true);
    setValue(value);
    setMatches([]);
    onSelect?.(value);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setMatches([]);
            onSearch?.(value);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (isSelecting) {
            setIsSelecting(false);
            return;
          }
          onSearch?.(value);
        }}
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
