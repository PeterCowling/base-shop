// src/routes/guides/positano-cost-vs-other-beach-destinations.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";
import type { GuideSeoTemplateContext, TocItem, Translator } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

export const handle = { tags: ["comparison", "cost", "positano"] };

export const GUIDE_KEY = "positanoCostComparison" as const satisfies GuideKey;
export const GUIDE_SLUG = "positano-cost-vs-other-beach-destinations" as const;

function renderCostComparisonArticleLead(ctx: GuideSeoTemplateContext, guidesEn: Translator): JSX.Element | null {
  if (ctx.hasLocalizedContent) return null;
  type TocEntry = { href: string; label: string };
  type SectionEntry = {
    id?: string;
    title?: string;
    heading?: string;
    body?: unknown;
    items?: unknown;
  };
  type SectionsMap = Record<string, { heading?: string; title?: string; body?: unknown; items?: unknown }>;
  type FaqEntry = { summary?: string; answer?: string };
  type FallbackGuide = {
    toc?: TocItem[];
    sections?: SectionEntry[] | SectionsMap;
    faq?: FaqEntry | unknown;
    faqLabel?: string;
  };
  try {
    const fb = ctx.translateGuides(`content.${GUIDE_KEY}.fallback`, { returnObjects: true }) as
      | Partial<FallbackGuide>
      | undefined;
    const tocRaw = Array.isArray(fb?.toc) ? (fb.toc as TocEntry[]) : [];
    const normalisedFromToc = tocRaw
      .map((it) => {
        const label = typeof it?.label === "string" ? it.label.trim() : "";
        const hrefRaw = typeof it?.href === "string" ? it.href.trim() : "";
        const href = hrefRaw ? (hrefRaw.startsWith("#") ? hrefRaw : `#${hrefRaw}`) : "";
        return label && href ? { href, label } : null;
      })
      .filter((x): x is TocEntry => x != null);

    let tocItemsFinal: TocEntry[] = [];
    if (normalisedFromToc.length > 0) {
      tocItemsFinal = normalisedFromToc.slice();
    }

    const derivedItems: TocEntry[] = [];
    const push = (id: string, label: string | undefined) => {
      let text = typeof label === "string" ? label.trim() : "";
      const key = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
      const isPlaceholder = (s: string): boolean => {
        const alt = key.replace(/^content\./, "");
        const t = s.trim();
        return t === key || t === alt;
      };
      const pick = (val: unknown): string | undefined => {
        if (typeof val !== "string") return undefined;
        const s = val.trim();
        if (!s || isPlaceholder(s)) return undefined;
        return s;
      };
      if (!text && id) {
        try {
          const viaTranslator = ctx.translateGuides(key) as unknown;
          text = pick(viaTranslator) ?? "";
        } catch {
          /* noop */
        }
        if (!text) {
          try {
            const en = guidesEn(key) as unknown;
            text = pick(en) ?? "";
          } catch {
            /* noop */
          }
        }
        if (!text) {
          text = id;
        }
      }
      if (text && id) {
        derivedItems.push({ href: `#${id}`, label: text });
      }
    };

    const sectionsObj = (fb && typeof fb === "object") ? fb.sections : undefined;
    let entries: Array<{ id: string; title: string; body: string[] }> = [];
    if (sectionsObj && typeof sectionsObj === "object" && !Array.isArray(sectionsObj)) {
      entries = Object.keys(sectionsObj as SectionsMap)
        .map((id) => {
          const entry = (sectionsObj as SectionsMap)[id];
          const headingRaw = typeof entry?.heading === "string" ? entry.heading.trim() : "";
          const heading = (() => {
            const k = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
            const isPlaceholder = (s: string): boolean => {
              const alt = k.replace(/^content\./, "");
              const t = s.trim();
              return t === k || t === alt;
            };
            const pick = (val: unknown): string | undefined => {
              if (typeof val !== "string") return undefined;
              const s = val.trim();
              if (!s || isPlaceholder(s)) return undefined;
              return s;
            };
            if (headingRaw && !isPlaceholder(headingRaw)) return headingRaw;
            try {
              const viaGuides = ctx.translateGuides(k) as unknown;
              const picked = pick(viaGuides);
              if (picked) return picked;
            } catch {
              /* noop */
            }
            try {
              const enVal = guidesEn(k) as unknown;
              const picked = pick(enVal);
              if (picked) return picked;
            } catch {
              /* noop */
            }
            return headingRaw;
          })();
          let bodyArr = Array.isArray(entry?.body)
            ? (entry.body as unknown[]).map((v) => (typeof v === "string" ? v.trim() : "")).filter((s) => s)
            : typeof entry?.body === "string"
              ? entry.body.trim()
                ? [entry.body.trim()]
                : []
              : [];
          if (bodyArr.length === 0) {
            try {
              const fbBody = ctx.translateGuides(`content.${GUIDE_KEY}.fallback.sections.${id}.body`, {
                returnObjects: true,
              }) as unknown;
              if (typeof fbBody === "string") {
                const v = fbBody.trim();
                if (v.length > 0 && v !== `content.${GUIDE_KEY}.fallback.sections.${id}.body`) bodyArr = [v];
              } else if (Array.isArray(fbBody)) {
                const arr = (fbBody as unknown[])
                  .map((v) => (typeof v === "string" ? v.trim() : ""))
                  .filter((s) => s);
                if (arr.length > 0) bodyArr = arr;
              }
            } catch {
              /* noop */
            }
          }
          const title = heading || (() => {
            const v = ctx.translateGuides(`content.${GUIDE_KEY}.fallback.sections.${id}.heading`) as unknown;
            return typeof v === "string" && v.trim() !== `content.${GUIDE_KEY}.fallback.sections.${id}.heading`
              ? v.trim()
              : id;
          })();
          push(id, title);
          return { id, title, body: bodyArr };
        })
        .filter((e) => e.body.length > 0 || e.title);
    } else {
      const derive = (id: string) => {
        const headingKey = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
        const bodyKey = `content.${GUIDE_KEY}.fallback.sections.${id}.body` as const;
        const titleRaw = ctx.translateGuides(headingKey) as unknown;
        const bodyRaw = ctx.translateGuides(bodyKey, { returnObjects: true }) as unknown;
        const title =
          typeof titleRaw === "string" && titleRaw.trim() !== headingKey ? titleRaw.trim() : id;
        const body = Array.isArray(bodyRaw)
          ? (bodyRaw as unknown[]).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
          : typeof bodyRaw === "string"
            ? bodyRaw.trim()
              ? [bodyRaw.trim()]
              : []
            : [];
        push(id, title);
        return { id, title, body };
      };
      entries = [derive("overview"), derive("when")].filter((e) => e.body.length > 0 || e.title);
    }

    const faq = (fb && typeof fb === "object") ? (fb.faq as FaqEntry | undefined) : undefined;
    const faqSummary = (() => {
      const local = typeof faq?.summary === "string" ? faq.summary.trim() : "";
      if (local) return local;
      const k = `content.${GUIDE_KEY}.fallback.faq.summary` as const;
      const isPlaceholder = (s: string): boolean => {
        const alt = k.replace(/^content\./, "");
        const t = s.trim();
        return t === k || t === alt;
      };
      const raw = ctx.translateGuides(k) as unknown;
      if (typeof raw === "string" && raw.trim() && !isPlaceholder(raw)) return raw.trim();
      try {
        const enVal = guidesEn(k) as unknown;
        if (typeof enVal === "string" && enVal.trim() && !isPlaceholder(enVal)) return (enVal as string).trim();
      } catch {
        /* noop */
      }
      return "";
    })();
    const faqAnswer = (() => {
      const local = typeof faq?.answer === "string" ? faq.answer.trim() : "";
      if (local) return local;
      const k = `content.${GUIDE_KEY}.fallback.faq.answer` as const;
      const isPlaceholder = (s: string): boolean => {
        const alt = k.replace(/^content\./, "");
        const t = s.trim();
        return t === k || t === alt;
      };
      const raw = ctx.translateGuides(k) as unknown;
      if (typeof raw === "string" && raw.trim() && !isPlaceholder(raw)) return raw.trim();
      try {
        const enVal = guidesEn(k) as unknown;
        if (typeof enVal === "string" && enVal.trim() && !isPlaceholder(enVal)) return (enVal as string).trim();
      } catch {
        /* noop */
      }
      return "";
    })();
    const faqHeading = (() => {
      const rawLocal = typeof fb?.faqLabel === "string" ? fb.faqLabel.trim() : "";
      if (rawLocal) return rawLocal;
      const k = `content.${GUIDE_KEY}.fallback.faqLabel` as const;
      const isPlaceholder = (s: string): boolean => {
        const alt = k.replace(/^content\./, "");
        const t = s.trim();
        return t === k || t === alt;
      };
      const pick = (val: unknown): string | undefined => {
        if (typeof val !== "string") return undefined;
        const s = val.trim();
        if (!s || isPlaceholder(s)) return undefined;
        return s;
      };
      const raw = ctx.translateGuides(k) as unknown;
      const viaGuides = pick(raw);
      if (viaGuides) return viaGuides;
      try {
        const enVal = guidesEn(k) as unknown;
        const viaEn = pick(enVal);
        if (viaEn) return viaEn;
      } catch {
        /* noop */
      }
      try {
        const v = ctx.translateGuides("labels.faqsHeading") as unknown;
        return typeof v === "string" && v.trim().length > 0 ? v.trim() : "FAQs";
      } catch {
        return "FAQs";
      }
    })();

    if (tocItemsFinal.length === 0 && derivedItems.length > 0) {
      tocItemsFinal = derivedItems.slice();
    }

    try {
      const faqLabel = (() => {
        const rawLocal = typeof fb?.faqLabel === "string" ? fb.faqLabel.trim() : "";
        if (rawLocal) return rawLocal;
        const k = `content.${GUIDE_KEY}.fallback.faqLabel` as const;
        const isPlaceholder = (s: string): boolean => {
          const alt = k.replace(/^content\./, "");
          const t = s.trim();
          return t === k || t === alt;
        };
        const pick = (val: unknown): string | undefined => {
          if (typeof val !== "string") return undefined;
          const s = val.trim();
          if (!s || isPlaceholder(s)) return undefined;
          return s;
        };
        const raw = ctx.translateGuides(k) as unknown;
        const viaGuides = pick(raw);
        if (viaGuides) return viaGuides;
        try {
          const enVal = guidesEn(k) as unknown;
          const viaEn = pick(enVal);
          if (viaEn) return viaEn;
        } catch {
          /* noop */
        }
        try {
          const v = ctx.translateGuides("labels.faqsHeading") as unknown;
          return typeof v === "string" && v.trim().length > 0 ? v.trim() : "FAQs";
        } catch {
          return "FAQs";
        }
      })();
      const hasFaq = (() => {
        const local = faq ?? {};
        if (typeof local === "object" && local) {
          const summary = typeof (local as FaqEntry).summary === "string" ? (local as FaqEntry).summary.trim() : "";
          const answer = typeof (local as FaqEntry).answer === "string" ? (local as FaqEntry).answer.trim() : "";
          if (summary) return true;
          if (answer) return true;
        }
        const sKey = `content.${GUIDE_KEY}.fallback.faq.summary` as const;
        const aKey = `content.${GUIDE_KEY}.fallback.faq.answer` as const;
        const sVal = ctx.translateGuides(sKey) as unknown;
        const aVal = ctx.translateGuides(aKey) as unknown;
        const isPlaceholder = (token: string | undefined, key: string) => {
          if (!token) return false;
          const trimmed = token.trim();
          const alt = key.replace(/^content\./, "");
          return trimmed === key || trimmed === alt;
        };
        return (
          (typeof sVal === "string" && sVal.trim() && !isPlaceholder(sVal, sKey)) ||
          (typeof aVal === "string" && aVal.trim() && !isPlaceholder(aVal, aKey))
        );
      })();
      const already = tocItemsFinal.some((it) => it.href === "#faqs");
      const hasExplicitToc = normalisedFromToc.length > 0;
      if (hasFaq && !already && !hasExplicitToc) {
        tocItemsFinal.push({ href: "#faqs", label: faqLabel });
      }
    } catch {
      /* noop */
    }

    return (
      <>
        <TableOfContents items={tocItemsFinal} />
        {entries.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
            {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
            {s.body.map((b: string, i: number) => (
              <p key={i}>{b}</p>
            ))}
          </section>
        ))}
        {faqSummary || faqAnswer ? (
          <section id="faqs" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-semibold">{faqHeading}</h2>
            {faqSummary ? (
              <details>
                <summary role="button" className="font-medium">
                  {faqSummary}
                </summary>
                {faqAnswer ? <p>{faqAnswer}</p> : null}
              </details>
            ) : faqAnswer ? (
              <p>{faqAnswer}</p>
            ) : null}
          </section>
        ) : null}
      </>
    );
  } catch {
    return null;
  }
}

function CostComparisonArticleLead({ context }: { context: GuideSeoTemplateContext }): JSX.Element | null {
  const { guidesEn } = useGuideTranslations(context.lang);
  return renderCostComparisonArticleLead(context, guidesEn);
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer error message
  throw new Error("guide manifest entry missing for positanoCostComparison");
}

const costComparisonStructuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: () => ({ hasStructured: true }),
  render: (context) => <CostComparisonArticleLead context={context} />,
  selectTocItems: () => [],
  isStructured: () => true,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    articleLead: costComparisonStructuredLead.articleLead,
    relatedGuides: {
      items: [
        { key: "positanoCostBreakdown" },
        { key: "positanoBudget" },
        { key: "cheapEats" },
      ],
    },
  }),
  structuredArticle: costComparisonStructuredLead.structuredArticle,
  meta: ({ data }, entry) => {
    const lang = (data?.lang as AppLanguage | undefined) ?? "en";
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.key}.title`,
      description: `guides.meta.${entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: ({ data }, entry) => {
    const lang = (data?.lang as AppLanguage | undefined) ?? "en";
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, entry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };