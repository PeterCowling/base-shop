import React, { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from '@acme/i18n';
import { Inline, Stack } from '../../../atoms/primitives';
import { cn } from '../../../../utils/style/cn';

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
  placeholder,
  disabled = false,
  recentSearches = [],
  onSelectRecent,
  onClearRecent,
  showRecent = true,
  className = '',
  shortcutHint,
}: SearchBarProps) {
  const t = useTranslations();
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resolvedPlaceholder = placeholder ?? t('searchBar.placeholder');

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
    <div className={cn(className)}>
      <div className="relative">
        {/* Search input */}
        <Inline
          asChild
          alignY="center"
          gap={2}
          className={cn(
            'relative rounded-lg border bg-surface-1 px-3 py-2 shadow-sm transition-colors',
            isFocused ? 'border-primary' : 'border-border-2',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div>
            <Search className="h-5 w-5 shrink-0 text-muted" />

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={resolvedPlaceholder}
              disabled={disabled}
              className="flex-1 border-none bg-transparent text-sm text-fg placeholder:text-muted outline-none"
            />

            {shortcutHint && !hasValue && !isFocused && (
              <kbd className="hidden rounded border border-border-2 bg-muted/40 px-1.5 py-0.5 text-xs font-semibold text-muted sm:inline-block">
                {shortcutHint}
              </kbd>
            )}

            {hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  'grid min-h-11 min-w-11 place-items-center rounded-full text-muted transition-colors',
                  'hover:bg-muted/40 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
                aria-label={t('searchBar.clearLabel')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </Inline>

        {/* Recent searches dropdown */}
        {shouldShowDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 w-full rounded-lg border border-border-2 bg-surface-1 shadow-lg"
          >
            <Inline
              alignY="center"
              className="justify-between border-b border-border-2 px-3 py-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t('searchBar.recentTitle')}
              </span>
              {onClearRecent && (
                <button
                  type="button"
                  onClick={onClearRecent}
                  className={cn(
                    'min-h-11 min-w-11 text-xs font-medium text-muted transition-colors',
                    'hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  {t('searchBar.clearRecent')}
                </button>
              )}
            </Inline>
            <Stack asChild gap={1} className="max-h-60 overflow-y-auto py-1">
              <ul>
                {recentSearches.map((search) => (
                  <li key={search}>
                    <Inline asChild alignY="center" gap={2}>
                      <button
                        type="button"
                        onClick={() => handleSelectRecent(search)}
                        className={cn(
                          'min-h-11 min-w-11 w-full px-3 py-2 text-start text-sm text-fg transition-colors',
                          'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                        )}
                      >
                        <Search className="h-4 w-4 shrink-0 text-muted" />
                        <span className="truncate">{search}</span>
                      </button>
                    </Inline>
                  </li>
                ))}
              </ul>
            </Stack>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
