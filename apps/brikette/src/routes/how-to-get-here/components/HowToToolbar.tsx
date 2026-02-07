import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import type { TFunction } from "i18next";
import { ChevronDown } from "@/icons";

import { anchorLinkClass, getFilterButtonClass } from "../styles";
import { Cluster, Inline } from "../ui";
import type { DestinationFiltersState } from "../useDestinationFilters";

export type ActiveFilterChip = {
  key: "transport" | "direction" | "destination";
  label: string;
  value: string;
};

export type JumpToGroup = "quick-actions" | "destinations" | "utility";

export type JumpToItem = {
  id: string;
  label: string;
  count?: number;
  /** Used to add visual separators between groups */
  group?: JumpToGroup;
};

type ToolbarFiltersState = Pick<
  DestinationFiltersState,
  | "setTransportFilter"
  | "setDirectionFilter"
  | "setDestinationFilter"
  | "hasActiveFilters"
  | "clearFilters"
>;

// i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS selector string.
const DEFAULT_HEADER_SELECTOR = 'header[role="banner"]';
const DEFAULT_FALLBACK_OFFSET = 72;
const DEFAULT_GAP = 12;
const LARGE_SCREEN_BREAKPOINT = 1024;
const LARGE_SCREEN_GAP = 0;

const TOOLBAR_CLASS = [
  "sticky",
  "z-30",
  "rounded-2xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-surface/90",
  "px-4",
  "py-3",
  "shadow-md",
  "backdrop-blur",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/70",
].join(" ");

const ACTIVE_FILTER_CHIP_CLASS = [
  "max-w-full",
  "truncate",
  "min-h-11",
  "min-w-11",
  "px-3",
  "py-2",
  "text-xs",
].join(" ");

const JUMP_TO_TOGGLE_CLASS = [
  "inline-flex",
  "items-center",
  "gap-1.5",
  "rounded-lg",
  "px-3",
  "py-1.5",
  "text-sm",
  "font-medium",
  "text-brand-heading",
  "transition",
  "hover:bg-brand-surface/60",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:text-brand-text",
  "dark:hover:bg-brand-surface/40",
  "dark:focus-visible:outline-brand-secondary",
  // Hidden on lg screens (nav is always visible)
  "lg:hidden",
].join(" ");

export function useHeaderStickyOffset(headerSelector = DEFAULT_HEADER_SELECTOR): number {
  const [offset, setOffset] = useState(DEFAULT_FALLBACK_OFFSET);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const selector = headerSelector.trim() || DEFAULT_HEADER_SELECTOR;
    const header = document.querySelector<HTMLElement>(selector) ?? document.querySelector<HTMLElement>("header");
    if (!header) return;

    const update = (): void => {
      const rect = header.getBoundingClientRect();
      const measuredBottom = Math.max(rect.bottom, header.offsetHeight);
      const gap = window.innerWidth >= LARGE_SCREEN_BREAKPOINT ? LARGE_SCREEN_GAP : DEFAULT_GAP;
      setOffset(Math.max(0, measuredBottom) + gap);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headerSelector]);

  return offset;
}

export type HowToToolbarProps = {
  t: TFunction<"howToGetHere">;
  activeFilters: ActiveFilterChip[];
  resultsCount: number;
  jumpTo: JumpToItem[];
  filters: ToolbarFiltersState;
  onOpenFilters: () => void;
  className?: string;
};

export function HowToToolbar({
  t,
  activeFilters,
  resultsCount,
  jumpTo,
  filters,
  onOpenFilters,
  className,
}: HowToToolbarProps) {
  const offset = useHeaderStickyOffset();

  // Disclosure state for mobile jump-to nav
  // Initialize expanded to avoid hydration mismatch (server always renders expanded)
  // Then collapse on mobile after hydration via useEffect
  const [jumpToExpanded, setJumpToExpanded] = useState(true);

  useEffect(() => {
    // Collapse on mobile after hydration
    if (typeof window !== "undefined" && window.innerWidth < LARGE_SCREEN_BREAKPOINT) {
      setJumpToExpanded(false);
    }
  }, []);

  const resultsLabel = t("filters.resultsCount", { count: resultsCount });

  const clearChip = useCallback(
    (key: ActiveFilterChip["key"]) => {
      if (key === "transport") {
        filters.setTransportFilter("all");
        return;
      }
      if (key === "direction") {
        filters.setDirectionFilter("all");
        return;
      }
      filters.setDestinationFilter("all");
    },
    [filters],
  );

  const jumpToLabel = t("jumpTo.label");

  return (
    <div
      className={clsx(TOOLBAR_CLASS, className)}
      style={{ top: offset }}
    >
      <Cluster as="div" className="items-center justify-between gap-3">
        <Cluster as="div" className="min-w-0 items-center gap-2">
          <span className="text-sm font-semibold text-brand-heading dark:text-brand-text">
            {resultsLabel}
          </span>
          {activeFilters.length ? (
            <Cluster as="div" className="min-w-0 gap-2">
              {activeFilters.map((chip) => (
                <button
                  key={`${chip.key}-${chip.value}`}
                  type="button"
                  onClick={() => clearChip(chip.key)}
                  className={clsx(getFilterButtonClass(true), ACTIVE_FILTER_CHIP_CLASS)}
                  aria-label={t("filters.chipClear", { label: chip.label })}
                >
                  <span className="truncate">
                    <span className="opacity-80">{chip.label}:</span> {chip.value}
                  </span>
                </button>
              ))}
            </Cluster>
          ) : null}
        </Cluster>

        <Cluster as="div" className="items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className={getFilterButtonClass(false)}
          >
            {t("filters.editLabel")}
          </button>
          {filters.hasActiveFilters ? (
            <button type="button" onClick={filters.clearFilters} className={getFilterButtonClass(false)}>
              {t("filters.clearLabel")}
            </button>
          ) : null}
        </Cluster>
      </Cluster>

      {jumpTo.length ? (
        <div className="mt-3">
          {/* Mobile disclosure toggle */}
          <button
            type="button"
            onClick={() => setJumpToExpanded((prev) => !prev)}
            aria-expanded={jumpToExpanded}
            className={JUMP_TO_TOGGLE_CLASS}
          >
            <span>{t("jumpTo.toggleLabel", { defaultValue: "Jump to section" })}</span>
            <ChevronDown
              aria-hidden
              className={clsx("size-4 transition-transform", jumpToExpanded && "rotate-180")}
            />
          </button>

          {/* Nav content - always visible on lg+, collapsible on mobile */}
          <nav
            aria-label={jumpToLabel}
            className={clsx(
              "overflow-x-auto pb-1",
              // Always visible on lg+
              "lg:block",
              // Collapsible on mobile
              jumpToExpanded ? "block" : "hidden lg:block"
            )}
          >
            <Inline as="ul" className="w-max gap-2">
              {jumpTo.map((item, index) => {
                const prevGroup = index > 0 ? jumpTo[index - 1]?.group : undefined;
                const showSeparator = item.group && prevGroup && item.group !== prevGroup;

                return (
                  <li key={item.id} className="flex items-center gap-2">
                    {showSeparator ? (
                      <span
                        role="separator"
                        aria-hidden="true"
                        className="h-4 w-px bg-brand-outline/30 dark:bg-brand-outline/40"
                      />
                    ) : null}
                    <a className={anchorLinkClass} href={`#${item.id}`}>
                      {item.label}
                      {typeof item.count === "number" ? (
                        <span className="ms-1 text-brand-heading/70 dark:text-brand-text/70">
                          ({item.count})
                        </span>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </Inline>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
