/* i18n-exempt file -- UI-000: Non-user-facing literals (class names, aria roles, HTML attributes, key names). Visible copy comes from props or i18n keys. */
"use client";

import { useId, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import type { TranslatableText } from "@acme/types/i18n";

import { Input } from "../primitives";
import { cn } from "../utils/style";

export interface SearchBarProps {
  /** Suggestions to filter based on the search query */
  suggestions: string[];
  /** Callback when a suggestion is selected */
  onSelect?(value: string): void;
  /** Callback when a search is manually submitted */
  onSearch?(value: string): void;
  placeholder?: TranslatableText;
  /** Accessible label for the search input */
  label: string;
  /** Optional search query to display */
  query?: string;
  /** Locale to resolve inline placeholder */
  locale?: Locale;
}

export function SearchBar({
  suggestions,
  onSelect,
  onSearch,
  placeholder,
  label,
  query: initialQuery = "",
  locale = "en",
}: SearchBarProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const [query, setQuery] = useState(initialQuery);
  const [isSelecting, setIsSelecting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputId = useId();

  const matches = useMemo(() => {
    if (isSelecting || !focused || !query) {
      return [] as string[];
    }
    const normalizedQuery = query.toLowerCase();
    return suggestions
      .filter((suggestion) => suggestion.toLowerCase().includes(normalizedQuery))
      .slice(0, 5);
  }, [focused, isSelecting, query, suggestions]);

  const handleSelect = (value: string) => {
    setIsSelecting(true);
    setQuery(value);
    setHighlightedIndex(-1);
    onSelect?.(value);
  };

  return (
    <div className="relative w-full sm:w-80"> {/* i18n-exempt -- UI-000: class names */}
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Input
        id={inputId}
        type="search"
        aria-label={label}
        value={query}
        onChange={(e) => {
          setIsSelecting(false);
          setQuery(e.target.value);
          setHighlightedIndex(-1);
        }}
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
              setHighlightedIndex(-1);
              onSearch?.(query);
            }
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setHighlightedIndex(-1);
          if (isSelecting) {
            setIsSelecting(false);
            return;
          }
          onSearch?.(query);
        }}
        placeholder={(() => {
          if (!placeholder) return t("search.placeholder") as string;
          if (typeof placeholder === "string") return placeholder;
          return resolveText(placeholder, locale, t);
        })()}
        className="pe-8" /* i18n-exempt -- UI-000: class names */
      />
      <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-2 end-2 h-4 w-4" /> {/* i18n-exempt -- UI-000: class names */}
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="bg-background absolute mt-1 w-full rounded-md border shadow" /* i18n-exempt -- UI-000: class names */
        >
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${inputId}-option-${i}`}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={() => handleSelect(m)}
              className={cn(
                "text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1", // i18n-exempt -- UI-000: class names
                i === highlightedIndex && "bg-accent text-accent-foreground" // i18n-exempt -- UI-000: class names
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
