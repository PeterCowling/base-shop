"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useId, useState } from "react";
import { Input } from "../atoms/shadcn";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";

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
  placeholder,
  label,
  query: initialQuery = "",
}: SearchBarProps) {
  const t = useTranslations();
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
    <div className="relative w-full sm:w-80">
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
        placeholder={placeholder ?? (t("search.placeholder") as string)}
        className="pe-8"
      />
      <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-2 end-2 h-4 w-4" />
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="bg-background absolute mt-1 w-full rounded-md border shadow"
        >
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${inputId}-option-${i}`}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={() => handleSelect(m)}
              className={cn(
                "text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1", // i18n-exempt: class names
                i === highlightedIndex && "bg-accent text-accent-foreground" // i18n-exempt: class names
              )}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
