import React, { useCallback,useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Command, Loader2,Search, X } from 'lucide-react';

export interface CommandItem {
  /**
   * Unique identifier for the command
   */
  id: string;

  /**
   * Display label for the command
   */
  label: string;

  /**
   * Optional description or subtitle
   */
  description?: string;

  /**
   * Optional icon component
   */
  icon?: React.ComponentType<{ className?: string }>;

  /**
   * Keyboard shortcut hint (e.g., "⌘K")
   */
  shortcut?: string;

  /**
   * Callback when command is selected
   */
  onSelect: () => void;

  /**
   * Optional group/category
   */
  group?: string;

  /**
   * Whether the command is disabled
   */
  disabled?: boolean;

  /**
   * Keywords for search matching
   */
  keywords?: string[];

  /**
   * Whether this command leads to a submenu
   */
  hasSubmenu?: boolean;
}

export interface CommandGroup {
  /**
   * Group identifier
   */
  id: string;

  /**
   * Group heading
   */
  heading: string;

  /**
   * Commands in this group
   */
  commands: CommandItem[];
}

export interface CommandPaletteProps {
  /**
   * Whether the palette is open
   */
  open: boolean;

  /**
   * Callback when the palette should close
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Commands to display (flat list)
   */
  commands?: CommandItem[];

  /**
   * Grouped commands (takes precedence over commands)
   */
  groups?: CommandGroup[];

  /**
   * Placeholder text for the search input
   * @default "Type a command or search..."
   */
  placeholder?: string;

  /**
   * Message when no results match
   * @default "No results found."
   */
  emptyMessage?: string;

  /**
   * Whether to show loading state
   */
  loading?: boolean;

  /**
   * Async search handler (replaces local filtering)
   */
  onSearch?: (query: string) => void;

  /**
   * Custom filter function
   */
  filterFn?: (command: CommandItem, query: string) => boolean;

  /**
   * Footer content
   */
  footer?: React.ReactNode;

  /**
   * Keyboard shortcut to open the palette
   * @default "k" (with Cmd/Ctrl modifier)
   */
  shortcutKey?: string;

  /**
   * Whether to use Cmd on Mac and Ctrl on other platforms
   * @default true
   */
  useMetaKey?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * CommandPalette - Keyboard-driven command menu
 *
 * Features:
 * - Fuzzy search filtering
 * - Keyboard navigation
 * - Grouped commands
 * - Keyboard shortcuts display
 * - Async search support
 * - Accessible (dialog role)
 * - Dark mode support
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <CommandPalette
 *   open={open}
 *   onOpenChange={setOpen}
 *   commands={[
 *     {
 *       id: 'search',
 *       label: 'Search',
 *       icon: Search,
 *       shortcut: '/',
 *       onSelect: () => focusSearch(),
 *     },
 *     {
 *       id: 'settings',
 *       label: 'Settings',
 *       icon: Settings,
 *       shortcut: '⌘,',
 *       onSelect: () => openSettings(),
 *     },
 *   ]}
 * />
 * ```
 */
export function CommandPalette({
  open,
  onOpenChange,
  commands = [],
  groups = [],
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
  loading = false,
  onSearch,
  filterFn,
  footer,
  shortcutKey = 'k',
  useMetaKey = true,
  className = '',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten groups into commands if groups are provided
  const allCommands = useMemo(() => {
    if (groups.length > 0) {
      return groups.flatMap((g) => g.commands.map((c) => ({ ...c, group: g.heading })));
    }
    return commands;
  }, [commands, groups]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query || onSearch) return allCommands;

    const defaultFilter = (cmd: CommandItem, q: string) => {
      const searchText = [cmd.label, cmd.description, ...(cmd.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return q.toLowerCase().split(' ').every((term) => searchText.includes(term));
    };

    const filter = filterFn ?? defaultFilter;
    return allCommands.filter((cmd) => filter(cmd, query));
  }, [allCommands, query, filterFn, onSearch]);

  // Group filtered commands
  const groupedResults = useMemo(() => {
    const grouped: Record<string, CommandItem[]> = {};

    for (const cmd of filteredCommands) {
      const group = cmd.group ?? '';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(cmd);
    }

    return grouped;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatResults = useMemo(() => {
    return Object.values(groupedResults).flat();
  }, [groupedResults]);

  // Handle keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = useMetaKey ? (e.metaKey || e.ctrlKey) : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, shortcutKey, useMetaKey]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlightedIndex(0);
      // Focus input after a tick to ensure DOM is ready
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          const selected = flatResults[highlightedIndex];
          if (selected && !selected.disabled) {
            selected.onSelect();
            onOpenChange(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [flatResults, highlightedIndex, onOpenChange]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      highlighted?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setHighlightedIndex(0);
    onSearch?.(newQuery);
  };

  // Handle command selection
  const handleSelect = (command: CommandItem) => {
    if (command.disabled) return;
    command.onSelect();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={`
          fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2
          overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl
          dark:border-slate-700 dark:bg-slate-800
          ${className}
        `}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-slate-700">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent text-base text-gray-900 placeholder-gray-500 outline-none dark:text-slate-100 dark:placeholder-slate-400"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2"
          role="listbox"
        >
          {flatResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              {loading ? 'Searching...' : emptyMessage}
            </div>
          ) : (
            Object.entries(groupedResults).map(([group, groupCommands]) => (
              <div key={group || 'ungrouped'}>
                {group && (
                  <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    {group}
                  </div>
                )}
                {groupCommands.map((command) => {
                  const index = flatResults.indexOf(command);
                  const isHighlighted = index === highlightedIndex;
                  const Icon = command.icon;

                  return (
                    <button
                      key={command.id}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      aria-disabled={command.disabled}
                      data-highlighted={isHighlighted}
                      onClick={() => handleSelect(command)}
                      disabled={command.disabled}
                      className={`
                        flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${isHighlighted ? 'bg-blue-50 dark:bg-slate-700' : ''}
                        ${command.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}
                      `}
                    >
                      {Icon && (
                        <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {command.label}
                        </div>
                        {command.description && (
                          <div className="truncate text-xs text-gray-500 dark:text-slate-400">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd className="hidden rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 sm:inline-block dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {command.shortcut}
                        </kbd>
                      )}
                      {command.hasSubmenu && (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {footer ? (
          <div className="border-t border-gray-200 px-4 py-2 dark:border-slate-700">
            {footer}
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 font-mono text-xs dark:border-slate-600 dark:bg-slate-700">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 font-mono text-xs dark:border-slate-600 dark:bg-slate-700">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 font-mono text-xs dark:border-slate-600 dark:bg-slate-700">esc</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>Command Palette</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CommandPalette;
