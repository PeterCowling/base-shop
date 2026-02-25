// src/components/bar/orderTaking/CategoryHeader.tsx
 

import React, { type FC, useCallback, useMemo } from "react";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import { type CategoryType } from "../../../types/bar/BarTypes";

/* ──────────────────────────────────────────────────────────────────────
 * Category Palette
 *
 * • `bg`    – base background
 * • `hover` – hover/active background tint
 * • `text`  – text colour (light/dark variants)
 *
 *   → All class tokens map to colours defined in tailwind.config.ts.
 *   → Keep all colour knowledge centralised; no raw HEX values here.
 * ──────────────────────────────────────────────────────────────────── */
const CATEGORY_STYLES: Record<
  CategoryType,
  { bg: string; hover: string; text: string }
> = {
  Sweet: {
    bg: "bg-pinkShades-row1",
    hover: "hover:bg-pinkShades-row2",
    text: "text-foreground",
  },
  Savory: {
    bg: "bg-greenShades-row1",
    hover: "hover:bg-greenShades-row2",
    text: "text-foreground",
  },
  Gelato: {
    bg: "bg-pinkShades-row3",
    hover: "hover:bg-pinkShades-row4",
    text: "text-foreground",
  },

  Coffee: {
    bg: "bg-coffeeShades-row1",
    hover: "hover:bg-coffeeShades-row2",
    text: "text-foreground",
  },
  Tea: {
    bg: "bg-teaShades-row1",
    hover: "hover:bg-teaShades-row2",
    text: "text-foreground",
  },

  Beer: {
    bg: "bg-beerShades-row1",
    hover: "hover:bg-beerShades-row2",
    text: "text-primary-fg",
  },
  Wine: {
    bg: "bg-wineShades-row1",
    hover: "hover:bg-wineShades-row2",
    text: "text-primary-fg",
  },

  Spritz: {
    bg: "bg-spritzShades-row1",
    hover: "hover:bg-spritzShades-row2",
    text: "text-primary-fg",
  },

  "Mixed Drinks": {
    bg: "bg-blueShades-row1",
    hover: "hover:bg-blueShades-row2",
    text: "text-foreground",
  },
  Cocktails: {
    bg: "bg-purpleShades-row1",
    hover: "hover:bg-purpleShades-row2",
    text: "text-primary-fg",
  },

  Other: {
    bg: "bg-grayishShades-row1",
    hover: "hover:bg-grayishShades-row2",
    text: "text-foreground",
  },

  Juices: {
    bg: "bg-orangeShades-row1",
    hover: "hover:bg-orangeShades-row2",
    text: "text-foreground",
  },
  Smoothies: {
    bg: "bg-orangeShades-row3",
    hover: "hover:bg-orangeShades-row4",
    text: "text-foreground",
  },
  Soda: {
    bg: "bg-orangeShades-row5",
    hover: "hover:bg-orangeShades-row1",
    text: "text-foreground",
  },
};

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
          const { bg, hover, text } = CATEGORY_STYLES[cat] ?? {
            bg: "bg-muted",
            hover: "hover:bg-muted/70",
            text: "text-foreground",
          };

          return (
            <Button
              /* a11y -------------------------------------------------------- */
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={handleSelect(cat)}
              /* styling ----------------------------------------------------- */
              compatibilityMode="passthrough"
              data-selected={selectedCategory === cat}
              className={`relative flex-shrink-0 snap-start whitespace-nowrap rounded-lg px-4 py-2 min-h-11 text-sm font-semibold uppercase tracking-wide transition
                          ${bg} ${hover} ${text}
                          opacity-[0.85] hover:opacity-100
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                          /* selected variant */
                          data-[selected=true]:ring-2 data-[selected=true]:ring-white data-[selected=true]:ring-offset-2 data-[selected=true]:ring-offset-surface
                          data-[selected=true]:opacity-100`}
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
        className="w-full overflow-x-auto overflow-y-hidden border-b border-foreground/10 bg-gradient-to-b from-surface via-surface-2 to-surface-3 px-2 py-1 scrollbar-none scroll-smooth snap-x snap-mandatory shadow-md"
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
