// src/components/bar/orderTaking/CategoryHeader.tsx

import React, { type FC, useCallback, useMemo } from "react";

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
  { bg: string; darkBg: string; hover: string; text: string }
> = {
  Sweet: {
    bg: "bg-pinkShades-row1",
    darkBg: "bg-pinkShades-row2",
    hover: "hover:bg-pinkShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },
  Savory: {
    bg: "bg-greenShades-row1",
    darkBg: "bg-greenShades-row2",
    hover: "hover:bg-greenShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },
  Gelato: {
    bg: "bg-pinkShades-row3",
    darkBg: "bg-pinkShades-row4",
    hover: "hover:bg-pinkShades-row4",
    text: "text-black dark:text-darkAccentGreen",
  },

  Coffee: {
    bg: "bg-coffeeShades-row1",
    darkBg: "bg-coffeeShades-row2",
    hover: "hover:bg-coffeeShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },
  Tea: {
    bg: "bg-teaShades-row1",
    darkBg: "bg-teaShades-row2",
    hover: "hover:bg-teaShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },

  Beer: {
    bg: "bg-beerShades-row1",
    darkBg: "bg-beerShades-row2",
    hover: "hover:bg-beerShades-row2",
    text: "text-white dark:text-white",
  },
  Wine: {
    bg: "bg-wineShades-row1",
    darkBg: "bg-wineShades-row2",
    hover: "hover:bg-wineShades-row2",
    text: "text-white dark:text-white",
  },

  Spritz: {
    bg: "bg-spritzShades-row1",
    darkBg: "bg-spritzShades-row2",
    hover: "hover:bg-spritzShades-row2",
    text: "text-white dark:text-white",
  },

  "Mixed Drinks": {
    bg: "bg-blueShades-row1",
    darkBg: "bg-blueShades-row2",
    hover: "hover:bg-blueShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },
  Cocktails: {
    bg: "bg-purpleShades-row1",
    darkBg: "bg-purpleShades-row2",
    hover: "hover:bg-purpleShades-row2",
    text: "text-white dark:text-white",
  },

  Other: {
    bg: "bg-grayishShades-row1",
    darkBg: "bg-grayishShades-row2",
    hover: "hover:bg-grayishShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },

  Juices: {
    bg: "bg-orangeShades-row1",
    darkBg: "bg-orangeShades-row2",
    hover: "hover:bg-orangeShades-row2",
    text: "text-black dark:text-darkAccentGreen",
  },
  Smoothies: {
    bg: "bg-orangeShades-row3",
    darkBg: "bg-orangeShades-row2",
    hover: "hover:bg-orangeShades-row4",
    text: "text-black dark:text-darkAccentGreen",
  },
  Soda: {
    bg: "bg-orangeShades-row5",
    darkBg: "bg-orangeShades-row2",
    hover: "hover:bg-orangeShades-row1",
    text: "text-black dark:text-darkAccentGreen",
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
          const { bg, darkBg, hover, text } = CATEGORY_STYLES[cat] ?? {
            bg: "bg-neutral-400",
            darkBg: "bg-neutral-500",
            hover: "hover:bg-neutral-500",
            text: "text-black dark:text-darkAccentGreen",
          };

          return (
            <button
              /* a11y -------------------------------------------------------- */
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={handleSelect(cat)}
              /* styling ----------------------------------------------------- */
              data-selected={selectedCategory === cat}
              className={`relative flex-shrink-0 snap-start whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide transition
                          ${bg} dark:${darkBg} ${hover} ${text}
                          opacity-[0.85] hover:opacity-100
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                          /* selected variant */
                          data-[selected=true]:ring-2 data-[selected=true]:ring-white data-[selected=true]:ring-offset-2 data-[selected=true]:ring-offset-stone-800
                          data-[selected=true]:opacity-100`}
            >
              {cat}
            </button>
          );
        }),
      [categories, selectedCategory, handleSelect]
    );

    /* ------------------------------ RENDER ------------------------------- */
    return (
      <div
        className="flex w-full gap-2 overflow-x-auto overflow-y-hidden border-b border-black/10 bg-gradient-to-b from-stone-100 via-stone-200 to-stone-300 px-2 py-1 scrollbar-none scroll-smooth snap-x snap-mandatory shadow-md dark:border-neutral-700 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-900"
        role="tablist"
        aria-label="Menu categories"
      >
        {buttons}
      </div>
    );
  }
);

CategoryHeader.displayName = "CategoryHeader";
export default CategoryHeader;
