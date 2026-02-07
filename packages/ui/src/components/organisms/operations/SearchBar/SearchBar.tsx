import React, { type ChangeEvent, type KeyboardEvent,useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  /**
   * Current search value
   */
  value: string;

  /**
   * Callback when search value changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Whether the search bar is disabled
   */
  disabled?: boolean;

  /**
   * Optional list of recent searches to display
   */
  recentSearches?: string[];

  /**
   * Callback when a recent search is selected
   */
  onSelectRecent?: (search: string) => void;

  /**
   * Callback when recent searches should be cleared
   */
  onClearRecent?: () => void;

  /**
   * Whether to show the recent searches dropdown
   * @default true
   */
  showRecent?: boolean;

  /**
   * Whether to autofocus the input
   */
  autoFocus?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Keyboard shortcut hint to display (e.g., "⌘K")
   */
  shortcutHint?: string;
}

/**
 * SearchBar - Filterable search input with recent queries
 *
 * Features:
 * - Real-time search input
 * - Optional recent searches dropdown
 * - Clear button when input has value
 * - Keyboard navigation support
 * - Dark mode support
 * - Context-aware spacing
 * - Optional keyboard shortcut hint
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search inventory..."
 *   recentSearches={['Product A', 'Product B']}
 *   onSelectRecent={(search) => setSearchQuery(search)}
 *   onClearRecent={() => clearRecentSearches()}
 *   shortcutHint="⌘K"
 * />
 * ```
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  recentSearches = [],
  onSelectRecent,
  onClearRecent,
  showRecent = true,
  autoFocus = false,
  className = '',
  shortcutHint,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasValue = value.length > 0;
  const hasRecent = recentSearches.length > 0;
  const shouldShowDropdown = showRecent && showDropdown && hasRecent && !hasValue;

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSelectRecent = (search: string) => {
    onSelectRecent?.(search);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (hasValue) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div
        className={`
          relative flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition-colors
          ${isFocused ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-border'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          dark:bg-darkSurface dark:border-darkSurface
          ${isFocused ? 'dark:border-darkAccentGreen dark:ring-darkAccentGreen/20' : ''}
        `}
      >
        <Search className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="flex-1 border-none bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none dark:text-darkAccentGreen dark:placeholder-gray-500"
        />

        {shortcutHint && !hasValue && !isFocused && (
          <kbd className="hidden rounded border border-border bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600 sm:inline-block dark:border-darkBg dark:bg-darkBg dark:text-gray-400">
            {shortcutHint}
          </kbd>
        )}

        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-500 dark:hover:bg-darkBg dark:hover:text-darkAccentGreen"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Recent searches dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-darkSurface dark:bg-darkSurface"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-darkBg">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Recent Searches
            </span>
            {onClearRecent && (
              <button
                type="button"
                onClick={onClearRecent}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-darkAccentGreen"
              >
                Clear
              </button>
            )}
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {recentSearches.map((search, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSelectRecent(search)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 dark:text-darkAccentGreen dark:hover:bg-darkBg"
                >
                  <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{search}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
