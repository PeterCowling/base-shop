// src/components/guides/generic-content/sections.ts
import { nextStableKey,normaliseKeySeed } from "./keys";
import { looksLikePlaceholderTranslation, toStringArray, toTrimmedString } from "./strings";
import type { ListSectionConfig, ResolvedSection, Section, SectionImage, TocOverrides } from "./types";

type LegacySection = Section & { paragraphs?: unknown; list?: unknown; links?: unknown; images?: unknown };

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

  const isGuideKeyShape = (value: string): boolean => {
    if (!value || value.length < 2) return false;
    const code = (i: number) => value.charCodeAt(i);
    const isLower = (cp: number) => cp >= 97 && cp <= 122; // a-z
    const isUpper = (cp: number) => cp >= 65 && cp <= 90; // A-Z
    const isDigit = (cp: number) => cp >= 48 && cp <= 57; // 0-9
    if (!isLower(code(0))) return false;
    let sawBoundary = false;
    for (let i = 1; i < value.length; i++) {
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

  const parseSectionImage = (image: unknown): SectionImage | null => {
    if (!image || typeof image !== "object") return null;
    const record = image as Record<string, unknown>;
    const src = typeof record.src === "string" ? record.src.trim() : "";
    const alt = typeof record.alt === "string" ? record.alt.trim() : "";
    if (!src || !alt) return null;
    const captionRaw = record.caption;
    const caption = typeof captionRaw === "string" ? captionRaw.trim() : undefined;
    const widthRaw = record.width;
    const width =
      typeof widthRaw === "number" && Number.isFinite(widthRaw) && widthRaw > 0
        ? Math.trunc(widthRaw)
        : undefined;
    const heightRaw = record.height;
    const height =
      typeof heightRaw === "number" && Number.isFinite(heightRaw) && heightRaw > 0
        ? Math.trunc(heightRaw)
        : undefined;
    return {
      src,
      alt,
      ...(caption ? { caption } : {}),
      ...(typeof width === "number" ? { width } : {}),
      ...(typeof height === "number" ? { height } : {}),
    };
  };

  const resolveSectionImages = (legacy: LegacySection): SectionImage[] | undefined => {
    const rawImages = legacy.images;
    if (!Array.isArray(rawImages) || rawImages.length === 0) return undefined;
    const parsed = rawImages
      .map(parseSectionImage)
      .filter((image): image is SectionImage => image != null);
    return parsed.length > 0 ? parsed : undefined;
  };

  const resolveSectionBody = (section: Section, legacy: LegacySection): string[] => {
    const bodyParts: string[] = [];
    bodyParts.push(...toStringArray(section.body));
    bodyParts.push(...toStringArray(legacy.paragraphs));
    bodyParts.push(...toStringArray(legacy.list));
    try {
      const rawLinks = legacy.links;
      if (!Array.isArray(rawLinks)) return bodyParts;
      for (const entry of rawLinks) {
        if (!entry || typeof entry !== "object") continue;
        const linkObj = entry as { guideKey?: unknown; key?: unknown; label?: unknown };
        const key = toTrimmedString(linkObj.guideKey) ?? toTrimmedString(linkObj.key);
        const label = toTrimmedString(linkObj.label);
        if (!key || !label || !isGuideKeyShape(key)) continue;
        bodyParts.push(`%LINK:${key}|${label}%`);
      }
    } catch {
      /* ignore invalid links */
    }
    return bodyParts;
  };

  return sections.map((section, index) => {
    const legacy = section as LegacySection;
    // Derive a stable id while preserving semantics expected by tests:
    // - string ids are used as-is (trimmed)
    // - numeric ids are preserved verbatim (e.g. id: 42 -> "42")
    // - when id is missing but a title exists, generate an id from the title
    //   and include the section in the ToC
    const val = section.id as unknown;
    const rawId =
      typeof val === "string"
        ? toTrimmedString(val)
        : typeof val === "number" && Number.isFinite(val)
          ? String(val)
          : undefined;
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
    const bodyParts = resolveSectionBody(section, legacy);
    const images = resolveSectionImages(legacy);

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
      ...(images ? { images } : {}),
    };
  });
}
