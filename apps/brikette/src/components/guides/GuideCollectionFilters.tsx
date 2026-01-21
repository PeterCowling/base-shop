// src/components/guides/GuideCollectionFilters.tsx
import { useId } from "react";
import Link from "next/link";
import clsx from "clsx";

import type { GuideFilterOption } from "./useGuideFilterOptions";
import { GuideSearchBar } from "./GuideSearchBar";

const FILTER_PANEL_CLASSES = [
  "mt-8",
  "rounded-2xl",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface",
  "p-4",
  "shadow-sm",
  "dark:border-brand-outline/50",
  "dark:bg-brand-text/10",
] as const;

const FILTER_HEADER_CLASSES = [
  "flex",
  "flex-col",
  "gap-3",
  "sm:flex-row",
  "sm:items-start",
  "sm:justify-between",
] as const;

const FILTER_HEADING_CLASSES = [
  "text-lg",
  "font-semibold",
  "text-brand-heading",
  "dark:text-brand-surface",
] as const;

const FILTER_DESCRIPTION_CLASSES = [
  "text-sm",
  "text-brand-paragraph",
  "dark:text-brand-muted-dark",
] as const;

const FILTER_LINK_WRAP_CLASSES = [
  "mt-4",
  "flex",
  "flex-wrap",
  "gap-2",
] as const;

const FILTER_LINK_CLASSES = [
  "inline-flex",
  "items-center",
  "gap-2",
  "rounded-full",
  "border",
  "px-3",
  "py-1.5",
  "text-sm",
  "font-medium",
  "transition",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
  "dark:focus-visible:ring-brand-secondary",
] as const;

const FILTER_ACTIVE_CLASSES = [
  "border-brand-primary",
  "bg-brand-primary/10",
  "text-brand-primary",
  "dark:border-brand-secondary/70",
  "dark:bg-brand-secondary/20",
  "dark:text-brand-secondary",
] as const;

const FILTER_INACTIVE_CLASSES = [
  "border-brand-outline/40",
  "text-brand-paragraph",
  "hover:border-brand-primary/50",
  "hover:text-brand-primary",
  "dark:border-brand-outline/60",
  "dark:text-brand-muted-dark",
  "dark:hover:border-brand-secondary/60",
  "dark:hover:text-brand-secondary",
] as const;

const FILTER_COUNT_BADGE_CLASSES = [
  "rounded-full",
  "bg-brand-surface/80",
  "px-2",
  "py-0.5",
  "text-xs",
  "font-semibold",
  "text-brand-muted",
  "dark:bg-brand-text/15",
  "dark:text-brand-muted-dark",
] as const;

export interface GuideCollectionFiltersProps {
  heading: string;
  description?: string;
  label: string;
  allHref: string;
  clearFilterLabel: string;
  totalCount: number;
  options: readonly GuideFilterOption[];
  activeTag: string;
  makeHref: (value: string | null) => string;
  // When true, render plain <a href="?…"> links to keep hrefs query‑relative
  // (next/link handles query-only hrefs fine, but keeping for backwards compat)
  useRelativeAnchors?: boolean;
  // Search functionality
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchSuggestions?: string[];
  isSearching?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export const GuideCollectionFilters = ({
  heading,
  description,
  label,
  allHref,
  clearFilterLabel,
  totalCount,
  options,
  activeTag,
  makeHref,
  useRelativeAnchors = false,
  searchQuery = "",
  onSearchChange,
  searchSuggestions = [],
  isSearching = false,
  showSearch = false,
  searchPlaceholder,
}: GuideCollectionFiltersProps): JSX.Element => {
  const headingId = useId();
  const descriptionId = useId();
  const hasDescription = Boolean(description);

  const renderLink = (
    href: string,
    {
      className,
      ariaCurrent,
      ariaLabel,
      children,
    }: {
      className: string;
      ariaCurrent?: "true" | undefined;
      ariaLabel?: string;
      children: React.ReactNode;
    },
  ) => {
    if (useRelativeAnchors && href.startsWith("?")) {
      return (
        <a href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} prefetch={true} scroll={false} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  };

  return (
    <div
      className={clsx(FILTER_PANEL_CLASSES)}
      role="group"
      aria-labelledby={headingId}
      aria-describedby={hasDescription ? descriptionId : undefined}
    >
      <div className={clsx(FILTER_HEADER_CLASSES)}>
        <div className="space-y-2">
          <h3 id={headingId} className={clsx(FILTER_HEADING_CLASSES)}>
            {heading}
          </h3>
          {hasDescription ? (
            <p id={descriptionId} className={clsx(FILTER_DESCRIPTION_CLASSES)}>
              {description}
            </p>
          ) : null}
        </div>
        {showSearch && onSearchChange ? (
          <GuideSearchBar
            query={searchQuery}
            onChange={onSearchChange}
            suggestions={searchSuggestions}
            isSearching={isSearching}
            placeholder={searchPlaceholder}
          />
        ) : null}
      </div>
      <div className={clsx(FILTER_LINK_WRAP_CLASSES)} aria-label={label}>
        {renderLink(
          allHref,
          {
            className: clsx(
              FILTER_LINK_CLASSES,
              activeTag ? FILTER_INACTIVE_CLASSES : FILTER_ACTIVE_CLASSES,
            ),
            ariaCurrent: activeTag ? undefined : "true",
            children: (
              <>
                <span>{clearFilterLabel}</span>
                <span aria-hidden="true" className={clsx(FILTER_COUNT_BADGE_CLASSES)}>
                  {totalCount}
                </span>
              </>
            ),
          },
        )}
        {options.map((option) => {
          const isActive = activeTag === option.value;
          return (
            <div key={option.value}>
              {renderLink(
                makeHref(option.value),
                {
                  className: clsx(
                    FILTER_LINK_CLASSES,
                    isActive ? FILTER_ACTIVE_CLASSES : FILTER_INACTIVE_CLASSES,
                  ),
                  ariaCurrent: isActive ? "true" : undefined,
                  ariaLabel: `${label}: #${option.label} (${option.count})`,
                  children: (
                    <>
                      <span aria-hidden="true">#{option.label}</span>
                      <span aria-hidden="true" className={clsx(FILTER_COUNT_BADGE_CLASSES)}>
                        {option.count}
                      </span>
                    </>
                  ),
                },
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
