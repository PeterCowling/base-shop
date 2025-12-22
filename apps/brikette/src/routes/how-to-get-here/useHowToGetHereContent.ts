import { useMemo } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

import { augmentDestinationSections } from "./transport";
import {
  normalizeDestinationSections,
  normalizeExperienceGuides,
  normalizeRomeTable,
  normalizeSorrentoContent,
  slugify,
} from "./normalizers";
import type {
  AugmentedDestinationSection,
  DestinationSection,
  HeaderContent,
  RomeTable,
  ExperienceGuidesContent,
} from "./types";
import { INTRO_INTRO_KEY } from "./styles";

export type HowToGetHereContent = {
  t: TFunction<"howToGetHere">;
  header: HeaderContent;
  sections: AugmentedDestinationSection[];
  heroImageAlt: string;
  taxiContact: string;
  taxiEyebrow: string;
  shuttleEyebrow: string;
  romeTitle: string;
  romeDescription: string;
  romeTable: RomeTable;
  destinationFilterLabel: string;
  destinationFilterAllLabel: string;
  filtersHelper: string;
  activeFiltersLabel: string;
  showRomePlanner: boolean;
  introKey: string;
  internalBasePath: string;
  experienceGuides: ExperienceGuidesContent;
};

const ensureString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
};

const withFallback = (value: unknown, fallback: string): string => {
  const primary = ensureString(value);
  if (primary) {
    return primary;
  }

  return ensureString(fallback) || fallback;
};

export function useHowToGetHereContent(lang: AppLanguage): HowToGetHereContent {
  const { t, ready } = useTranslation("howToGetHere", { lng: lang });

  return useMemo(() => {
    const header =
      (t("header", { returnObjects: true }) as HeaderContent | undefined) ??
      ({ eyebrow: "", title: "", description: "" } as HeaderContent);

    const taxiContact = t("intro.taxiContact");
    const sorrentoRaw =
      (t("sorrento", { returnObjects: true }) as Record<string, unknown> | undefined) ??
      ({ title: "", links: [] });
    const sorrento = normalizeSorrentoContent(sorrentoRaw);

    const destinationSectionsRaw = t("destinations.sections", { returnObjects: true }) as
      | DestinationSection[]
      | Record<string, DestinationSection>
      | DestinationSection
      | undefined;
    const normalizedSections = normalizeDestinationSections(destinationSectionsRaw);

    const normalizedSectionsWithSorrento =
      sorrento.title && sorrento.links.length
        ? [
            ...normalizedSections,
            {
              id: slugify(sorrento.title) || "sorrento",
              name: sorrento.title,
              links: sorrento.links,
            },
          ]
        : normalizedSections;

    const sections = augmentDestinationSections(normalizedSectionsWithSorrento);

    const heroCandidate = ensureString(ready ? t("header.heroAlt") : "");
    const heroFallback = ensureString(ready ? t("header.heroAltFallback") : "");
    const heroImageAlt =
      heroCandidate ||
      ensureString(header.description) ||
      ensureString(header.title) ||
      heroFallback;

    const taxiEyebrow = t("intro.taxiEyebrow", { defaultValue: header.eyebrow });
    const shuttleEyebrow = t("intro.shuttleEyebrow", { defaultValue: header.eyebrow });

    const romeTitle = (t("rome.title") as string) || "";
    const romeDescription = (t("rome.description") as string) || "";
    const romeTableRaw =
      (t("rome.table", { returnObjects: true }) as Record<string, unknown> | undefined) ??
      ({ headers: { route: "", toRome: "", toHostel: "" }, options: [] });
    const romeTable = normalizeRomeTable(romeTableRaw);

    const destinationStatsFallback = withFallback(
      t("header.stats.destinations"),
      "Destinations",
    );
    const destinationFilterLabel = withFallback(
      t("destinations.filterLabel", { defaultValue: destinationStatsFallback }),
      destinationStatsFallback,
    );
    const transportAllFallback = ensureString(t("filters.transportAll"));
    const destinationFilterAllLabel = withFallback(
      t("destinations.filterAll", { defaultValue: transportAllFallback }),
      transportAllFallback,
    );
    const filtersHelper = ensureString(t("filters.helper", { defaultValue: "" }));
    const filtersTitleFallback = withFallback(t("filters.title"), "Filters");
    const activeFiltersLabel = withFallback(
      t("filters.activeLabel", { defaultValue: filtersTitleFallback }),
      filtersTitleFallback,
    );

    const showRomePlanner = lang === "en";
    const introKey = INTRO_INTRO_KEY;
    const howToSlug = getSlug("howToGetHere", lang);
    const internalBasePath = `/${lang}/${howToSlug}`;
    const experienceGuidesRaw = t("experienceGuides", { returnObjects: true }) as unknown;
    const experienceGuides = normalizeExperienceGuides(experienceGuidesRaw);

    return {
      t,
      header,
      sections,
      heroImageAlt,
      taxiContact,
      taxiEyebrow,
      shuttleEyebrow,
      romeTitle,
      romeDescription,
      romeTable,
      destinationFilterLabel,
      destinationFilterAllLabel,
      filtersHelper,
      activeFiltersLabel,
      showRomePlanner,
      introKey,
      internalBasePath,
      experienceGuides,
    } satisfies HowToGetHereContent;
  }, [lang, ready, t]);
}
