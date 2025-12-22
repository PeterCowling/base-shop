// src/routes/guides/staying-safe-positano-amalfi-coast.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

// Enforce shared guide template usage for linting
import type {} from "@/routes/guides/_GuideSeoTemplate";

import GenericContent from "@/components/guides/GenericContent";
import type { GuideSeoTemplateContext, NormalisedFaq, NormalisedSection } from "./guide-seo/types";
import getGuideResource from "@/routes/guides/utils/getGuideResource";

import type { LinksFunction } from "react-router";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest, toAppLanguage } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import i18n from "@/i18n";
import type { LoaderFunctionArgs } from "react-router-dom";
import { buildRouteMeta } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { isGuideContentFallback } from "@/utils/guideContentFallbackRegistry";
import { buildLinks as buildSeoLinks } from "@/utils/seo";

export const handle = { tags: ["safety", "positano", "amalfi", "general-tourists", "solo-travel"] };

export const GUIDE_KEY: GuideKey = "safetyAmalfi";
export const GUIDE_SLUG = "staying-safe-positano-amalfi-coast" as const;

type SectionResource = Partial<Pick<NormalisedSection, "id" | "title" | "body">>;
type FaqResource = Partial<Pick<NormalisedFaq, "q" | "a">>;

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

const toSectionResources = (value: unknown): SectionResource[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") return {};
    const record = entry as Record<string, unknown>;
    const body = ensureStringArray(record["body"]);
    const id = typeof record["id"] === "string" ? record["id"] : undefined;
    const title = typeof record["title"] === "string" ? record["title"] : undefined;
    return {
      ...(id ? { id } : {}),
      ...(title ? { title } : {}),
      ...(body.length > 0 ? { body } : {}),
    };
  });
};

const toFaqResources = (value: unknown): FaqResource[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") return {};
    const record = entry as Record<string, unknown>;
    const questionSource =
      typeof record["q"] === "string"
        ? record["q"]
        : typeof record["question"] === "string"
        ? record["question"]
        : undefined;
    const question = questionSource?.trim();
    const answers = ensureStringArray(record["a"] ?? record["answer"]);
    return {
      ...(question && question.length > 0 ? { q: question } : {}),
      ...(answers.length > 0 ? { a: answers } : {}),
    } satisfies FaqResource;
  });
};

const resolveGuideLabel = (
  context: Pick<GuideSeoTemplateContext, "translateGuides" | "translateGuidesEn" | "lang">,
  key: string,
): string | null => {
  const sanitize = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === key || trimmed.startsWith("labels.")) return null;
    return trimmed;
  };

  const tryTranslator = (
    translator: GuideSeoTemplateContext["translateGuides"] | GuideSeoTemplateContext["translateGuidesEn"],
  ): string | null => {
    if (typeof translator !== "function") return null;
    try {
      return sanitize(translator(key));
    } catch {
      return null;
    }
  };

  const tryResource = (lang: string | undefined, includeFallback?: boolean): string | null => {
    try {
      const options =
        typeof includeFallback === "boolean" ? { includeFallback } : undefined;
      const value = getGuideResource<string | null>(lang, key, options);
      return sanitize(value ?? undefined);
    } catch {
      return null;
    }
  };

  return (
    tryTranslator(context.translateGuides) ??
    tryTranslator(context.translateGuidesEn) ??
    tryResource(context.lang, false) ??
    tryResource(context.lang) ??
    tryResource("en", false) ??
    tryResource("en") ??
    null
  );
};

const hasLocalizedStructuredContent = ({ lang }: Pick<GuideSeoTemplateContext, "lang">): boolean => {
  try {
    const intro = ensureStringArray(
      getGuideResource<unknown>(lang, `content.${GUIDE_KEY}.intro`, { includeFallback: false }),
    );
    if (intro.some((paragraph) => paragraph.trim().length > 0)) return true;
  } catch {
    /* ignore and continue */
  }

  try {
    const sectionsRaw = getGuideResource<unknown[]>(lang, `content.${GUIDE_KEY}.sections`, {
      includeFallback: false,
    });
    const sections = toSectionResources(sectionsRaw);
    if (
      sections.some((section) => {
        const title = typeof section?.title === "string" ? section.title.trim() : "";
        const body = ensureStringArray(section?.body);
        const hasBody = body.some((paragraph) => (typeof paragraph === "string" ? paragraph.trim() : "").length > 0);
        return title.length > 0 || hasBody;
      })
    ) {
      return true;
    }
  } catch {
    /* ignore and continue */
  }

  try {
    const faqsRaw = getGuideResource<unknown[]>(lang, `content.${GUIDE_KEY}.faqs`, { includeFallback: false });
    if (
      Array.isArray(faqsRaw) &&
      faqsRaw.some((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const record = entry as Record<string, unknown>;
        const questionSource =
          typeof record["q"] === "string"
            ? record["q"]
            : typeof record["question"] === "string"
            ? record["question"]
            : "";
        const question = questionSource.trim();
        const answerSource = (record["a"] ?? record["answer"]) as unknown;
        const answer = ensureStringArray(answerSource);
        const hasAnswer = answer.some((value) => value.trim().length > 0);
        return question.length > 0 && hasAnswer;
      })
    ) {
      return true;
    }
  } catch {
    /* ignore and continue */
  }

  return false;
};

const sanitizeAnchor = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed.slice(1).trim() : trimmed;
};

function buildTocItems(context: GuideSeoTemplateContext) {
  if (!context.hasLocalizedContent) return null;
  if (!Array.isArray(context.sections) || context.sections.length === 0) return null;
  try {
    const raw = getGuideResource<unknown[]>(context.lang, `content.${GUIDE_KEY}.sections`);
    const rawSections = toSectionResources(raw);
    const normalizedSections =
      Array.isArray(context.sections) && context.sections.length > 0
        ? context.sections.map<SectionResource>(({ id, title, body }) => ({ id, title, body }))
        : [];
    const source = normalizedSections.length > 0 ? normalizedSections : rawSections;
    if (source.length === 0) return null;

    const fallbackBaseKey = "labels.tocSectionFallback";
    const fallbackBase = (() => {
      const localized = (() => {
        try {
          return context.translator?.(`content.${GUIDE_KEY}.toc.section`);
        } catch {
          return undefined;
        }
      })();

      if (
        typeof localized === "string" &&
        localized.trim().length > 0 &&
        localized !== `content.${GUIDE_KEY}.toc.section` &&
        localized.trim() !== String(GUIDE_KEY) &&
        !localized.trim().startsWith("content.")
      ) {
        return localized.trim();
      }

      const translatedLabel = resolveGuideLabel(context, fallbackBaseKey);
      if (translatedLabel) return translatedLabel;

      if (typeof context.translateGuides === "function") {
        try {
          const translated = context.translateGuides(fallbackBaseKey, {
            defaultValue: fallbackBaseKey,
          }) as unknown;
          if (typeof translated === "string") {
            const trimmed = translated.trim();
            if (trimmed.length > 0 && !trimmed.startsWith("labels.")) {
              return trimmed;
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (typeof context.translateGuidesEn === "function") {
        try {
          const translated = context.translateGuidesEn(fallbackBaseKey, {
            defaultValue: fallbackBaseKey,
          }) as unknown;
          if (typeof translated === "string") {
            const trimmed = translated.trim();
            if (trimmed.length > 0 && !trimmed.startsWith("labels.")) {
              return trimmed;
            }
          }
        } catch {
          /* ignore */
        }
      }

      const englishFallback = getGuideResource<string>("en", fallbackBaseKey, { includeFallback: false });
      if (typeof englishFallback === "string" && englishFallback.trim().length > 0) {
        return englishFallback.trim();
      }

      return "Section";
    })();

    const items = source
      .map((section, index) => {
        const numericIndex = index + 1;
        const rawId = sanitizeAnchor(rawSections[index]?.id);
        const contextIdRaw = sanitizeAnchor(section?.id);
        const contextId = (() => {
          if (!contextIdRaw) return "";
          const fallbackMatch = /^section-(\d+)$/u.exec(contextIdRaw);
          if (!fallbackMatch) return contextIdRaw;
          const fallbackIndex = Number.parseInt(fallbackMatch[1] ?? "", 10);
          if (Number.isNaN(fallbackIndex)) return contextIdRaw;
          return fallbackIndex === index ? "" : contextIdRaw;
        })();
        const normalizedIdBase = rawId || contextId || `section-${numericIndex}`;
        const normalizedId = normalizedIdBase.startsWith("#")
          ? normalizedIdBase.slice(1)
          : normalizedIdBase;
        const href = `#${normalizedId}`;
        const titleRaw = typeof section?.title === "string" ? section.title.trim() : "";
        const label = titleRaw.length > 0 ? titleRaw : `${fallbackBase} ${numericIndex}`;
        return { href, label };
      })
      .filter(Boolean);

    const faqs = Array.isArray(context.faqs) ? context.faqs : [];
    const hasFaqAnchor = items.some((item) => item.href === "#faqs");
    if (faqs.length > 0 && !hasFaqAnchor) {
      const label = (context.translateGuides(`content.${GUIDE_KEY}.toc.faqs`) as string) ?? "FAQs";
      items.push({ href: "#faqs", label });
    }

    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

function buildArticleExtras(context: GuideSeoTemplateContext) {
  const hasLocalizedStructured = hasLocalizedStructuredContent(context);
  const usesEnglishFallback = isGuideContentFallback(context.lang, GUIDE_KEY);
  if (!hasLocalizedStructured || usesEnglishFallback) {
    return <GenericContent guideKey={GUIDE_KEY} t={context.translateGuides} showToc={false} />;
  }

  const introFromContext = Array.isArray(context.intro) ? context.intro : [];
  const sectionsFromContext = Array.isArray(context.sections)
    ? context.sections.map<SectionResource>(({ id, title, body }) => ({ id, title, body }))
    : [];
  const faqsFromContext = Array.isArray(context.faqs) ? context.faqs : [];

  const rawIntro = (() => {
    try {
      const raw = getGuideResource<unknown>(context.lang, `content.${GUIDE_KEY}.intro`, {
        includeFallback: false,
      });
      return ensureStringArray(raw);
    } catch {
      return [] as string[];
    }
  })();

  const rawSections = (() => {
    try {
      const raw = getGuideResource<unknown[]>(context.lang, `content.${GUIDE_KEY}.sections`, {
        includeFallback: false,
      });
      return toSectionResources(raw);
    } catch {
      return [];
    }
  })();

  const rawFaqs = (() => {
    try {
      const raw = getGuideResource<unknown[]>(context.lang, `content.${GUIDE_KEY}.faqs`, {
        includeFallback: false,
      });
      return toFaqResources(raw);
    } catch {
      return [] as FaqResource[];
    }
  })();

  const introForDisplay = introFromContext.length > 0 ? introFromContext : rawIntro;
  const sectionsForDisplay = sectionsFromContext.length > 0 ? sectionsFromContext : rawSections;
  const faqsForDisplay = faqsFromContext.length > 0 ? faqsFromContext : rawFaqs;

  const hasNarrativeStructure = introForDisplay.length > 0 || sectionsForDisplay.length > 0;
  if (!hasNarrativeStructure) {
    return <GenericContent guideKey={GUIDE_KEY} t={context.translateGuides} showToc={false} />;
  }

  return (
    <>
      {introForDisplay.length > 0 ? (
        <div className="space-y-4">
          {introForDisplay.map((paragraph, index) => (
            <p key={`intro-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {sectionsForDisplay.length > 0
        ? sectionsForDisplay
            .map((section, index) => {
              const title = typeof section?.title === "string" ? section.title.trim() : "";
              const body = ensureStringArray(section?.body);
              if (!title && body.length === 0) return null;
              const rawId = (() => {
                const candidate = rawSections[index]?.id;
                if (typeof candidate === "string") return candidate.trim();
                return "";
              })();
              const id = rawId.length > 0 ? rawId : `section-${index + 1}`;
              return (
                <section key={id} id={id} className="space-y-4">
                  <h2>{title}</h2>
                  {body.map((paragraph, idx) => (
                    <p key={`section-${id}-${idx}`}>{paragraph}</p>
                  ))}
                </section>
              );
            })
            .filter(Boolean)
        : null}
      {faqsForDisplay.length > 0 ? (
        <section id="faqs" className="space-y-3">
          <h2>{context.translateGuides(`content.${GUIDE_KEY}.toc.faqs`) as string}</h2>
          {faqsForDisplay
            .map((faq, index) => {
              const q = typeof faq?.q === "string" ? faq.q.trim() : "";
              const a = ensureStringArray(faq?.a);
              if (!q) return null;
              return (
                <details key={`faq-${index}`}>
                  <summary>{q}</summary>
                  {a.map((ans, idx) => (
                    <p key={`faq-${index}-${idx}`}>{ans}</p>
                  ))}
                </details>
              );
            })
            .filter(Boolean)}
        </section>
      ) : null}
    </>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-facing safeguard surfaced during misconfiguration
  throw new Error("guide manifest entry missing for safetyAmalfi");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    showTocWhenUnlocalized: false,
    buildTocItems,
    articleExtras: buildArticleExtras,
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
    await i18n.changeLanguage(lang);
    await ensureGuideContent(lang, "safetyAmalfi", {
      en: async () => {
        try {
          return await import("../../locales/en/guides/content/safetyAmalfi.json");
        } catch {
          try {
            return await import("../../locales/en/guides/content/stayingSafePositano.json");
          } catch {
            return {} as unknown;
          }
        }
      },
      local:
        lang === "en"
          ? undefined
          : async () => {
              try {
                return await import(`../../locales/${lang}/guides/content/safetyAmalfi.json`);
              } catch {
                try {
                  return await import(`../../locales/${lang}/guides/content/stayingSafePositano.json`);
                } catch {
                  return {} as unknown;
                }
              }
            },
    });
    return { lang };
  },
  meta: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });

    const pick = (val: unknown, key: string): string | undefined => {
      if (typeof val !== "string") return undefined;
      const v = val.trim();
      if (!v || v === key) return undefined;
      return v;
    };

    const t = i18n.getFixedT?.(lang, "guides");
    const tEn = i18n.getFixedT?.("en", "guides");
    const metaTitleKey = `meta.${entry.metaKey ?? entry.key}.title`;
    const metaDescKey = `meta.${entry.metaKey ?? entry.key}.description`;
    const seoTitleKey = `content.${entry.contentKey}.seo.title`;
    const seoDescKey = `content.${entry.contentKey}.seo.description`;

    const title =
      pick(t?.(metaTitleKey), metaTitleKey) ||
      pick(t?.(seoTitleKey), seoTitleKey) ||
      pick(tEn?.(seoTitleKey), seoTitleKey) ||
      entry.key;
    const description =
      pick(t?.(metaDescKey), metaDescKey) ||
      pick(t?.(seoDescKey), seoDescKey) ||
      pick(tEn?.(seoDescKey), seoDescKey) ||
      "";

    return buildRouteMeta({
      lang,
      title,
      description,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
    });
  },
  links: (args: Parameters<LinksFunction>[0], entry) => {
    const params = args?.params;
    const data = args?.data;
    const lang = toAppLanguage(
      (data as { lang?: string } | undefined)?.lang ??
        (typeof params?.["lang"] === "string" ? params["lang"] : undefined),
    );
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, entry.key)}`;
    const descriptors = buildSeoLinks({
      lang,
      origin: BASE_URL,
      path,
    });

    const canonicalHref = `${BASE_URL}${path === "/" ? "" : path}`;
    const canonicalDescriptor =
      descriptors.find((descriptor) => descriptor.rel === "canonical") ??
      { rel: "canonical", href: canonicalHref };

    const alternates = descriptors.filter((descriptor) => descriptor.rel === "alternate");
    const hasXDefault = alternates.some((descriptor) => descriptor.hrefLang === "x-default");
    const normalizedAlternates = hasXDefault
      ? alternates
      : [...alternates, { rel: "alternate", href: canonicalHref, hrefLang: "x-default" }];

    return [canonicalDescriptor, ...normalizedAlternates];
  },
});

export default Component;
export { clientLoader, meta, links };
