import React, { useEffect,useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2,Search, X } from 'lucide-react';

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
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  multiple = false,
  disabled = false,
  loading = false,
  clearable = true,
  searchable = true,
  filterFn,
  onSearch,
  emptyMessage = 'No results found',
  renderOption,
  renderValue,
  grouped = false,
  maxSelections,
  closeOnSelect = true,
  className = '',
  size = 'md',
  error,
  'aria-label': ariaLabel,
  id,
}: ComboBoxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
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
    if (!grouped) return { '': filteredOptions };

    return filteredOptions.reduce(
      (acc, option) => {
        const group = option.group ?? '';
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
        setQuery('');
      }
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? ([] as unknown as T[]) : null);
    setQuery('');
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
        setQuery('');
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      highlighted?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
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
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          flex w-full items-center justify-between gap-2 rounded-lg border bg-white transition-colors
          ${sizeClasses[size]}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300'}
          ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'hover:border-gray-400'}
          ${error ? 'border-red-500' : ''}
          dark:bg-slate-800 dark:border-slate-600
          ${isOpen ? 'dark:border-blue-400 dark:ring-blue-400/20' : ''}
          ${disabled ? 'dark:bg-slate-900' : 'dark:hover:border-slate-500'}
        `}
      >
        <span className={`flex-1 truncate text-left ${!hasValue ? 'text-gray-500' : 'text-gray-900 dark:text-slate-100'}`}>
          {hasValue ? (
            renderValue ? (
              renderValue(multiple ? selectedOptions : selectedOptions[0])
            ) : multiple ? (
              <span className="flex flex-wrap gap-1">
                {selectedOptions.slice(0, 3).map((opt) => (
                  <span
                    key={String(opt.value)}
                    className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  >
                    {opt.label}
                  </span>
                ))}
                {selectedOptions.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{selectedOptions.length - 3} more
                  </span>
                )}
              </span>
            ) : (
              selectedOptions[0]?.label
            )
          ) : (
            placeholder
          )}
        </span>

        <div className="flex items-center gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-gray-200 p-2 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleSearchChange}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-md border border-gray-300 bg-transparent py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-blue-400"
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
              <li className="px-3 py-2 text-center text-sm text-gray-500 dark:text-slate-400">
                {loading ? 'Loading...' : emptyMessage}
              </li>
            ) : grouped ? (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <React.Fragment key={group || 'ungrouped'}>
                  {group && (
                    <li className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
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
            <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
              {selectedOptions.length} / {maxSelections} selected
            </div>
          )}
        </div>
      )}
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
    <li
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled}
      data-highlighted={highlighted}
      onClick={() => onSelect(option)}
      onMouseEnter={(e) => {
        // Update highlighted index on mouse enter
        const list = e.currentTarget.parentElement;
        if (list) {
          const items = Array.from(list.querySelectorAll('[role="option"]'));
          const index = items.indexOf(e.currentTarget);
          if (index !== -1) {
            // This is handled by parent state, but we need visual feedback
          }
        }
      }}
      className={`
        flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors
        ${highlighted ? 'bg-blue-50 dark:bg-slate-700' : ''}
        ${selected ? 'bg-blue-100 dark:bg-blue-900/50' : ''}
        ${option.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}
      `}
    >
      {multiple && (
        <div
          className={`
            flex h-4 w-4 items-center justify-center rounded border
            ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-slate-600'}
          `}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}

      {renderOption ? (
        renderOption(option, selected)
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />}
          <div className="flex-1 min-w-0">
            <div className={`truncate ${selected ? 'font-medium' : ''} text-gray-900 dark:text-slate-100`}>
              {option.label}
            </div>
            {option.description && (
              <div className="truncate text-xs text-gray-500 dark:text-slate-400">
                {option.description}
              </div>
            )}
          </div>
          {!multiple && selected && (
            <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
          )}
        </>
      )}
    </li>
  );
}

export default ComboBox;
