/* eslint-disable max-lines-per-function -- LINT-1007 [ttl=2026-12-31] Content assembly remains centralized until planned extraction lands. */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

import {
  normalizeDestinationSections,
  normalizeExperienceGuides,
  normalizeRomeTable,
  normalizeSorrentoContent,
  slugify,
} from "./normalizers";
import { INTRO_INTRO_KEY } from "./styles";
import { augmentDestinationSections } from "./transport";
import type {
  AugmentedDestinationSection,
  DestinationSection,
  DestinationSectionImage,
  ExperienceGuidesContent,
  HeaderContent,
  RomeTable,
} from "./types";

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
  romeImage?: DestinationSectionImage;
  destinationFilterLabel: string;
  destinationFilterAllLabel: string;
  filtersHelper: string;
  activeFiltersLabel: string;
  showRomePlanner: boolean;
  introKey: string;
  internalBasePath: string;
  experienceGuides: ExperienceGuidesContent;
};

const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

const ensureString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) {
    return "";
  }
  return trimmed.length > 0 ? trimmed : "";
};

const withFallback = (value: unknown, fallback: string): string => {
  const primary = ensureString(value);
  if (primary) {
    return primary;
  }

  return ensureString(fallback) || fallback;
};

const withIndexedFallback = (
  value: unknown,
  fallbackBase: string,
  index: number
): string => withFallback(value, `${fallbackBase} ${index + 1}`);

export function useHowToGetHereContent(lang: AppLanguage): HowToGetHereContent {
  const { t, ready } = useTranslation("howToGetHere", { lng: lang });

  return useMemo(() => {
    const headerRaw =
      (t("header", { returnObjects: true }) as HeaderContent | undefined) ??
      ({ eyebrow: "", title: "", description: "" } as HeaderContent);
    const header = {
      ...headerRaw,
      eyebrow: withFallback(
        headerRaw.eyebrow,
        withFallback(t("header.eyebrow"), "Travel planner")
      ),
      title: withFallback(
        headerRaw.title,
        withFallback(t("header.title"), "How to Get Here")
      ),
      description: withFallback(
        headerRaw.description,
        withFallback(
          t("header.description"),
          "Plan your route to Hostel Brikette with practical transfer options."
        )
      ),
    } satisfies HeaderContent;

    const taxiContact = ensureString(t("intro.taxiContact"));
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
              ...(sorrento.image ? { image: sorrento.image } : {}),
            },
          ]
        : normalizedSections;

    const sections = augmentDestinationSections(
      normalizedSectionsWithSorrento
    ).map((section, sectionIndex) => {
      const resolvedName = withIndexedFallback(
        section.name,
        "Route guide",
        sectionIndex
      );
      const resolvedDescription = ensureString(section.description);
      const resolvedLinks = section.links.map((link, linkIndex) => ({
        ...link,
        label: withIndexedFallback(
          link.label,
          `${resolvedName} route`,
          linkIndex
        ),
        summary: ensureString(link.summary),
      }));

      return {
        ...section,
        name: resolvedName,
        links: resolvedLinks,
        ...(resolvedDescription ? { description: resolvedDescription } : {}),
      };
    });

    const heroCandidate = ensureString(ready ? t("header.heroAlt") : "");
    const heroFallback = ensureString(ready ? t("header.heroAltFallback") : "");
    const heroImageAlt =
      heroCandidate ||
      ensureString(header.description) ||
      ensureString(header.title) ||
      heroFallback;

    const taxiEyebrow = withFallback(
      t("intro.taxiEyebrow", { defaultValue: header.eyebrow }),
      "Taxi option",
    );
    const shuttleEyebrow = withFallback(
      t("intro.shuttleEyebrow", { defaultValue: header.eyebrow }),
      "Shuttle option",
    );

    const romeTitle = withFallback(
      t("rome.title"),
      "Rome to Positano route planner"
    );
    const romeDescription = withFallback(
      t("rome.description"),
      "Compare route options between Rome and Hostel Brikette."
    );
    const romeTableRaw =
      (t("rome.table", { returnObjects: true }) as Record<string, unknown> | undefined) ??
      ({ headers: { route: "", toRome: "", toHostel: "" }, options: [] });
    const romeTableNormalized = normalizeRomeTable(romeTableRaw);
    const romeTable = {
      headers: {
        route: withFallback(romeTableNormalized.headers.route, "Route"),
        toRome: withFallback(romeTableNormalized.headers.toRome, "To Rome"),
        toHostel: withFallback(
          romeTableNormalized.headers.toHostel,
          "To Hostel"
        ),
      },
      options: romeTableNormalized.options.map((option, optionIndex) => {
        const routeLabel = withIndexedFallback(
          option.route.label,
          "Route option",
          optionIndex
        );
        return {
          ...option,
          route: {
            ...option.route,
            label: routeLabel,
            summary: ensureString(option.route.summary),
          },
          toRome: {
            heading: withFallback(option.toRome.heading, "Outbound"),
            points: option.toRome.points
              .map((point) => ensureString(point))
              .filter(Boolean),
          },
          toHostel: {
            heading: withFallback(option.toHostel.heading, "Return"),
            points: option.toHostel.points
              .map((point) => ensureString(point))
              .filter(Boolean),
          },
        };
      }),
    } satisfies RomeTable;
    const romeImageRaw = (t("rome.image", { returnObjects: true }) as
      | DestinationSectionImage
      | Record<string, unknown>
      | undefined);
    const romeImage =
      romeImageRaw &&
      typeof romeImageRaw.src === "string" &&
      typeof romeImageRaw.alt === "string"
        ? {
            src: romeImageRaw.src,
            alt: romeImageRaw.alt,
            caption: typeof romeImageRaw.caption === "string" ? romeImageRaw.caption : undefined,
          }
        : undefined;

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
    const experienceGuidesNormalized = normalizeExperienceGuides(
      experienceGuidesRaw
    );
    const experienceGuides = {
      ...experienceGuidesNormalized,
      eyebrow: withFallback(experienceGuidesNormalized.eyebrow, "Explore"),
      title: withFallback(
        experienceGuidesNormalized.title,
        "Local experiences"
      ),
      description: ensureString(experienceGuidesNormalized.description),
      items: experienceGuidesNormalized.items.map((item, index) => ({
        ...item,
        label: withIndexedFallback(item.label, "Experience guide", index),
        summary: ensureString(item.summary),
      })),
    } satisfies ExperienceGuidesContent;

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
      romeImage,
    } satisfies HowToGetHereContent;
  }, [lang, ready, t]);
}
