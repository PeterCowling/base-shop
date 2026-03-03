// src/components/bar/orderTaking/CategoryHeader.tsx
 

import React, { type FC, useCallback, useMemo } from "react";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import { type CategoryType } from "../../../types/bar/BarTypes";

/* ──────────────────────────────────────────────────────────────────────
 * Tab styling — unified green-primary theme.
 * Selected tab is always bg-primary-main (forest green).
 * Unselected tabs use the dark surface palette for contrast.
 * ──────────────────────────────────────────────────────────────────── */
const TAB_SELECTED =
  "bg-primary-main text-primary-fg shadow-sm";
const TAB_UNSELECTED =
  "bg-surface-3 text-muted-foreground border border-border-1/40 hover:bg-surface-2 hover:text-foreground hover:border-border-2";

/* ──────────────────────────────────────────────────────────────────────
 * Component Props
 * ──────────────────────────────────────────────────────────────────── */
interface CategoryHeaderProps {
  /** Ordered list of categories to render. */
  categories: CategoryType[];
  /** Currently-selected category. */
  selectedCategory: CategoryType;
  /** Fires when a category is clicked. */
  onSelectCategory: (cat: CategoryType) => void;
}

/* ──────────────────────────────────────────────────────────────────────
 * CategoryHeader
 * ──────────────────────────────────────────────────────────────────── */
const CategoryHeader: FC<CategoryHeaderProps> = React.memo(
  ({ categories, selectedCategory, onSelectCategory }) => {
    /* ------------------------------ HANDLERS ------------------------------ */
    const handleSelect = useCallback(
      (cat: CategoryType) => () => onSelectCategory(cat),
      [onSelectCategory]
    );

    /* ----------------------------- MEMO BTNS ------------------------------ */
    const buttons = useMemo(
      () =>
        categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <Button
              key={cat}
              role="tab"
              aria-selected={isSelected}
              onClick={handleSelect(cat)}
              compatibilityMode="passthrough"
              className={[
                "relative flex-shrink-0 snap-start whitespace-nowrap rounded-lg px-4 py-2 min-h-11 text-sm font-semibold uppercase tracking-wide transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                isSelected ? TAB_SELECTED : TAB_UNSELECTED,
              ].join(" ")}
            >
              {cat}
            </Button>
          );
        }),
      [categories, selectedCategory, handleSelect]
    );

    /* ------------------------------ RENDER ------------------------------- */
    return (
      <Inline
        wrap={false}
        gap={2}
        className="w-full overflow-x-auto overflow-y-hidden border-b border-border-1/50 bg-surface-3 px-2 py-2 scrollbar-none scroll-smooth snap-x snap-mandatory"
        role="tablist"
        aria-label="Menu categories"
      >
        {buttons}
      </Inline>
    );
  }
);

CategoryHeader.displayName = "CategoryHeader";
export default CategoryHeader;
