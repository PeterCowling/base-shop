/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Nav labels pending localization. */
// How-to-get-here dropdown config for the desktop + mobile header nav.
// Lists the most common inbound arrival routes to Positano.
// URLs are computed per-language from guide slug utilities.

import type { NavItemChild } from "@acme/ui/utils/buildNavLinks";

import type { GuideKey } from "@/guides/slugs";
import type { AppLanguage } from "@/i18n.config";
import { guideNamespace, guideSlug } from "@/routes.guides-helpers";
import { translatePath } from "@/utils/translate-path";

type HowToGetHereDropdownEntry = {
  key: string;
  guideKey: GuideKey;
  label: string;
};

const HOW_TO_GET_HERE_DROPDOWN_ENTRIES: HowToGetHereDropdownEntry[] = [
  { key: "htgh_naples_airport", guideKey: "naplesAirportPositanoBus", label: "From Naples Airport" },
  { key: "htgh_naples_ferry", guideKey: "naplesCenterPositanoFerry", label: "From Naples by Ferry" },
  { key: "htgh_sorrento", guideKey: "sorrentoPositanoBus", label: "From Sorrento" },
  { key: "htgh_amalfi", guideKey: "amalfiPositanoFerry", label: "From Amalfi" },
  { key: "htgh_salerno", guideKey: "salernoPositano", label: "From Salerno" },
  { key: "htgh_capri", guideKey: "capriPositanoFerry", label: "From Capri" },
  { key: "htgh_car", guideKey: "arriveByCar", label: "Arriving by Car" },
];

export function buildHowToGetHereNavItems(lang: AppLanguage): NavItemChild[] {
  const howToGetHereBase = `/${translatePath("howToGetHere", lang)}`;
  return [
    { key: "htgh_all", to: howToGetHereBase, label: "See all routes" },
    ...HOW_TO_GET_HERE_DROPDOWN_ENTRIES.map(({ key, guideKey, label }) => ({
      key,
      to: `/${guideNamespace(lang, guideKey).baseSlug}/${guideSlug(lang, guideKey)}`,
      label,
    })),
  ];
}
