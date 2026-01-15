// src/routes/guides/positano-beaches.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";
import type { GuideSeoTemplateContext, Translator } from "./guide-seo/types";

import ImageGallery from "@/components/guides/ImageGallery";
import GenericContent, { type GenericContentTranslator } from "@/components/guides/GenericContent";
import ProsConsTable from "@/components/guides/ProsConsTable";
import TableOfContents from "@/components/guides/TableOfContents";
import GuideFaqSection from "@/components/guides/GuideFaqSection";
import BarMenuStructuredData from "@/components/seo/BarMenuStructuredData";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideHref, guideSlug, GUIDE_KEYS, type GuideKey } from "@/routes.guides-helpers";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import i18n from "@/i18n";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import {
  buildItemListJson,
  hasStructuredContent,
  parseStructuredBeachesContent,
} from "./positano-beaches/structuredContent";
import { resolveLocalizedString } from "./positano-beaches/strings";
import {
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  OG_IMAGE,
} from "./positano-beaches/seoConstants";

import type {
  StructuredBeachesContent,
  BeachListItem,
  GalleryCopy,
  ProsConsEntry,
  FaqEntry,
} from "./positano-beaches/structuredContent";

export { buildItemListJson, hasStructuredContent, parseStructuredBeachesContent } from "./positano-beaches/structuredContent";
export { resolveLocalizedString } from "./positano-beaches/strings";

export const handle = { tags: ["beaches", "positano"] };

export const GUIDE_KEY: GuideKey = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;

const RETURN_OBJECTS_OPTION = { returnObjects: true } as const satisfies Record<string, unknown>;
const GUIDE_KEY_SET = new Set<GuideKey>(GUIDE_KEYS as readonly GuideKey[]);

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoBeaches");
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry): entry is string => entry.length > 0)
    : [];

const toGuideKey = (value: unknown): GuideKey | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return GUIDE_KEY_SET.has(trimmed as GuideKey) ? (trimmed as GuideKey) : undefined;
};

const normaliseItemList = (value: unknown): BeachListItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const name = readNonEmptyString(entry.name);
      const note = readNonEmptyString(entry.note);
      if (!name || !note) return null;
      return { name, note };
    })
    .filter((entry): entry is BeachListItem => entry !== null);
};

const extractItemListFrom = (value: unknown): BeachListItem[] => {
  if (!isRecord(value)) return [];
  return normaliseItemList((value as { itemList?: unknown }).itemList);
};

const normaliseGalleryEntries = (value: unknown): GalleryCopy[] => {
  const parseEntry = (entry: unknown): GalleryCopy | null => {
    if (!isRecord(entry)) return null;
    const alt = readNonEmptyString(entry.alt);
    const caption = readNonEmptyString(entry.caption);
    if (!alt || !caption) return null;
    return { alt, caption };
  };

  if (Array.isArray(value)) {
    return value.map(parseEntry).filter((entry): entry is GalleryCopy => entry !== null);
  }

  if (isRecord(value)) {
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.map(parseEntry).filter((entry): entry is GalleryCopy => entry !== null);
    }
  }

  return [];
};

const extractGalleryFrom = (value: unknown): GalleryCopy[] => {
  if (!isRecord(value)) return [];
  return normaliseGalleryEntries((value as { gallery?: unknown }).gallery);
};

const normaliseProsConsEntries = (value: unknown): ProsConsEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const title = readNonEmptyString(entry.title);
      if (!title) return null;
      const pros = readStringArray(entry.pros);
      const cons = readStringArray(entry.cons);
      if (pros.length === 0 && cons.length === 0) return null;
      const guideKey = toGuideKey(entry.guideKey);
      const result: ProsConsEntry = { title, pros, cons };
      if (guideKey) {
        result.guideKey = guideKey;
      }
      return result;
    })
    .filter((entry): entry is ProsConsEntry => entry !== null);
};

const extractProsConsFrom = (value: unknown): ProsConsEntry[] => {
  if (!isRecord(value)) return [];
  return normaliseProsConsEntries((value as { prosCons?: unknown }).prosCons);
};

const normaliseFaqEntries = (value: unknown): FaqEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const question = readNonEmptyString(entry.q);
      if (!question) return null;
      const answer = entry.a;
      if (typeof answer === "string") {
        const single = readNonEmptyString(answer);
        if (!single) return null;
        return { q: question, a: single } as FaqEntry;
      }
      const answers = readStringArray(answer);
      if (answers.length === 0) return null;
      return { q: question, a: answers } as FaqEntry;
    })
    .filter((entry): entry is FaqEntry => entry !== null);
};

const extractFaqsFrom = (value: unknown): FaqEntry[] => {
  if (!isRecord(value)) return [];
  return normaliseFaqEntries((value as { faqs?: unknown }).faqs);
};

function buildBarMenuScript(context: GuideSeoTemplateContext): JSX.Element | null {
  try {
    const raw = context.translateGuides("content.positanoBeaches", RETURN_OBJECTS_OPTION);
    let items = extractItemListFrom(raw);
    if (items.length === 0) {
      const nested = context.translateGuides("content.positanoBeaches.itemList", RETURN_OBJECTS_OPTION);
      items = normaliseItemList(nested);
    }
    if (items.length === 0) {
      const fixedT = typeof i18n.getFixedT === "function" ? i18n.getFixedT("en", "guides") : undefined;
      if (typeof fixedT === "function") {
        const enRaw = fixedT("content.positanoBeaches", RETURN_OBJECTS_OPTION);
        items = extractItemListFrom(enRaw);
        if (items.length === 0) {
          const enNested = fixedT("content.positanoBeaches.itemList", RETURN_OBJECTS_OPTION);
          items = normaliseItemList(enNested);
        }
      }
    }
    if (items.length === 0) {
      return null;
    }
    const json = buildItemListJson(items, context.lang, new URL(context.canonicalUrl).pathname);
    return <BarMenuStructuredData json={json} />;
  } catch {
    return null;
  }
}

function resolveGalleryPairs(
  localGallery: GalleryCopy[],
  fallbackGallery: GalleryCopy[],
): { src: string; alt: string; caption: string }[] {
  return Array.from({ length: Math.max(localGallery.length, fallbackGallery.length) }).map((_, index) => {
    const pick = (field: "alt" | "caption"): string => {
      const localValue = localGallery[index]?.[field];
      const fallbackValue = fallbackGallery[index]?.[field] ?? "";
      const key = `content.positanoBeaches.gallery.${index}.${field}` as const;
      return resolveLocalizedString(localValue, fallbackValue, key);
    };
    return {
      src: buildCfImageUrl(
        index === 0 ? "/img/positano-panorama.avif" : "/img/positano-fornillo.avif",
        {
          width: 1200,
          height: index === 0 ? 630 : 800,
          quality: 85,
          format: "auto",
        },
      ),
      alt: pick("alt"),
      caption: pick("caption"),
    };
  });
}

function normalizeFaqTitle(context: GuideSeoTemplateContext, guidesEn: Translator): string | undefined {
  const key = "content.positanoBeaches.faqsTitle" as const;
  const clean = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed === key || trimmed === key.replace(/^content\./, "")) {
      return undefined;
    }
    return trimmed;
  };
  const localValue = clean(context.translateGuides(key));
  if (localValue) return localValue;
  try {
    const enValue = clean(guidesEn(key));
    if (enValue) return enValue;
  } catch {
    /* noop */
  }
  try {
    const fallbackLabel = (() => {
      const label = guidesEn("labels.faqsHeading");
      return resolveLocalizedString(
        context.translateGuides("labels.faqsHeading"),
        typeof label === "string" ? label : "",
        "labels.faqsHeading",
      );
    })();
    return fallbackLabel;
  } catch {
    return resolveLocalizedString(context.translateGuides("labels.faqsHeading"), "", "labels.faqsHeading");
  }
}

function BeachesArticleExtras({ context }: { context: GuideSeoTemplateContext }): JSX.Element | null {
  const { tGuides, guidesEn, anyEn } = useGuideTranslations(context.lang);

  const localRaw = tGuides("content.positanoBeaches", RETURN_OBJECTS_OPTION);
  const resolvedRaw = parseStructuredBeachesContent(localRaw);
  const resolved: StructuredBeachesContent = resolvedRaw ?? {};

  const parts: JSX.Element[] = [];

  let parsedEn: StructuredBeachesContent | null = null;
  let enRawObj: unknown;
  try {
    enRawObj = guidesEn("content.positanoBeaches", RETURN_OBJECTS_OPTION);
    parsedEn = parseStructuredBeachesContent(enRawObj);
  } catch {
    /* noop */
  }

  try {
    const tocItems = (() => {
      const fallbackToc = parsedEn?.toc ?? [];
      if (fallbackToc.length > 0) return fallbackToc;
      const explicit = resolved.toc ?? [];
      if (explicit.length > 0) return explicit;
      const derived =
        resolved.sections
          ?.filter((section) => Boolean(readNonEmptyString(section.id) && readNonEmptyString(section.title)))
          .map((section) => ({ href: `#${section.id}`, label: section.title })) ?? [];
      return derived;
    })();
    if (tocItems.length > 0) {
      parts.push(<TableOfContents key="toc" items={tocItems} />);
    }
  } catch {
    /* ignore ToC synthesis errors */
  }

  const localGallery = (() => {
    const fromRaw = extractGalleryFrom(localRaw);
    if (fromRaw.length > 0) return fromRaw;
    return resolved.gallery ?? [];
  })();

  let fbGallery: GalleryCopy[] = parsedEn?.gallery ?? [];
  if (fbGallery.length === 0 && enRawObj) {
    const fromRaw = extractGalleryFrom(enRawObj);
    if (fromRaw.length > 0) fbGallery = fromRaw;
  }
  if (fbGallery.length === 0) {
    const nested = context.translateGuides("content.positanoBeaches.gallery.items", RETURN_OBJECTS_OPTION);
    const normalised = normaliseGalleryEntries(nested);
    if (normalised.length > 0) fbGallery = normalised;
  }
  if (fbGallery.length === 0) {
    const fixedT = typeof i18n.getFixedT === "function" ? i18n.getFixedT("en", "guides") : undefined;
    if (typeof fixedT === "function") {
      const fallbackRaw = fixedT("content.positanoBeaches", RETURN_OBJECTS_OPTION);
      const fromRaw = extractGalleryFrom(fallbackRaw);
      if (fromRaw.length > 0) {
        fbGallery = fromRaw;
      }
      if (fbGallery.length === 0) {
        const nested = fixedT("content.positanoBeaches.gallery.items", RETURN_OBJECTS_OPTION);
        const normalised = normaliseGalleryEntries(nested);
        if (normalised.length > 0) fbGallery = normalised;
      }
    }
  }
  if (fbGallery.length === 0) {
    try {
      const enItems = anyEn("guides:content.positanoBeaches.gallery.items", RETURN_OBJECTS_OPTION);
      const normalised = normaliseGalleryEntries(enItems);
      if (normalised.length > 0) fbGallery = normalised;
    } catch {
      /* noop */
    }
  }
  if (localGallery.length > 0 || fbGallery.length > 0) {
    const galleryItems = resolveGalleryPairs(localGallery, fbGallery).filter(
      (item) => (item.alt ?? "").trim().length > 0 || (item.caption ?? "").trim().length > 0,
    );
    if (galleryItems.length > 0) {
      if (resolved.galleryTitle) {
        parts.push(
          <h2 key="gallery-title">{resolved.galleryTitle}</h2>, // i18n-exempt -- TECH-000 [ttl=2026-12-31]
        );
      }
      parts.push(<ImageGallery key="gallery" items={galleryItems} />);
    }
  }

  const prosConsSrc = (() => {
    if (resolved.prosCons?.length) return resolved.prosCons;
    if (parsedEn?.prosCons?.length) return parsedEn.prosCons;
    const fromRaw = extractProsConsFrom(enRawObj);
    if (fromRaw.length > 0) return fromRaw;
    return [];
  })();
  if (prosConsSrc.length > 0) {
    parts.push(
      <ProsConsTable
        key="proscons"
        rows={prosConsSrc.map((entry) => ({
          title: entry.title,
          pros: entry.pros,
          cons: entry.cons,
          href: entry.guideKey ? guideHref(context.lang, entry.guideKey) : undefined,
        }))}
      />,
    );
  }

  const faqsSrc = (() => {
    if (resolved.faqs?.length) return resolved.faqs;
    if (parsedEn?.faqs?.length) return parsedEn.faqs;
    const fromRaw = extractFaqsFrom(enRawObj);
    if (fromRaw.length > 0) return fromRaw;
    return [];
  })();
  if (faqsSrc.length > 0) {
    try {
      if (process.env.DEBUG_TOC === "1") {
        console.log("[PositanoBeaches faqs]", { localCount: resolved.faqs?.length });
      }
    } catch {
      /* noop */
    }
    const faqTitle = normalizeFaqTitle(context, guidesEn);
    parts.push(
      <GuideFaqSection
        key="faqs"
        title={faqTitle}
        faqs={faqsSrc.map((f) => ({
          question: f.q,
          answers: Array.isArray(f.a) ? f.a : [f.a],
        }))}
      />,
    );
  }

  return parts.length ? <>{parts}</> : null;
}

function BeachesArticleLead({
  context,
  extras,
}: {
  context: GuideSeoTemplateContext;
  extras: BeachesLeadExtras;
}): JSX.Element | null {
  const { tGuides } = useGuideTranslations(context.lang);
  if (extras.hasStructured) return null;
  return <GenericContent t={tGuides as unknown as GenericContentTranslator} guideKey={GUIDE_KEY} />;
}

type BeachesLeadExtras = {
  hasStructured: boolean;
};

function collectBeachesLeadExtras(context: GuideSeoTemplateContext): BeachesLeadExtras {
  try {
    const local = context.translateGuides("content.positanoBeaches", RETURN_OBJECTS_OPTION);
    return {
      hasStructured: hasStructuredContent((local ?? null) as StructuredBeachesContent | null),
    };
  } catch {
    return { hasStructured: false };
  }
}

const beachesStructuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: (context) => collectBeachesLeadExtras(context),
  render: (context, extras) => <BeachesArticleLead context={context} extras={extras} />,
  selectTocItems: () => [],
  isStructured: (extras) => extras.hasStructured,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    renderGenericContent: false,
    additionalScripts: (context) => buildBarMenuScript(context),
    articleExtras: (context) => <BeachesArticleExtras context={context} />,
    articleLead: beachesStructuredLead.articleLead,
    relatedGuides: {
      items: [
        { key: "fornilloBeachGuide" },
        { key: "arienzoBeachClub" },
        { key: "marinaDiPraiaBeaches" },
      ],
    },
  }),
  structuredArticle: beachesStructuredLead.structuredArticle,
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, entry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: OG_IMAGE.transform.quality,
      format: OG_IMAGE.transform.format,
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: () => buildRouteLinks(),
});

export default Component;
export { clientLoader, meta, links };