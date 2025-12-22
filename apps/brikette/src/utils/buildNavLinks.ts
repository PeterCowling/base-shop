/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/utils/buildNavLinks.ts
// Helper to build navigation slugs and labels for all NAV_ITEMS

import { NAV_ITEMS, type NavKey } from "@/config/navItems";
import type { AppLanguage } from "@/i18n.config";
import type { SlugMap } from "@/slug-map";
import { translatePath } from "./translate-path";

export interface NavItem {
  key: NavKey;
  to: string;
  label: string;
}

export interface NavLinksResult {
  slugs: Record<NavKey, string>;
  navLinks: NavItem[];
}

export type TranslateFn = (key: string, defaultValue?: string) => string;

/**
 * Returns navigation slugs and translated labels for all NAV_ITEMS.
 */
export function buildNavLinks(lang: AppLanguage, t: TranslateFn): NavLinksResult {
  const slugs = NAV_ITEMS.reduce((acc, key) => {
    acc[key] = key === "home" ? "" : `/${translatePath(key as keyof SlugMap, lang)}`;
    return acc;
  }, {} as Record<NavKey, string>);

  const fallbackLabels: Partial<Record<NavKey, string>> = {
    assistance: "Help",
    howToGetHere: "How to Get Here",
  };

  const navLinks = NAV_ITEMS.map((key) => ({
    key,
    to: slugs[key],
    label: t(key, fallbackLabels[key] ?? key.charAt(0).toUpperCase() + key.slice(1)),
  }));

  return { slugs, navLinks };
}
