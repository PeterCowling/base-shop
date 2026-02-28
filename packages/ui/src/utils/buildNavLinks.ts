// src/utils/buildNavLinks.ts
// Helper to build navigation slugs and labels for all NAV_ITEMS

import { NAV_ITEMS, type NavKey } from "../config/navItems";
import { ROOM_DROPDOWN_NAMES } from "../config/roomNames";
import type { AppLanguage } from "../i18n.config";
import type { SlugMap } from "../slug-map";

import { translatePath } from "./translate-path";

export interface NavItemChild {
  key: string;
  to: string;
  label: string;
}

export interface NavItem {
  key: NavKey;
  to: string;
  label: string;
  prefetch?: boolean;
  children?: NavItemChild[];
}

export interface NavLinksResult {
  slugs: Record<NavKey, string>;
  navLinks: NavItem[];
}

export type TranslateFn = (key: string, defaultValue?: string) => string;

/**
 * Returns navigation slugs and translated labels for all NAV_ITEMS.
 * The "rooms" item includes a `children` array with a "See all rooms" sentinel
 * followed by one entry per room (in roomsData order), for use by dropdown/accordion nav.
 */
export function buildNavLinks(lang: AppLanguage, t: TranslateFn): NavLinksResult {
  const slugs = NAV_ITEMS.reduce((acc, key) => {
    acc[key] = key === "home" ? "" : `/${translatePath(key as keyof SlugMap, lang)}`;
    return acc;
  }, {} as Record<NavKey, string>);

  const roomsSlug = slugs["rooms"];

  const navLinks = NAV_ITEMS.map((key) => {
    const label =
      key === "assistance"
        ? t(key, "Help")
        : key === "howToGetHere"
          ? t(key, "How to Get Here")
          : t(key, key.charAt(0).toUpperCase() + key.slice(1));

    if (key === "rooms") {
      const children: NavItemChild[] = [
        { key: "rooms_all", to: roomsSlug, label: "See all rooms" },
        ...Object.entries(ROOM_DROPDOWN_NAMES).map(([id, name]) => ({
          key: id,
          to: `${roomsSlug}/${id}`,
          label: name,
        })),
      ];
      return {
        key,
        to: slugs[key],
        label,
        prefetch: undefined,
        children,
      };
    }

    return {
      key,
      to: slugs[key],
      label,
      prefetch: key === "assistance" ? false : undefined,
      children: undefined,
    };
  });

  return { slugs, navLinks };
}
