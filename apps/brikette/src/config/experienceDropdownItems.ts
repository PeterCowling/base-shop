/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Nav labels pending localization. */
// Experiences dropdown config for the desktop + mobile header nav.
// Labels are English-only nav labels (concise for dropdown UX).
// URLs are computed per-language from guide slug utilities.

import type { NavItemChild } from "@acme/ui/utils/buildNavLinks";

import type { GuideKey } from "@/guides/slugs";
import type { AppLanguage } from "@/i18n.config";
import { guideNamespace, guideSlug } from "@/routes.guides-helpers";
import { translatePath } from "@/utils/translate-path";

type ExperienceDropdownEntry = {
  key: string;
  guideKey: GuideKey;
  label: string;
};

const EXPERIENCE_DROPDOWN_ENTRIES: ExperienceDropdownEntry[] = [
  { key: "exp_path_gods", guideKey: "pathOfTheGods", label: "Path of the Gods" },
  { key: "exp_boat_tours", guideKey: "boatTours", label: "Boat Tours" },
  { key: "exp_capri", guideKey: "capriDayTrip", label: "Capri Day Trip" },
  { key: "exp_beaches", guideKey: "positanoBeaches", label: "Positano Beaches" },
  { key: "exp_sunsets", guideKey: "sunsetViewpoints", label: "Sunset Viewpoints" },
  { key: "exp_eating_out", guideKey: "eatingOutPositano", label: "Where to Eat" },
  { key: "exp_day_trips", guideKey: "dayTripsAmalfi", label: "Best Day Trips" },
];

export function buildExperienceNavItems(lang: AppLanguage): NavItemChild[] {
  const experiencesBase = `/${translatePath("experiences", lang)}`;
  return [
    { key: "experiences_all", to: experiencesBase, label: "See all experiences" },
    ...EXPERIENCE_DROPDOWN_ENTRIES.map(({ key, guideKey, label }) => ({
      key,
      to: `/${guideNamespace(lang, guideKey).baseSlug}/${guideSlug(lang, guideKey)}`,
      label,
    })),
  ];
}
