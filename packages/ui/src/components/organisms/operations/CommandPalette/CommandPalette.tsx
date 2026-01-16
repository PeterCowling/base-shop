import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Command, ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "@acme/i18n";
import { Cluster, Inline, Stack } from "../../../atoms/primitives";
import { Dialog, DialogContent } from "../../../atoms/primitives/dialog";
import { cn } from "../../../../utils/style/cn";

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
  placeholder,
  emptyMessage,
  loading = false,
  onSearch,
  filterFn,
  footer,
  shortcutKey = "k",
  useMetaKey = true,
  className = "",
}: CommandPaletteProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const resolvedPlaceholder = placeholder ?? t("commandPalette.placeholder");
  const resolvedEmptyMessage = emptyMessage ?? t("commandPalette.emptyMessage");
  const highlightedSelector =
    '[data-highlighted="true"]'; // i18n-exempt -- UI-3009 [ttl=2026-12-31] DOM selector

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
      setQuery("");
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
      const highlighted = listRef.current.querySelector(highlightedSelector);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={t("commandPalette.ariaLabel")}
        onKeyDown={handleKeyDown}
        className={cn(
          /* i18n-exempt -- UI-3009 [ttl=2026-12-31] class names */
          "top-[20%] -translate-y-0 p-0 gap-0 sm:max-w-lg rounded-xl",
          className
        )}
      >
        <Stack gap={0} className="overflow-hidden">
          {/* Search Input */}
          <Cluster
            alignY="center"
            justify="between"
            className="border-b border-border-1 px-4 py-3"
          >
            <Inline gap={3} alignY="center" wrap={false} className="min-w-0 flex-1">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              ) : (
                <Search className="h-5 w-5 text-muted" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder={resolvedPlaceholder}
                className={cn(
                  "min-w-0 flex-1 border-0 bg-transparent text-base text-fg placeholder:text-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              />
            </Inline>
          </Cluster>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-80 overflow-y-auto py-2"
            role="listbox"
          >
            {flatResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                {loading ? t("commandPalette.searching") : resolvedEmptyMessage}
              </div>
            ) : (
              Object.entries(groupedResults).map(([group, groupCommands]) => (
                <Stack key={group || "ungrouped"} gap={1}>
                  {group && (
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
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
                        className={cn(
                          "min-h-11 w-full rounded-md px-4 py-2.5 text-start text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          isHighlighted && "bg-muted/60",
                          command.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted/40"
                        )}
                      >
                        <Inline gap={3} alignY="center" wrap={false} className="w-full">
                          {Icon && (
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted" />
                          )}
                          <Stack gap={1} className="min-w-0 flex-1">
                            <span className="truncate text-sm font-medium text-fg">
                              {command.label}
                            </span>
                            {command.description && (
                              <span className="truncate text-xs text-muted">
                                {command.description}
                              </span>
                            )}
                          </Stack>
                          {command.shortcut && (
                            <kbd className="hidden rounded border border-border-1 bg-muted px-1.5 py-0.5 text-xs font-medium text-muted sm:inline-block">
                              {command.shortcut}
                            </kbd>
                          )}
                          {command.hasSubmenu && (
                            <ArrowRight className="h-4 w-4 text-muted" />
                          )}
                        </Inline>
                      </button>
                    );
                  })}
                </Stack>
              ))
            )}
          </div>

          {/* Footer */}
          {footer ? (
            <div className="border-t border-border-1 px-4 py-2">
              {footer}
            </div>
          ) : (
            <Cluster
              alignY="center"
              justify="between"
              className="border-t border-border-1 px-4 py-2 text-xs text-muted"
            >
              <Inline gap={4} alignY="center" wrap={false} className="min-w-0">
                <Inline gap={1} alignY="center" wrap={false}>
                  <kbd className="rounded border border-border-1 bg-muted px-1 py-0.5 font-mono text-xs text-muted">↑↓</kbd>
                  <span>{t("commandPalette.footer.navigate")}</span>
                </Inline>
                <Inline gap={1} alignY="center" wrap={false}>
                  <kbd className="rounded border border-border-1 bg-muted px-1 py-0.5 font-mono text-xs text-muted">↵</kbd>
                  <span>{t("commandPalette.footer.select")}</span>
                </Inline>
                <Inline gap={1} alignY="center" wrap={false}>
                  <kbd className="rounded border border-border-1 bg-muted px-1 py-0.5 font-mono text-xs text-muted">esc</kbd>
                  <span>{t("commandPalette.footer.close")}</span>
                </Inline>
              </Inline>
              <Inline gap={1} alignY="center" wrap={false}>
                <Command className="h-3 w-3" />
                <span>{t("commandPalette.footer.title")}</span>
              </Inline>
            </Cluster>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
