import { GUIDE_KEYS, type GuideKey } from "@/routes.guides-helpers";
import { ensureStringArray } from "@/utils/i18nContent";

export type BeachListItem = { name: string; note: string };
export type GalleryCopy = { alt: string; caption: string };
export type TocItem = { href: string; label: string };
export type SectionContent = { id: string; title: string; body?: string[] };
export type FaqEntry = { q: string; a: string | string[] };

export type ProsConsEntry = {
  title: string;
  pros: string[];
  cons: string[];
  guideKey?: GuideKey;
};

export interface StructuredBeachesContent {
  intro?: string[];
  toc?: TocItem[];
  sections?: SectionContent[];
  prosCons?: ProsConsEntry[];
  itemList?: BeachListItem[];
  gallery?: GalleryCopy[];
  galleryTitle?: string;
  faqs?: FaqEntry[];
}

export function buildItemListJson(items: BeachListItem[], lang: string, pathname: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: lang,
    url: `https://hostel-positano.com${pathname}`,
    itemListElement: items.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, description: b.note })),
  });
}

const isNotNull = <T,>(value: T | null | undefined): value is T => value !== null && value !== undefined;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function parseStructuredBeachesContent(value: unknown): StructuredBeachesContent | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const introRaw = isStringArray(record["intro"]) ? ensureStringArray(record["intro"]) : [];
  const intro = introRaw.length > 0 ? introRaw : undefined;

  const sectionsRaw = Array.isArray(record["sections"]) ? (record["sections"] as unknown[]) : undefined;
  const sections = sectionsRaw
    ?.map((section) => {
      if (!section || typeof section !== "object") return null;
      const sectionRecord = section as Record<string, unknown>;
      const id = typeof sectionRecord["id"] === "string" ? sectionRecord["id"].trim() : "";
      const title = typeof sectionRecord["title"] === "string" ? sectionRecord["title"].trim() : "";
      if (id.length === 0 || title.length === 0) return null;
      const bodyRaw = isStringArray(sectionRecord["body"])
        ? ensureStringArray(sectionRecord["body"])
        : [];
      const body = bodyRaw.length > 0 ? bodyRaw : undefined;
      const sectionContent: SectionContent =
        body !== undefined
          ? { id, title, body }
          : { id, title };
      return sectionContent;
    })
    .filter(isNotNull);

  const tocRaw = Array.isArray(record["toc"]) ? (record["toc"] as unknown[]) : undefined;
  const toc = tocRaw
    ?.map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const tocRecord = entry as Record<string, unknown>;
      const href = typeof tocRecord["href"] === "string" ? tocRecord["href"].trim() : "";
      const label = typeof tocRecord["label"] === "string" ? tocRecord["label"].trim() : "";
      if (href.length === 0 || label.length === 0) return null;
      return { href, label };
    })
    .filter((entry): entry is TocItem => entry !== null);

  const prosConsRaw = Array.isArray(record["prosCons"]) ? (record["prosCons"] as unknown[]) : undefined;
  const allowedGuideKeys = new Set<GuideKey>(GUIDE_KEYS as readonly GuideKey[]);

  const prosCons = prosConsRaw
    ?.map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const entryRecord = entry as Record<string, unknown>;
      const title = typeof entryRecord["title"] === "string" ? entryRecord["title"].trim() : "";
      if (title.length === 0) return null;
      const pros = isStringArray(entryRecord["pros"]) ? ensureStringArray(entryRecord["pros"]) : [];
      const cons = isStringArray(entryRecord["cons"]) ? ensureStringArray(entryRecord["cons"]) : [];
      if (pros.length === 0 && cons.length === 0) return null;
      const maybeGuideKey =
        typeof entryRecord["guideKey"] === "string" &&
        allowedGuideKeys.has(entryRecord["guideKey"] as GuideKey)
          ? (entryRecord["guideKey"] as GuideKey)
          : undefined;
      const entryValue: ProsConsEntry =
        maybeGuideKey !== undefined
          ? { title, pros, cons, guideKey: maybeGuideKey }
          : { title, pros, cons };
      return entryValue;
    })
    .filter(isNotNull);

  const itemListRaw = Array.isArray(record["itemList"]) ? (record["itemList"] as unknown[]) : undefined;
  const itemList = itemListRaw
    ?.map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const entryRecord = entry as Record<string, unknown>;
      const name = typeof entryRecord["name"] === "string" ? entryRecord["name"].trim() : "";
      const note = typeof entryRecord["note"] === "string" ? entryRecord["note"].trim() : "";
      if (name.length === 0 || note.length === 0) return null;
      return { name, note };
    })
    .filter((entry): entry is BeachListItem => entry !== null);

  let galleryTitle: string | undefined;
  let gallery: GalleryCopy[] | undefined;
  const gallerySource = record["gallery"];
  if (Array.isArray(gallerySource)) {
    gallery = gallerySource
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const entryRecord = entry as Record<string, unknown>;
        const alt = typeof entryRecord["alt"] === "string" ? entryRecord["alt"].trim() : "";
        const caption = typeof entryRecord["caption"] === "string" ? entryRecord["caption"].trim() : "";
        if (alt.length === 0 || caption.length === 0) return null;
        return { alt, caption };
      })
      .filter((entry): entry is GalleryCopy => entry !== null);
  } else if (gallerySource && typeof gallerySource === "object") {
    const galleryRecord = gallerySource as Record<string, unknown>;
    if (typeof galleryRecord["title"] === "string") {
      const trimmedTitle = galleryRecord["title"].trim();
      if (trimmedTitle.length > 0) {
        galleryTitle = trimmedTitle;
      }
    }
    if (Array.isArray(galleryRecord["items"])) {
      gallery = galleryRecord["items"]
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const entryRecord = entry as Record<string, unknown>;
          const alt = typeof entryRecord["alt"] === "string" ? entryRecord["alt"].trim() : "";
          const caption = typeof entryRecord["caption"] === "string" ? entryRecord["caption"].trim() : "";
          if (alt.length === 0 || caption.length === 0) return null;
          return { alt, caption };
        })
        .filter((entry): entry is GalleryCopy => entry !== null);
    }
  }

  const faqsRaw = Array.isArray(record["faqs"]) ? (record["faqs"] as unknown[]) : undefined;
  const faqs = faqsRaw
    ?.map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const entryRecord = entry as Record<string, unknown>;
      if (typeof entryRecord["q"] !== "string") return null;
      const question = entryRecord["q"].trim();
      if (question.length === 0) return null;
      const answer = entryRecord["a"];
      if (typeof answer === "string") {
        const trimmed = answer.trim();
        if (trimmed.length === 0) return null;
        return { q: question, a: trimmed } satisfies FaqEntry;
      }
      if (isStringArray(answer)) {
        const answers = ensureStringArray(answer);
        if (answers.length === 0) return null;
        return { q: question, a: answers } satisfies FaqEntry;
      }
      return null;
    })
    .filter(isNotNull);

  const structured: StructuredBeachesContent = {
    ...(intro && intro.length > 0 ? { intro } : {}),
    ...(sections && sections.length > 0 ? { sections } : {}),
    ...(toc && toc.length > 0 ? { toc } : {}),
    ...(prosCons && prosCons.length > 0 ? { prosCons } : {}),
    ...(itemList && itemList.length > 0 ? { itemList } : {}),
    ...(gallery && gallery.length > 0 ? { gallery } : {}),
    ...(galleryTitle ? { galleryTitle } : {}),
    ...(faqs && faqs.length > 0 ? { faqs } : {}),
  };

  return hasStructuredContent(structured) ? structured : null;
}

export const hasStructuredContent = (
  content: StructuredBeachesContent | null | undefined
): content is StructuredBeachesContent => {
  if (!content) return false;

  return Boolean(
    (content.intro && content.intro.length) ||
      (content.sections && content.sections.length) ||
      (content.prosCons && content.prosCons.length) ||
      (content.itemList && content.itemList.length) ||
      (content.gallery && content.gallery.length) ||
      (content.faqs && content.faqs.length)
  );
};
