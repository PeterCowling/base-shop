/**
 * GuideSearchBar - Search input for guides with autocomplete suggestions
 */

import { useCallback, useId, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const SEARCH_CONTAINER_CLASSES = [
  "relative",
  "w-full",
  "sm:w-80",
] as const;

const SEARCH_INPUT_CLASSES = [
  "w-full",
  "rounded-full",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface",
  "px-4",
  "py-2",
  "pe-10",
  "text-sm",
  "text-brand-text",
  "placeholder:text-brand-muted",
  "focus:border-brand-primary",
  "focus:outline-none",
  "focus:ring-2",
  "focus:ring-brand-primary/20",
  "dark:border-brand-outline/60",
  "dark:bg-brand-text/10",
  "dark:text-brand-surface",
  "dark:placeholder:text-brand-muted-dark",
  "dark:focus:border-brand-secondary",
  "dark:focus:ring-brand-secondary/20",
] as const;

const SEARCH_ICON_CLASSES = [
  "pointer-events-none",
  "absolute",
  "end-3",
  "top-1/2",
  "-translate-y-1/2",
  "h-4",
  "w-4",
  "text-brand-muted",
  "dark:text-brand-muted-dark",
] as const;

const SUGGESTIONS_CONTAINER_CLASSES = [
  "absolute",
  "z-10",
  "mt-1",
  "w-full",
  "rounded-lg",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface",
  "shadow-lg",
  "dark:border-brand-outline/60",
  "dark:bg-brand-text/95",
] as const;

const SUGGESTION_ITEM_CLASSES = [
  "cursor-pointer",
  "px-4",
  "py-2",
  "text-sm",
  "text-brand-paragraph",
  "hover:bg-brand-primary/10",
  "hover:text-brand-primary",
  "dark:text-brand-muted-dark",
  "dark:hover:bg-brand-secondary/20",
  "dark:hover:text-brand-secondary",
] as const;

const SUGGESTION_ITEM_ACTIVE_CLASSES = [
  "bg-brand-primary/10",
  "text-brand-primary",
  "dark:bg-brand-secondary/20",
  "dark:text-brand-secondary",
] as const;

const SUGGESTION_HINT_CLASSES = [
  "px-4",
  "py-2",
  "text-xs",
  "text-brand-muted",
  "dark:text-brand-muted-dark",
  "italic",
] as const;

export interface GuideSearchBarProps {
  /** Current search query */
  query: string;
  /** Callback when query changes */
  onChange: (query: string) => void;
  /** Fuzzy suggestions to show */
  suggestions?: string[];
  /** Whether search is in progress */
  isSearching?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Accessible label */
  label?: string;
  /** Callback when a suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void;
  /** Callback when search is submitted (Enter key) */
  onSubmit?: (query: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Search icon SVG component
 */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function GuideSearchBar({
  query,
  onChange,
  suggestions = [],
  isSearching = false,
  placeholder,
  label,
  onSuggestionClick,
  onSubmit,
  className,
}: GuideSearchBarProps): JSX.Element {
  const { t } = useTranslation("guides");
  const inputId = useId();
  const listboxId = useId();

  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedPlaceholder = placeholder ?? t("search.placeholder", { defaultValue: "Search guides..." });
  const resolvedLabel = label ?? t("search.label", { defaultValue: "Search guides" });

  const showSuggestions = isFocused && suggestions.length > 0 && query.length > 0;

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) {
        if (e.key === "Enter") {
          onSubmit?.(query);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            onChange(suggestions[highlightedIndex]);
            onSuggestionClick?.(suggestions[highlightedIndex]);
          } else {
            onSubmit?.(query);
          }
          break;
        case "Escape":
          inputRef.current?.blur();
          break;
      }
    },
    [showSuggestions, suggestions, highlightedIndex, onChange, onSuggestionClick, onSubmit, query]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      onSuggestionClick?.(suggestion);
      inputRef.current?.focus();
    },
    [onChange, onSuggestionClick]
  );

  return (
    <div className={clsx(SEARCH_CONTAINER_CLASSES, className)}>
      <label htmlFor={inputId} className="sr-only">
        {resolvedLabel}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay to allow click events on suggestions
          setTimeout(() => setIsFocused(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        className={clsx(SEARCH_INPUT_CLASSES)}
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? listboxId : undefined}
        aria-activedescendant={
          showSuggestions && highlightedIndex >= 0
            ? `${listboxId}-option-${highlightedIndex}`
            : undefined
        }
        aria-autocomplete="list"
      />
      <SearchIcon className={clsx(SEARCH_ICON_CLASSES)} />

      {showSuggestions && (
        <ul
          id={listboxId}
          role="listbox"
          className={clsx(SUGGESTIONS_CONTAINER_CLASSES)}
          aria-label={t("search.suggestions", { defaultValue: "Search suggestions" })}
        >
          <li className={clsx(SUGGESTION_HINT_CLASSES)}>
            {t("search.didYouMean", { defaultValue: "Did you mean:" })}
          </li>
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={clsx(
                SUGGESTION_ITEM_CLASSES,
                index === highlightedIndex && SUGGESTION_ITEM_ACTIVE_CLASSES
              )}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {isSearching && (
        <span className="sr-only" role="status" aria-live="polite">
          {t("search.searching", { defaultValue: "Searching..." })}
        </span>
      )}
    </div>
  );
}
