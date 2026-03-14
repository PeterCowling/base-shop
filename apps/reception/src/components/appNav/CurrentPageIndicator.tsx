"use client";

import { memo, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Home } from "lucide-react";

import { Inline } from "@acme/design-system/primitives";

import { navSections } from "./navConfig";

interface RouteInfo {
  label: string;
  section: string;
  icon: LucideIcon;
  shortcut?: string;
}

/**
 * Keyboard shortcut annotations for Operations items.
 * This thin overlay supplements navConfig with CPI-specific metadata
 * that has no place in the shared nav config.
 */
const shortcutsOverlay: Record<string, string> = {
  "/bar":        "1",
  "/checkin":    "2",
  "/rooms-grid": "3",
  "/checkout":   "4",
  "/loan-items": "5",
  "/extension":  "6",
};

/**
 * Section label overrides for special breadcrumb display cases.
 * Currently only Dashboard (/) needs this — it belongs to the "Operations" section
 * in navConfig but should display "Reception" in the breadcrumb to preserve
 * existing CPI behaviour for the root route.
 */
const sectionOverlay: Record<string, string> = {
  "/": "Reception",
};

/**
 * Derived routeMap built from navConfig so that new routes automatically appear
 * in the CPI without any manual edit here. sidebarOnly items ARE included —
 * the flag means "exclude from modals", not "exclude from header indicator".
 */
const routeMap: Record<string, RouteInfo> = Object.fromEntries(
  navSections.flatMap((section) =>
    section.items.map((item) => [
      item.route,
      {
        label:    item.label,
        section:  sectionOverlay[item.route] ?? section.label,
        icon:     item.icon,
        shortcut: shortcutsOverlay[item.route],
      } satisfies RouteInfo,
    ])
  )
);

interface CurrentPageIndicatorProps {
  pathname: string;
}

function CurrentPageIndicatorComponent({ pathname }: CurrentPageIndicatorProps) {
  const routeInfo = useMemo(() => {
    return routeMap[pathname] || { label: "Home", section: "Reception", icon: Home };
  }, [pathname]);

  return (
    <Inline gap={2} className="text-sm">
      <span className="text-muted-foreground">{routeInfo.section}</span>
      <span className="text-muted-foreground">/</span>
      <Inline gap={2} className="font-semibold text-primary-main">
        <routeInfo.icon size={16} />
        <span>{routeInfo.label}</span>
        {routeInfo.shortcut && (
          <kbd className="ms-1 rounded-lg bg-surface-3 px-1.5 py-0.5 text-ops-micro font-mono text-muted-foreground">
            {routeInfo.shortcut}
          </kbd>
        )}
      </Inline>
    </Inline>
  );
}

const CurrentPageIndicator = memo(CurrentPageIndicatorComponent);
export default CurrentPageIndicator;
