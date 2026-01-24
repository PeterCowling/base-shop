// src/components/guides/generic-content/sections.ts
import { nextStableKey,normaliseKeySeed } from "./keys";
import { looksLikePlaceholderTranslation, toStringArray, toTrimmedString } from "./strings";
import type { ListSectionConfig, ResolvedSection, Section, TocOverrides } from "./types";

export function toListSection(
  rawItems: unknown,
  title: string,
  id: string,
  options?: { expectedKey?: string; guideKey?: string },
): ListSectionConfig | null {
  const items = toStringArray(rawItems);
  const meaningfulItems = options
    ? items.filter(
        (item) =>
          !looksLikePlaceholderTranslation(item, options.expectedKey, options.guideKey),
      )
    : items;
  if (meaningfulItems.length === 0) return null;
  return { id, title, items };
}

export function resolveSections(
  sections: Section[],
  tocOverrides: TocOverrides,
): ResolvedSection[] {
  const sectionCounter = new Map<string, number>();

  const baseSectionLabel = tocOverrides.labels.get("section");
  // Legacy data may include fields not in the Section type
  type LegacySection = Section & { paragraphs?: unknown; list?: unknown; links?: unknown };
  return sections.map((section, index) => {
    const legacy = section as LegacySection;
    // Derive a stable id while preserving semantics expected by tests:
    // - string ids are used as-is (trimmed)
    // - numeric ids are preserved verbatim (e.g. id: 42 -> "42")
    // - when id is missing but a title exists, generate an id from the title
    //   and include the section in the ToC
    const val = section.id as unknown;
    const rawId = (() => {
      if (typeof val === 'string') return toTrimmedString(val);
      if (typeof val === 'number' && Number.isFinite(val)) return String(val);
      return undefined;
    })();
    const titleSeed = toTrimmedString(section.title);
    const hasTitle = typeof titleSeed === 'string' && titleSeed.length > 0;
    const includeInToc = rawId !== undefined || hasTitle;
    const keySeed = normaliseKeySeed(rawId) ?? normaliseKeySeed(titleSeed) ?? `section-${index + 1}`;
    const key = nextStableKey(keySeed, sectionCounter);
    const id = rawId ?? key;
    const overrideLabel = tocOverrides.labels.get(id) ?? tocOverrides.labels.get(keySeed);

    // Normalise the section body from multiple legacy shapes:
    // - body: string[] (modern)
    // - paragraphs: string[] (legacy)
    // - list: string[] (legacy list rendered as individual paragraphs)
    // - links: Array<{ guideKey?: string; key?: string; label?: string }>
    //   -> render as LINK tokens consumed by renderGuideLinkTokens
    const bodyParts: string[] = [];
    const bodyArray = toStringArray(section.body);
    if (bodyArray.length > 0) bodyParts.push(...bodyArray);
    const paragraphsArray = toStringArray(legacy.paragraphs);
    if (paragraphsArray.length > 0) bodyParts.push(...paragraphsArray);
    const listArray = toStringArray(legacy.list);
    if (listArray.length > 0) bodyParts.push(...listArray);
    try {
      const rawLinks = legacy.links;
      if (Array.isArray(rawLinks)) {
        const isGuideKeyShape = (val: string): boolean => {
          if (!val || val.length < 2) return false;
          const code = (i: number) => val.charCodeAt(i);
          const isLower = (cp: number) => cp >= 97 && cp <= 122; // a-z
          const isUpper = (cp: number) => cp >= 65 && cp <= 90; // A-Z
          const isDigit = (cp: number) => cp >= 48 && cp <= 57; // 0-9
          if (!isLower(code(0))) return false;
          let sawBoundary = false;
          for (let i = 1; i < val.length; i++) {
            const cp = code(i);
            if (isLower(cp) || isDigit(cp)) {
              if (!sawBoundary && isDigit(cp)) sawBoundary = true;
              continue;
            }
            if (isUpper(cp)) {
              if (isUpper(code(i - 1))) return false;
              sawBoundary = true;
              continue;
            }
            return false;
          }
          return sawBoundary;
        };
        for (const entry of rawLinks) {
          if (!entry || typeof entry !== "object") continue;
          const linkObj = entry as { guideKey?: unknown; key?: unknown; label?: unknown };
          const k = toTrimmedString(linkObj.guideKey) ?? toTrimmedString(linkObj.key);
          const label = toTrimmedString(linkObj.label);
          if (k && label) {
            // Only include links to plausible guide keys; silently drop invalid
            const isKnown = isGuideKeyShape(k);
            if (isKnown) {
              bodyParts.push(`%LINK:${k}|${label}%`);
            }
          }
        }
      }
    } catch {
      /* ignore invalid links */
    }

    const titleForHeading = titleSeed ?? "";
    const labelForToc =
      titleSeed ??
      overrideLabel ??
      (baseSectionLabel ? `${baseSectionLabel} ${index + 1}` : `Section ${index + 1}`);

    return {
      key,
      id,
      title: titleForHeading,
      label: labelForToc,
      body: bodyParts,
      includeInToc,
    };
  });
}
