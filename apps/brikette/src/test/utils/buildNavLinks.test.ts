import { describe, expect, it } from "vitest";

import { NAV_ITEMS, type NavKey } from "@/config/navItems";
import type { AppLanguage } from "@/i18n.config";
import { SLUGS } from "@/slug-map";
import { buildNavLinks } from "@/utils/buildNavLinks";

const t = (key: string, fallback?: string) => fallback ?? key;

describe("buildNavLinks", () => {
  const lang: AppLanguage = "en";

  it("returns slugs for every nav item", () => {
    const { slugs } = buildNavLinks(lang, t);

    const expected = NAV_ITEMS.reduce((acc, key) => {
      const slug = key === "home" ? "" : `/${SLUGS[key as keyof typeof SLUGS][lang]}`;
      acc[key as NavKey] = slug;
      return acc;
    }, {} as Record<NavKey, string>);

    expect(slugs).toEqual(expected);
  });

  it("returns navLinks with translated labels", () => {
    const { navLinks } = buildNavLinks(lang, t);

    const expected = NAV_ITEMS.map((key) => ({
      key,
      to: key === "home" ? "" : `/${SLUGS[key as keyof typeof SLUGS][lang]}`,
      label: t(
        key,
        key === "assistance"
          ? "Help"
          : key === "howToGetHere"
          ? "How to Get Here"
          : key.charAt(0).toUpperCase() + key.slice(1),
      ),
    }));

    expect(navLinks).toEqual(expected);
  });
});