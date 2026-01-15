// src/components/bar/HeaderControls.tsx

import React, { useCallback, useMemo } from "react";

import { ScreenType } from "../../types/bar/BarTypes";

/* -------------------------------------------------------------------------- *
 *                                TYPE DEFS                                   *
 * -------------------------------------------------------------------------- */
export type MenuType = "food" | "alcoholic" | "nonalcoholic" | "other";

interface HeaderControlsProps {
  /** Username of the current staff member (reserved for future extensions). */
  currentUser: string;
  /** Switches the high-level screen in the bar system. */
  onScreenChange: (screen: ScreenType) => void;
  /** Currently-selected menu category (highlights the active tab). */
  menuType: MenuType;
  /** Switches the active menu category. */
  onSelectMenuType: (menu: MenuType) => void;
}

/* -------------------------------------------------------------------------- *
 *                                DESIGN TOKENS                               *
 * -------------------------------------------------------------------------- *
 *  Tailwind 4.1 utilities - intentionally *explicit* with colours to avoid
 *  any missing custom palette keys (e.g. `primary-contrast` defaulting to
 *  black). Feel free to bind these literals in `tailwind.config.ts` later.
 * -------------------------------------------------------------------------- */
const BTN_BASE =
  "inline-flex items-center justify-center px-3 py-2 rounded-md " +
  "font-semibold uppercase tracking-wide select-none " +
  "transition-colors duration-150 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-white/70";

const MENU_BTN =
  `${BTN_BASE} text-white/70 hover:text-white/90 dark:text-darkAccentGreen ` +
  "relative data-[active=true]:text-white " +
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 " +
  "after:bg-white/90 after:rounded-full after:origin-left after:scale-x-0 " +
  "after:transition-transform after:duration-200 " +
  "data-[active=true]:after:scale-x-100";

const ACTION_BTN = `${BTN_BASE} bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg`;

/* -------------------------------------------------------------------------- *
 *                                COMPONENT                                   *
 * -------------------------------------------------------------------------- */
const HeaderControls: React.FC<HeaderControlsProps> = React.memo(
  ({
    currentUser: _currentUser,
    onScreenChange,
    menuType,
    onSelectMenuType,
  }) => {
    /* ------------------------------ HANDLERS ------------------------------ */
    const switchToOrderTaking = useCallback(
      (menu: MenuType) => {
        onScreenChange("orderTaking");
        onSelectMenuType(menu);
      },
      [onScreenChange, onSelectMenuType]
    );

    const handleSales = useCallback(
      () => onScreenChange("sales"),
      [onScreenChange]
    );
    const handleComp = useCallback(
      () => onScreenChange("comp"),
      [onScreenChange]
    );

    /* --------------------------- MEMO MENU BTNS --------------------------- */
    const menuButtons = useMemo<
      { key: MenuType; label: string; onClick: () => void }[]
    >(
      () => [
        {
          key: "food",
          label: "Food",
          onClick: () => switchToOrderTaking("food"),
        },
        {
          key: "nonalcoholic",
          label: "Non-Alcoholic",
          onClick: () => switchToOrderTaking("nonalcoholic"),
        },
        {
          key: "alcoholic",
          label: "Alcoholic",
          onClick: () => switchToOrderTaking("alcoholic"),
        },
        {
          key: "other",
          label: "Other",
          onClick: () => switchToOrderTaking("other"),
        },
      ],
      [switchToOrderTaking]
    );

    /* ------------------------------ RENDER -------------------------------- */
    return (
      <header className="sticky top-0 z-20 w-full bg-blue-600/95 backdrop-blur-md shadow-lg dark:bg-darkSurface">
        <nav
          className="mx-auto flex max-w-screen-lg items-center justify-between gap-4 px-4 py-2 font-body dark:text-darkAccentGreen"
          aria-label="Bar navigation"
        >
          {/* ────── Menu Tabs ────── */}
          <div
            className="flex flex-1 space-x-4 overflow-x-auto whitespace-nowrap scrollbar-none"
            role="tablist"
            aria-label="Menu categories"
          >
            {menuButtons.map(({ key, label, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                data-active={menuType === key}
                aria-pressed={menuType === key}
                aria-current={menuType === key ? "page" : undefined}
                className={MENU_BTN}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ────── Screen Actions ────── */}
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={handleSales} className={ACTION_BTN}>
              Sales
            </button>
            <button type="button" onClick={handleComp} className={ACTION_BTN}>
              Comp
            </button>
          </div>
        </nav>
      </header>
    );
  }
);

HeaderControls.displayName = "HeaderControls";
export default HeaderControls;
