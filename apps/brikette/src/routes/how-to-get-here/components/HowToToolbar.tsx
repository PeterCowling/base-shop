import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import type { TFunction } from "i18next";

import { anchorLinkClass, getFilterButtonClass } from "../styles";
import { Cluster, Inline } from "../ui";
import type { DestinationFiltersState } from "../useDestinationFilters";

export type ActiveFilterChip = {
  key: "transport" | "direction" | "destination";
  label: string;
  value: string;
};

export type JumpToItem = {
  id: string;
  label: string;
  count?: number;
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

function useHeaderStickyOffset(headerSelector = DEFAULT_HEADER_SELECTOR): number {
  const [offset, setOffset] = useState(DEFAULT_FALLBACK_OFFSET);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const selector = headerSelector.trim() || DEFAULT_HEADER_SELECTOR;
    const header = document.querySelector<HTMLElement>(selector) ?? document.querySelector<HTMLElement>("header");
    if (!header) return;

    const update = (): void => {
      const { bottom } = header.getBoundingClientRect();
      setOffset(Math.max(0, bottom) + DEFAULT_GAP);
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
          <span className="text-sm font-semibold text-brand-heading dark:text-brand-surface">
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
        <nav aria-label={jumpToLabel} className="mt-3 overflow-x-auto pb-1">
          <Inline as="ul" className="w-max gap-2">
            {jumpTo.map((item) => (
              <li key={item.id}>
                <a className={anchorLinkClass} href={`#${item.id}`}>
                  {item.label}
                  {typeof item.count === "number" ? (
                    <span className="ms-1 text-brand-heading/70 dark:text-brand-surface/70">
                      ({item.count})
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </Inline>
        </nav>
      ) : null}
    </div>
  );
}
