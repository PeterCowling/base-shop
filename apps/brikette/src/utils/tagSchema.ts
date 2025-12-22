// src/utils/tagSchema.ts
// ----------------------------------------------------------------------------
// Shared tag metadata helpers that are framework-agnostic.
// ----------------------------------------------------------------------------

export type TagMeta = {
  label: string;
  title: string;
  description?: string;
};

export type TagDictionary = Record<string, Record<string, TagMeta>>;

type TagDefinedTerm = {
  "@type": "DefinedTerm";
  "@id": string;
  termCode: string;
  name: string;
  alternateName?: string;
  description?: string;
  inDefinedTermSet: { "@id": string };
};

export type TagDefinedTermSet = {
  "@type": "DefinedTermSet";
  "@id": string;
  inLanguage: string;
  name: string;
  isPartOf: { "@id": string };
  hasDefinedTerm: TagDefinedTerm[];
};

interface BuildDefinedTermsOptions {
  filterLanguages?: readonly string[];
  filterTag?: string;
  setName?: string;
  websiteId?: string;
}

export const buildTagDefinedTermSets = (
  dictionary: TagDictionary,
  baseUrl: string,
  opts: BuildDefinedTermsOptions = {},
): TagDefinedTermSet[] => {
  const {
    filterLanguages,
    filterTag,
    setName = "Guide tags",
    websiteId = `${baseUrl}#website`,
  } = opts;

  const languageFilter = filterLanguages && filterLanguages.length > 0
    ? new Set(filterLanguages.map((lang) => String(lang)))
    : undefined;

  return Object.entries(dictionary).reduce<TagDefinedTermSet[]>((acc, [lang, tags]) => {
    if (languageFilter && !languageFilter.has(lang)) {
      return acc;
    }

    const entries = Object.entries(tags).filter(([slug]) => (filterTag ? slug === filterTag : true));
    if (entries.length === 0) {
      return acc;
    }

    const setId = `${baseUrl}#guide-tags-${lang}`;
    const definedTerms: TagDefinedTerm[] = entries.map(([slug, meta]) => {
      const termId = `${baseUrl}#guide-tag-${slug}-${lang}`;
      const term: TagDefinedTerm = {
        "@type": "DefinedTerm",
        "@id": termId,
        termCode: slug,
        name: meta.label,
        inDefinedTermSet: { "@id": setId },
      };
      if (meta.title && meta.title !== meta.label) {
        term.alternateName = meta.title;
      }
      if (meta.description) {
        term.description = meta.description;
      }
      return term;
    });

    acc.push({
      "@type": "DefinedTermSet",
      "@id": setId,
      inLanguage: lang,
      name: setName,
      isPartOf: { "@id": websiteId },
      hasDefinedTerm: definedTerms,
    });

    return acc;
  }, []);
};
