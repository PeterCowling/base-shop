// src/utils/parseAmaKeywords.ts
// -----------------------------------------------------------------------------
// Normalises the assistance keywords namespace into a Fuse-friendly shape.
// -----------------------------------------------------------------------------

const SYNONYM_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;
const LINK_INDICES = [1, 2, 3, 4] as const;
type SynonymKey = (typeof SYNONYM_KEYS)[number];
type LinkIndex = (typeof LINK_INDICES)[number];
type LinkKey = `link${LinkIndex}`;
type LinkTextKey = `linkText${LinkIndex}`;

export interface AssistanceKeywordLink {
  href: string;
  text: string;
}

export interface AssistanceKeyword {
  type: number;
  slug: string;
  synonyms: string[];
  question: string;
  answer: string;
  links: AssistanceKeywordLink[];
}

export type AssistanceKeywordResourceEntry = {
  type?: number;
  slug?: string;
  humanReadableQuestion?: string;
  humanReadableAnswer?: string;
} & Partial<Record<SynonymKey, string>> &
  Partial<Record<LinkKey, string>> &
  Partial<Record<LinkTextKey, string>>;

export interface AssistanceKeywordResource {
  entries?: AssistanceKeywordResourceEntry[];
}

const normaliseString = (value?: string): string => value?.trim() ?? "";

const pickResource = (
  primary?: AssistanceKeywordResource | null,
  fallback?: AssistanceKeywordResource | null,
): AssistanceKeywordResource | undefined => {
  if (primary?.entries?.length) return primary;
  if (fallback?.entries?.length) return fallback;
  return undefined;
};

const buildSynonyms = (entry: AssistanceKeywordResourceEntry): string[] =>
  SYNONYM_KEYS.map((key) => normaliseString(entry[key]))
    .filter((value) => value.length > 0)
    // Deduplicate while maintaining order so Fuse doesn’t index repeats.
    .filter((value, index, array) => array.indexOf(value) === index);

const buildLinks = (entry: AssistanceKeywordResourceEntry): AssistanceKeywordLink[] => {
  const links: AssistanceKeywordLink[] = [];
  for (const index of LINK_INDICES) {
    const href = normaliseString(entry[`link${index}` as LinkKey]);
    if (!href) continue;
    const text = normaliseString(entry[`linkText${index}` as LinkTextKey]) || href;
    links.push({ href, text });
  }
  return links;
};

export const parseAssistanceKeywords = (
  primary?: AssistanceKeywordResource | null,
  fallback?: AssistanceKeywordResource | null,
): AssistanceKeyword[] => {
  const resource = pickResource(primary, fallback);
  if (!resource?.entries) return [];

  return resource.entries.map((entry, index) => {
    const synonyms = buildSynonyms(entry);
    return {
      type: Number.isFinite(entry.type) ? Number(entry.type) : 0,
      slug: normaliseString(entry.slug) || `entry-${index + 1}`,
      synonyms,
      question: normaliseString(entry.humanReadableQuestion),
      answer: normaliseString(entry.humanReadableAnswer),
      links: buildLinks(entry),
    } satisfies AssistanceKeyword;
  });
};
