import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, X, Search, Loader2 } from "lucide-react";
import { useTranslations } from "@acme/i18n";
import { Cluster, Inline, Stack } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

export interface ComboBoxOption<T = string> {
  /**
   * Unique identifier for the option
   */
  value: T;
  /**
   * Display label for the option
   */
  label: string;
  /**
   * Optional description shown below the label
   */
  description?: string;
  /**
   * Whether the option is disabled
   */
  disabled?: boolean;
  /**
   * Optional icon to show before the label
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Optional group/category for grouped display
   */
  group?: string;
}

export interface ComboBoxProps<T = string> {
  /**
   * Available options to select from
   */
  options: ComboBoxOption<T>[];

  /**
   * Currently selected value(s)
   */
  value: T | T[] | null;

  /**
   * Callback when selection changes
   */
  onChange: (value: T | T[] | null) => void;

  /**
   * Placeholder text when no selection
   * @default "Select an option..."
   */
  placeholder?: string;

  /**
   * Placeholder text for the search input
   * @default "Search..."
   */
  searchPlaceholder?: string;

  /**
   * Allow multiple selections
   * @default false
   */
  multiple?: boolean;

  /**
   * Whether the combobox is disabled
   */
  disabled?: boolean;

  /**
   * Whether the combobox is in a loading state
   */
  loading?: boolean;

  /**
   * Whether to allow clearing the selection
   * @default true
   */
  clearable?: boolean;

  /**
   * Whether to show the search input
   * @default true
   */
  searchable?: boolean;

  /**
   * Custom filter function
   * @default Case-insensitive label search
   */
  filterFn?: (option: ComboBoxOption<T>, query: string) => boolean;

  /**
   * Callback for async search (replaces local filtering)
   */
  onSearch?: (query: string) => void;

  /**
   * Message to show when no options match the search
   * @default "No results found"
   */
  emptyMessage?: string;

  /**
   * Custom render function for options
   */
  renderOption?: (option: ComboBoxOption<T>, selected: boolean) => React.ReactNode;

  /**
   * Custom render function for the selected value display
   */
  renderValue?: (selected: ComboBoxOption<T> | ComboBoxOption<T>[]) => React.ReactNode;

  /**
   * Whether to group options by their group property
   * @default false
   */
  grouped?: boolean;

  /**
   * Maximum number of selections (for multiple mode)
   */
  maxSelections?: number;

  /**
   * Whether to close the dropdown after selection (for single mode)
   * @default true
   */
  closeOnSelect?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Label for accessibility
   */
  'aria-label'?: string;

  /**
   * ID for the combobox
   */
  id?: string;
}

/**
 * ComboBox - Searchable select with filtering and multi-select support
 *
 * Features:
 * - Single and multiple selection modes
 * - Real-time search filtering
 * - Async search support
 * - Grouped options
 * - Custom option rendering
 * - Keyboard navigation
 * - Dark mode support
 * - Loading and error states
 *
 * @example
 * ```tsx
 * // Single select
 * <ComboBox
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 *   value={selectedCountry}
 *   onChange={setSelectedCountry}
 *   placeholder="Select a country..."
 * />
 *
 * // Multiple select with groups
 * <ComboBox
 *   options={[
 *     { value: 'admin', label: 'Admin', group: 'Roles' },
 *     { value: 'user', label: 'User', group: 'Roles' },
 *     { value: 'read', label: 'Read', group: 'Permissions' },
 *   ]}
 *   value={selectedRoles}
 *   onChange={setSelectedRoles}
 *   multiple
 *   grouped
 * />
 * ```
 */
export function ComboBox<T = string>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  multiple = false,
  disabled = false,
  loading = false,
  clearable = true,
  searchable = true,
  filterFn,
  onSearch,
  emptyMessage,
  renderOption,
  renderValue,
  grouped = false,
  maxSelections,
  closeOnSelect = true,
  className = "",
  size = "md",
  error,
  "aria-label": ariaLabel,
  id,
}: ComboBoxProps<T>) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const resolvedPlaceholder = placeholder ?? t("comboBox.placeholder");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("comboBox.searchPlaceholder");
  const resolvedEmptyMessage = emptyMessage ?? t("comboBox.emptyMessage");
  const highlightedSelector =
    '[data-highlighted="true"]'; // i18n-exempt -- UI-3008 [ttl=2026-12-31] DOM selector

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!query || onSearch) return options;

    const defaultFilter = (opt: ComboBoxOption<T>, q: string) =>
      opt.label.toLowerCase().includes(q.toLowerCase()) ||
      (opt.description?.toLowerCase().includes(q.toLowerCase()) ?? false);

    const filter = filterFn ?? defaultFilter;
    return options.filter((opt) => filter(opt, query));
  }, [options, query, filterFn, onSearch]);

  // Group options if needed
  const groupedOptions = useMemo(() => {
    if (!grouped) return { "": filteredOptions };

    return filteredOptions.reduce(
      (acc, option) => {
        const group = option.group ?? "";
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      },
      {} as Record<string, ComboBoxOption<T>[]>
    );
  }, [filteredOptions, grouped]);

  // Flatten for keyboard navigation
  const flatOptions = useMemo(() => {
    if (!grouped) return filteredOptions;
    return Object.values(groupedOptions).flat();
  }, [grouped, filteredOptions, groupedOptions]);

  // Get selected options
  const selectedOptions = useMemo(() => {
    if (value === null) return [];
    const values = Array.isArray(value) ? value : [value];
    return options.filter((opt) => values.includes(opt.value));
  }, [value, options]);

  // Check if a value is selected
  const isSelected = (optValue: T) => {
    if (value === null) return false;
    if (Array.isArray(value)) return value.includes(optValue);
    return value === optValue;
  };

  // Handle option selection
  const handleSelect = (option: ComboBoxOption<T>) => {
    if (option.disabled) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : value ? [value] : [];
      const isCurrentlySelected = currentValues.includes(option.value);

      if (isCurrentlySelected) {
        onChange(currentValues.filter((v) => v !== option.value) as T[]);
      } else {
        if (maxSelections && currentValues.length >= maxSelections) return;
        onChange([...currentValues, option.value] as T[]);
      }
    } else {
      onChange(option.value);
      if (closeOnSelect) {
        setIsOpen(false);
        setQuery("");
      }
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? ([] as unknown as T[]) : null);
    setQuery("");
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setHighlightedIndex(0);
    onSearch?.(newQuery);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < flatOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : flatOptions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && flatOptions[highlightedIndex]) {
          handleSelect(flatOptions[highlightedIndex]);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.querySelector(highlightedSelector);
      highlighted?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [flatOptions.length]);

  const hasValue = multiple ? (Array.isArray(value) && value.length > 0) : value !== null;

  return (
    <div className={className}>
      <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "w-full rounded-lg border border-border-1 bg-surface-1 text-fg transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          sizeClasses[size],
          isOpen && "border-primary",
          disabled ? "cursor-not-allowed bg-muted text-muted opacity-60" : "hover:border-border-2",
          error && "border-danger"
        )}
      >
        <Cluster alignY="center" justify="between" className="w-full gap-2">
          <div
            className={cn(
              "min-w-0 flex-1 truncate text-start",
              hasValue ? "text-fg" : "text-muted"
            )}
          >
            {hasValue ? (
              renderValue ? (
                renderValue(multiple ? selectedOptions : selectedOptions[0])
              ) : multiple ? (
                <Inline gap={1} className="text-xs">
                  {selectedOptions.slice(0, 3).map((opt) => (
                    <span
                      key={String(opt.value)}
                      className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {opt.label}
                    </span>
                  ))}
                  {selectedOptions.length > 3 && (
                    <span className="text-xs text-muted">
                      {t("comboBox.moreSelected", {
                        count: selectedOptions.length - 3,
                      })}
                    </span>
                  )}
                </Inline>
              ) : (
                selectedOptions[0]?.label
              )
            ) : (
              resolvedPlaceholder
            )}
          </div>

          <Inline gap={1} alignY="center" wrap={false} className="shrink-0">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
            )}
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  "min-h-11 min-w-11 rounded text-muted transition-colors",
                  "hover:bg-muted/60 hover:text-fg",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                aria-label={t("comboBox.clearSelection")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </Inline>
        </Cluster>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-border-1 bg-surface-1 shadow-elevation-3">
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-border-1 p-2">
              <div className="relative">
                <Search className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={resolvedSearchPlaceholder}
                  className={cn(
                    "w-full rounded-md border border-border-1 bg-surface-1 py-1.5 ps-8 pe-3 text-sm text-fg placeholder:text-muted",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            aria-multiselectable={multiple}
            className="max-h-60 overflow-y-auto py-1"
          >
            {flatOptions.length === 0 ? (
              <li className="px-3 py-2 text-center text-sm text-muted">
                {loading ? t("comboBox.loading") : resolvedEmptyMessage}
              </li>
            ) : grouped ? (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <React.Fragment key={group || 'ungrouped'}>
                  {group && (
                    <li className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      {group}
                    </li>
                  )}
                  {groupOptions.map((option) => (
                    <OptionItem
                      key={String(option.value)}
                      option={option}
                      selected={isSelected(option.value)}
                      highlighted={flatOptions.indexOf(option) === highlightedIndex}
                      onSelect={handleSelect}
                      renderOption={renderOption}
                      multiple={multiple}
                    />
                  ))}
                </React.Fragment>
              ))
            ) : (
              flatOptions.map((option, index) => (
                <OptionItem
                  key={String(option.value)}
                  option={option}
                  selected={isSelected(option.value)}
                  highlighted={index === highlightedIndex}
                  onSelect={handleSelect}
                  renderOption={renderOption}
                  multiple={multiple}
                />
              ))
            )}
          </ul>

          {/* Selection info for multiple */}
          {multiple && maxSelections && (
            <div className="border-t border-border-1 px-3 py-2 text-xs text-muted">
              {t("comboBox.selectionCount", {
                selected: selectedOptions.length,
                max: maxSelections,
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

// Option item component
interface OptionItemProps<T> {
  option: ComboBoxOption<T>;
  selected: boolean;
  highlighted: boolean;
  onSelect: (option: ComboBoxOption<T>) => void;
  renderOption?: (option: ComboBoxOption<T>, selected: boolean) => React.ReactNode;
  multiple: boolean;
}

function OptionItem<T>({
  option,
  selected,
  highlighted,
  onSelect,
  renderOption,
  multiple,
}: OptionItemProps<T>) {
  const Icon = option.icon;

  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        tabIndex={-1}
        aria-selected={selected}
        aria-disabled={option.disabled}
        data-highlighted={highlighted}
        onClick={() => onSelect(option)}
        disabled={option.disabled}
        className={cn(
          "w-full rounded-md px-3 py-2 text-sm text-start text-fg transition-colors",
          highlighted && "bg-muted/60",
          selected && "bg-primary/10",
          option.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted/40"
        )}
      >
        <Inline gap={2} alignY="center" wrap={false} className="w-full">
          {multiple && (
            <span
              className={cn(
                "inline-grid h-4 w-4 place-items-center rounded border text-primary-foreground",
                selected ? "border-primary bg-primary" : "border-border-1 bg-surface-1"
              )}
            >
              {selected && <Check className="h-3 w-3" />}
            </span>
          )}

          {renderOption ? (
            <div className="min-w-0 flex-1">{renderOption(option, selected)}</div>
          ) : (
            <>
              {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-muted" />}
              <Stack gap={1} className="min-w-0 flex-1">
                <span className={cn("truncate", selected && "font-medium")}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="truncate text-xs text-muted">
                    {option.description}
                  </span>
                )}
              </Stack>
              {!multiple && selected && (
                <Check className="h-4 w-4 flex-shrink-0 text-primary" />
              )}
            </>
          )}
        </Inline>
      </button>
    </li>
  );
}

export default ComboBox;
