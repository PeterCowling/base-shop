import type { GuideKey } from "@/routes.guides-helpers";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { FallbackTranslator, SectionLike, StructuredSection } from "./types";

function createPlaceholderChecker(key: string) {
  return (value: string, expectedKey: string): boolean => {
    // Normalise common test-stub prefixes like "en:" before checks
    const normalised = value.replace(/^[a-z]{2,3}:/i, "").trim();
    if (!normalised) return true;
    // Treat raw i18n keys (e.g., "content.foo.intro") and bare guide keys
    // as placeholders with no meaningful content.
    if (normalised === expectedKey) return true;
    if (normalised === key) return true;
    if (normalised.startsWith("content.") && normalised.includes(String(key))) return true;
    return false;
  };
}

function normalizeIntroEntries(
  introRaw: unknown,
  placeholderKey: string,
  isPlaceholder: (value: string, expectedKey: string) => boolean,
): string[] {
  const introValues =
    typeof introRaw === "string"
      ? ensureStringArray(introRaw)
      : Array.isArray(introRaw)
        ? ensureStringArray(introRaw)
        : [];
  return introValues
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0 && !isPlaceholder(value, placeholderKey));
}

function resolveIntro(
  translator: FallbackTranslator,
  key: string,
  isPlaceholder: (value: string, expectedKey: string) => boolean,
): string[] {
  const primaryKey = `content.${key}.intro`;
  const alternateKey = `${key}.intro`;
  const primary = normalizeIntroEntries(translator(primaryKey, { returnObjects: true }), primaryKey, isPlaceholder);
  if (primary.length > 0) return primary;
  return normalizeIntroEntries(translator(alternateKey, { returnObjects: true }), alternateKey, isPlaceholder);
}

function readSections(translator: FallbackTranslator, key: string): SectionLike[] {
  const primary = ensureArray<SectionLike>(translator(`content.${key}.sections`, { returnObjects: true }));
  if (primary.length > 0) return primary;
  return ensureArray<SectionLike>(translator(`${key}.sections`, { returnObjects: true }));
}

function buildCompactSections(translator: FallbackTranslator, key: string): StructuredSection[] {
  const compact = translator(`${key}`, { returnObjects: true }) as unknown;
  if (!compact || typeof compact !== "object" || Array.isArray(compact)) return [];

  const record = compact as Record<string, unknown>;
  const headings = (record["headings"] ?? {}) as Record<string, unknown>;
  const buildSection = (
    id: string,
    headingKey: string,
    bodySource: unknown,
    index: number,
  ): StructuredSection | null => {
    const body = ensureStringArray(bodySource)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
    const titleRaw = headings?.[headingKey];
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    if (title.length === 0 && body.length === 0) return null;
    return { id: id || `s-${index}`, title, body };
  };

  const compactSections = [
    buildSection("highlights", "highlights", record["highlights"], 0),
    buildSection("gettingThere", "gettingThere", record["gettingThere"], 1),
    buildSection("tips", "tips", record["tips"], 2),
  ];
  return compactSections.filter((section): section is StructuredSection => section != null);
}

function buildItinerarySections(translator: FallbackTranslator, key: string): StructuredSection[] {
  if (key !== "itinerariesPillar") return [];
  const readString = (suffix: string): string => {
    const raw = translator(`${key}.${suffix}`) as unknown;
    return typeof raw === "string" ? raw.trim() : "";
  };
  const readArray = (suffix: string): string[] =>
    ensureStringArray(translator(`${key}.${suffix}`, { returnObjects: true }))
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);

  const twoTitle = readString("twoDaysHeading");
  const twoBody = readArray("twoDaysItems");
  const threeTitle = readString("threeDaysHeading");
  const threeIntro = readString("threeDaysIntro");
  const threeOptions = readArray("threeDaysOptions");
  const sevenTitle = readString("sevenDaysHeading");
  const sevenBody = readArray("sevenDaysItems");

  const sections: StructuredSection[] = [];
  if (twoTitle || twoBody.length > 0) {
    sections.push({ id: "two-days", title: twoTitle, body: twoBody });
  }
  if (threeTitle || threeIntro || threeOptions.length > 0) {
    const body = [threeIntro, ...threeOptions]
      .filter((value) => typeof value === "string" && value.trim().length > 0) as string[];
    sections.push({ id: "three-days", title: threeTitle, body });
  }
  if (sevenTitle || sevenBody.length > 0) {
    sections.push({ id: "seven-days", title: sevenTitle, body: sevenBody });
  }
  return sections;
}

function normalizeSection(
  section: SectionLike,
  index: number,
  key: string,
  isPlaceholder: (value: string, expectedKey: string) => boolean,
): StructuredSection | null {
  if (!section || typeof section !== "object") return null;
  const id = (() => {
    if (typeof section.id === "string" && section.id.trim().length > 0) {
      return section.id.trim();
    }
    if (typeof section.id === "number" && Number.isFinite(section.id)) {
      // Normalise numeric ids to match section-anchor expectations (e.g., id: 5 -> section-5)
      return `section-${section.id}`;
    }
    return `s-${index}`;
  })();
  const title = typeof section.title === "string" ? section.title.trim() : "";
  const body = ensureStringArray(section.body ?? section.items)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const isTitlePlaceholder = title ? isPlaceholder(title, `content.${key}.sections`) : false;
  const filteredBody = body.filter((value) => !isPlaceholder(value, `content.${key}.sections`));
  if ((title.length === 0 || isTitlePlaceholder) && filteredBody.length === 0) return null;
  return { id, title: isTitlePlaceholder ? "" : title, body: filteredBody };
}

function normalizeSections(
  sections: SectionLike[],
  key: string,
  isPlaceholder: (value: string, expectedKey: string) => boolean,
): StructuredSection[] {
  return sections
    .map((section, index) => normalizeSection(section, index, key, isPlaceholder))
    .filter((section): section is StructuredSection => section != null);
}

/**
 * Builds a structured fallback object ({ intro, sections }) using a translator.
 */
export function buildStructuredFromTranslator(
  translator: FallbackTranslator | undefined,
  guideKey: GuideKey,
  legacyKeys: readonly string[] = [],
): { intro: string[]; sections: StructuredSection[] } | null {
  if (typeof translator !== "function") return null;

  const keys = (() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const add = (value: string | null | undefined) => {
      if (!value) return;
      const normalised = value.trim();
      if (!normalised) return;
      if (seen.has(normalised)) return;
      seen.add(normalised);
      ordered.push(normalised);
    };
    add(String(guideKey));
    for (const legacy of legacyKeys) {
      add(typeof legacy === "string" ? legacy : "");
    }
    return ordered;
  })();

  const buildForKey = (key: string) => {
    try {
      const isPlaceholder = createPlaceholderChecker(key);
      const intro = resolveIntro(translator, key, isPlaceholder);
      let sectionsRaw = readSections(translator, key);

      // If no explicit sections were provided, support a compact fallback
      // shape under guidesFallback where copy is grouped under well-known
      // keys and optional "headings" provides section titles. This matches
      // the structure used by repo JSON such as locales/*/guidesFallback.json.
      if (sectionsRaw.length === 0) {
        try {
          sectionsRaw = buildCompactSections(translator, key);
        } catch {
          // ignore compact fallback shaping errors; continue with empty sections
        }
      }

      // Route-specific structured fallback shaping for itineraries: when the
      // guidesFallback namespace provides compact itinerary keys but no
      // explicit sections were defined, synthesise day-plan sections so tests
      // can assert headings like "Two-day plan" and options like
      // "Stay in Amalfi". Keep this narrowly scoped to the itinerariesPillar
      // guide to avoid changing behaviour for other guides.
      if (sectionsRaw.length === 0 && key === ("itinerariesPillar" as string)) {
        try {
          sectionsRaw = buildItinerarySections(translator, key);
        } catch {
          // ignore itinerary shaping issues; fall back to whatever is available
        }
      }

      const sections = normalizeSections(sectionsRaw, key, isPlaceholder);

      if (intro.length === 0 && sections.length === 0) return null;

      return { intro, sections };
    } catch {
      return null;
    }
  };

  for (const key of keys) {
    const structured = buildForKey(key);
    if (structured) return structured;
  }

  return null;
}
