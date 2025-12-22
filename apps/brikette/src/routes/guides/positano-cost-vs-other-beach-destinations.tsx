// src/routes/guides/positano-cost-vs-other-beach-destinations.tsx
import { memo } from "react";
import TableOfContents from "@/components/guides/TableOfContents";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { LoaderFunctionArgs } from "react-router-dom";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import type { LinksFunction, MetaFunction } from "react-router";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { useGuideTranslations } from "./guide-seo/translations";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";

export const handle = { tags: ["comparison", "cost", "positano"] };

export const GUIDE_KEY = "positanoCostComparison" as const satisfies GuideKey;
export const GUIDE_SLUG = "positano-cost-vs-other-beach-destinations" as const;

function PositanoCostComparison(): JSX.Element {
  const { guidesEn } = useGuideTranslations(useCurrentLanguage());
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      relatedGuides={{ items: [{ key: "positanoCostBreakdown" }, { key: "positanoBudget" }, { key: "cheapEats" }] }}
      preferManualWhenUnlocalized
      suppressUnlocalizedFallback
      showTocWhenUnlocalized
      articleLead={(ctx) => {
        const hasStructuredLocalizedContent = (() => {
          try {
            const hasIntro = Array.isArray(ctx.intro)
              ? ctx.intro.some((paragraph) => typeof paragraph === 'string' && paragraph.trim().length > 0)
              : false;
            const hasSections = Array.isArray(ctx.sections)
              ? ctx.sections.some((section) => {
                  if (!section || typeof section !== 'object') return false;
                  const title = typeof section.title === 'string' ? section.title.trim() : '';
                  const bodyHasContent = Array.isArray(section.body)
                    ? section.body.some((entry) => typeof entry === 'string' && entry.trim().length > 0)
                    : false;
                  return title.length > 0 || bodyHasContent;
                })
              : false;
            const hasFaqs = Array.isArray(ctx.faqs)
              ? ctx.faqs.some((faq) => {
                  if (!faq || typeof faq !== 'object') return false;
                  const question = typeof faq.q === 'string' ? faq.q.trim() : '';
                  const hasAnswer = Array.isArray(faq.a)
                    ? faq.a.some((answer) => typeof answer === 'string' && answer.trim().length > 0)
                    : false;
                  return question.length > 0 && hasAnswer;
                })
              : false;
            return hasIntro || hasSections || hasFaqs;
          } catch {
            return false;
          }
        })();
        // Only render manual fallback when localized structured arrays are missing
        if (ctx.hasLocalizedContent && hasStructuredLocalizedContent) return null;
        type TocItem = { href?: string; label?: string };
        type SectionEntry = { id?: string; title?: string; heading?: string; body?: unknown; items?: unknown };
        type SectionsMap = Record<string, { heading?: string; title?: string; body?: unknown; items?: unknown }>;
        type FallbackGuide = {
          toc?: TocItem[];
          sections?: SectionEntry[] | SectionsMap;
          faq?: { summary?: string; answer?: string } | unknown;
          faqLabel?: string;
        };
        const isRawKey = (value: string, key: string): boolean => {
          const trimmed = value.trim();
          if (!trimmed) return false;
          if (trimmed === key) return true;
          if (key.startsWith("content.")) {
            const alt = key.replace(/^content\./, "");
            if (trimmed === alt) return true;
          }
          return false;
        };
        const collectBody = (candidate: unknown, key: string): string[] => {
          if (typeof candidate === 'string') {
            const trimmed = candidate.trim();
            return trimmed && !isRawKey(trimmed, key) ? [trimmed] : [];
          }
          if (Array.isArray(candidate)) {
            return (candidate as unknown[])
              .map((val) => (typeof val === 'string' ? val.trim() : ''))
              .filter((val) => Boolean(val) && !isRawKey(val, key));
          }
          return [];
        };
        try {
          const fb = ctx.translateGuides(`content.${GUIDE_KEY}.fallback`, { returnObjects: true }) as unknown as Partial<FallbackGuide> | undefined;
          // 1) Prefer explicit fallback toc entries when provided
          const tocRaw = Array.isArray(fb?.toc) ? (fb.toc as TocItem[]) : [];
          const normalisedFromToc = tocRaw
            .map((it) => {
              const label = typeof it?.label === 'string' ? it.label.trim() : '';
              const hrefRaw = typeof it?.href === 'string' ? it.href.trim() : '';
              const href = hrefRaw ? (hrefRaw.startsWith('#') ? hrefRaw : `#${hrefRaw}`) : '';
              return label && href ? { href, label } : null;
            })
            .filter((x): x is { href: string; label: string } => x != null);
          // Build up ToC items; we'll render them explicitly below
          let tocItemsFinal: Array<{ href: string; label: string }> = [];
          if (normalisedFromToc.length > 0) {
            tocItemsFinal = normalisedFromToc.slice();
          }

          // 2) Derive from sections object when toc is missing/empty
          const items: Array<{ href: string; label: string }> = [];
          const push = (id: string, label: string | undefined) => {
            // Prefer an explicitly provided label when meaningful
            let text = typeof label === 'string' ? label.trim() : '';
            const key = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
            const isPlaceholder = (s: string): boolean => {
              if (typeof s !== 'string') return false;
              const t = s.trim();
              if (!t) return false;
              const alt = key.replace(/^content\./, '');
              return t === key || t === alt;
            };
            const pick = (val: unknown): string | undefined => {
              if (typeof val !== 'string') return undefined;
              const s = val.trim();
              if (!s || isPlaceholder(s)) return undefined;
              return s;
            };
            if (!text && id) {
              try {
                // 1) Ask the guide translator with fallbacks (localized → localized fallback → EN)
                const viaTranslator = ctx.translateGuides(key) as unknown;
                try {
                  if (process.env["DEBUG_TOC"] === "1") {
                    console.log('[%s toc:%s]', GUIDE_KEY, 'lookup', { key, viaTranslator });
                  }
                } catch { /* noop */ }
                text = pick(viaTranslator) ?? '';
              } catch { /* noop */ }
              // 2) If still unresolved, ask the explicit EN translator
              if (!text) {
                try {
                  const viaEn = guidesEn(key) as unknown;
                  try {
                    if (process.env["DEBUG_TOC"] === "1") {
                      console.log('[%s toc:%s]', GUIDE_KEY, 'en', { key, viaEn });
                    }
                  } catch { /* noop */ }
                  text = pick(viaEn) ?? '';
                } catch { /* noop */ }
              }
            }
            if (id && (text || id)) items.push({ href: `#${id}`, label: text || id });
          };
          const sections = fb?.sections as SectionEntry[] | SectionsMap | undefined;
          if (Array.isArray(sections)) {
            sections.forEach((s: SectionEntry, idx: number) => {
              const id = typeof s?.id === 'string' && s.id.trim() ? s.id.trim() : `section-${idx + 1}`;
              const title = typeof s?.title === 'string' ? s.title : (typeof s?.heading === 'string' ? s.heading : undefined);
              push(id, title);
            });
          } else if (sections && typeof sections === 'object') {
            Object.keys(sections as SectionsMap).forEach((key) => {
              const entry = (sections as SectionsMap)[key];
              const label = typeof entry?.heading === 'string' ? entry.heading : (typeof entry?.title === 'string' ? entry.title : undefined);
              push(key, label);
            });
          } else {
            // 3) Sparse fallback object: fall back to translator keys for known ids
            ["overview", "when"].forEach((id) => {
              const k = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
              try {
                const raw = ctx.translateGuides(k) as unknown;
                const label = typeof raw === 'string' && raw.trim() !== k ? raw.trim() : '';
                push(id, label || undefined);
              } catch {
                push(id, undefined);
              }
            });
          }
          // If we didn't get explicit ToC, seed from derived items
          if (tocItemsFinal.length === 0 && items.length > 0) {
            tocItemsFinal = items.slice();
          }
          // Append FAQs nav entry when fallback FAQ exists or translator strings are present
          try {
            const faqLabel = (() => {
              const rawLocal = typeof fb?.faqLabel === 'string' ? fb.faqLabel.trim() : '';
              if (rawLocal) return rawLocal;
              const k = `content.${GUIDE_KEY}.fallback.faqLabel` as const;
              const isPlaceholder = (s: string): boolean => {
                const alt = k.replace(/^content\./, '');
                const t = s.trim();
                return t === k || t === alt;
              };
              const pick = (val: unknown): string | undefined => {
                if (typeof val !== 'string') return undefined;
                const s = val.trim();
                if (!s || isPlaceholder(s)) return undefined;
                return s;
              };
              const raw = ctx.translateGuides(k) as unknown;
              const viaGuides = pick(raw);
              if (viaGuides) return viaGuides;
              try {
                const en = guidesEn(k) as unknown;
                const viaEn = pick(en);
                if (viaEn) return viaEn;
              } catch { /* noop */ }
              try {
                const v = ctx.translateGuides('labels.faqsHeading') as unknown;
                return typeof v === 'string' && v.trim().length > 0 ? v.trim() : 'FAQs';
              } catch {
                return 'FAQs';
              }
            })();
            const hasFaq = (() => {
              const local = (fb && typeof fb === 'object') ? (fb.faq as { summary?: string; answer?: string } | undefined) : undefined;
              if (typeof local?.summary === 'string' && local.summary.trim()) return true;
              if (typeof local?.answer === 'string' && local.answer.trim()) return true;
              const sKey = `content.${GUIDE_KEY}.fallback.faq.summary` as const;
              const aKey = `content.${GUIDE_KEY}.fallback.faq.answer` as const;
              const sVal = ctx.translateGuides(sKey) as unknown;
              const aVal = ctx.translateGuides(aKey) as unknown;
              return (typeof sVal === 'string' && sVal.trim() !== sKey && sVal.trim().length > 0) ||
                     (typeof aVal === 'string' && aVal.trim() !== aKey && aVal.trim().length > 0);
            })();
            const already = tocItemsFinal.some((it) => it.href === '#faqs');
            // Only auto‑append FAQs when no explicit ToC was provided
            const hasExplicitToc = normalisedFromToc.length > 0;
            if (hasFaq && !already && !hasExplicitToc) {
              tocItemsFinal.push({ href: '#faqs', label: faqLabel });
            }
          } catch { /* noop */ }

          // Build minimal content blocks from fallback/translator
          const sectionsObj = (fb && typeof fb === 'object') ? fb.sections : undefined;
          let entries: Array<{ id: string; title: string; body: string[] }> = [];
          if (sectionsObj && typeof sectionsObj === 'object' && !Array.isArray(sectionsObj)) {
            entries = Object.keys(sectionsObj as Record<string, { heading?: string; title?: string; body?: unknown; items?: unknown }>).
              map((id) => {
                const entry = (sectionsObj as Record<string, { heading?: string; title?: string; body?: unknown; items?: unknown }>)[id];
                const headingRaw = typeof entry?.heading === 'string' ? entry.heading.trim() : '';
                const heading = (() => {
                  const k = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
                  const isPlaceholder = (s: string): boolean => {
                    const alt = k.replace(/^content\./, '');
                    const t = s.trim();
                    return t === k || t === alt;
                  };
                  if (headingRaw && !isPlaceholder(headingRaw)) return headingRaw;
                  try {
                    const viaGuides = ctx.translateGuides(k) as unknown;
                    if (typeof viaGuides === 'string' && viaGuides.trim() && !isPlaceholder(viaGuides)) return viaGuides.trim();
                  } catch { /* noop */ }
                  try {
                    const en = guidesEn(k) as unknown;
                    if (typeof en === 'string' && en.trim() && !isPlaceholder(en)) return (en as string).trim();
                  } catch { /* noop */ }
                  return headingRaw;
                })();
                let bodyArr = Array.isArray(entry?.body)
                  ? (entry.body as unknown[]).map((v) => (typeof v === 'string' ? v.trim() : '')).filter((s) => s)
                  : (typeof entry?.body === 'string' ? (entry.body.trim() ? [entry.body.trim()] : []) : []);
                if (bodyArr.length === 0) {
                  try {
                    const key = `content.${GUIDE_KEY}.fallback.sections.${id}.body` as const;
                    const fbBody = ctx.translateGuides(key, { returnObjects: true }) as unknown;
                    const viaLocal = collectBody(fbBody, key);
                    if (viaLocal.length > 0) {
                      bodyArr = viaLocal;
                    }
                  } catch { /* noop */ }
                }
                if (bodyArr.length === 0) {
                  try {
                    const key = `content.${GUIDE_KEY}.fallback.sections.${id}.body` as const;
                    const enBody = guidesEn(key, { returnObjects: true } as Record<string, unknown>) as unknown;
                    const viaEn = collectBody(enBody, key);
                    if (viaEn.length > 0) {
                      bodyArr = viaEn;
                    }
                  } catch { /* noop */ }
                }
                const title = heading || (() => {
                  const v = ctx.translateGuides(`content.${GUIDE_KEY}.fallback.sections.${id}.heading`) as unknown;
                  return typeof v === 'string' && v.trim() !== `content.${GUIDE_KEY}.fallback.sections.${id}.heading` ? v.trim() : id;
                })();
                return { id, title, body: bodyArr };
              }).filter((e) => e.body.length > 0 || e.title);
          } else {
            const derive = (id: string) => {
              const headingKey = `content.${GUIDE_KEY}.fallback.sections.${id}.heading` as const;
              const bodyKey = `content.${GUIDE_KEY}.fallback.sections.${id}.body` as const;
              const titleRaw = ctx.translateGuides(headingKey) as unknown;
              const bodyRaw = ctx.translateGuides(bodyKey, { returnObjects: true }) as unknown;
              const title = typeof titleRaw === 'string' && titleRaw.trim() !== headingKey ? titleRaw.trim() : id;
              let body = collectBody(bodyRaw, bodyKey);
              if (body.length === 0) {
                try {
                  const viaEn = guidesEn(bodyKey, { returnObjects: true } as Record<string, unknown>) as unknown;
                  const fallbackBody = collectBody(viaEn, bodyKey);
                  if (fallbackBody.length > 0) {
                    body = fallbackBody;
                  }
                } catch { /* noop */ }
              }
              return { id, title, body };
            };
            entries = [derive('overview'), derive('when')].filter((e) => e.body.length > 0 || e.title);
          }

          const faq = (fb && typeof fb === 'object') ? (fb.faq as { summary?: string; answer?: string } | undefined) : undefined;
          const faqSummary = (() => {
            const local = typeof faq?.summary === 'string' ? faq.summary.trim() : '';
            if (local) return local;
            const k = `content.${GUIDE_KEY}.fallback.faq.summary` as const;
            const isPlaceholder = (s: string): boolean => {
              const alt = k.replace(/^content\./, '');
              const t = s.trim();
              return t === k || t === alt;
            };
            const raw = ctx.translateGuides(k) as unknown;
            if (typeof raw === 'string' && raw.trim() && !isPlaceholder(raw)) return raw.trim();
            try {
              const en = guidesEn(k) as unknown;
              if (typeof en === 'string' && en.trim() && !isPlaceholder(en)) return (en as string).trim();
            } catch { /* noop */ }
            return '';
          })();
          const faqAnswer = (() => {
            const local = typeof faq?.answer === 'string' ? faq.answer.trim() : '';
            if (local) return local;
            const k = `content.${GUIDE_KEY}.fallback.faq.answer` as const;
            const isPlaceholder = (s: string): boolean => {
              const alt = k.replace(/^content\./, '');
              const t = s.trim();
              return t === k || t === alt;
            };
            const raw = ctx.translateGuides(k) as unknown;
            if (typeof raw === 'string' && raw.trim() && !isPlaceholder(raw)) return raw.trim();
            try {
              const en = guidesEn(k) as unknown;
              if (typeof en === 'string' && en.trim() && !isPlaceholder(en)) return (en as string).trim();
            } catch { /* noop */ }
            return '';
          })();
          const faqHeading = (() => {
            const rawLocal = typeof fb?.faqLabel === 'string' ? fb.faqLabel.trim() : '';
            if (rawLocal) return rawLocal;
            const k = `content.${GUIDE_KEY}.fallback.faqLabel` as const;
            const isPlaceholder = (s: string): boolean => {
              const alt = k.replace(/^content\./, '');
              const t = s.trim();
              return t === k || t === alt;
            };
            const pick = (val: unknown): string | undefined => {
              if (typeof val !== 'string') return undefined;
              const s = val.trim();
              if (!s || isPlaceholder(s)) return undefined;
              return s;
            };
            const raw = ctx.translateGuides(k) as unknown;
            const viaGuides = pick(raw);
            if (viaGuides) return viaGuides;
            try {
              const en = guidesEn(k) as unknown;
              const viaEn = pick(en);
              if (viaEn) return viaEn;
            } catch { /* noop */ }
            try {
              const v = ctx.translateGuides('labels.faqsHeading') as unknown;
              return typeof v === 'string' && v.trim().length > 0 ? v.trim() : 'FAQs';
            } catch {
              return 'FAQs';
            }
          })();

          // Render ToC + minimal fallback article content
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
              {(faqSummary || faqAnswer) ? (
                <section id="faqs" className="scroll-mt-28 space-y-4">
                  <h2 className="text-xl font-semibold">{faqHeading}</h2>
                  {faqSummary ? (
                    <details>
                      <summary role="button" className="font-medium">{faqSummary}</summary>
                      {faqAnswer ? <p>{faqAnswer}</p> : null}
                    </details>
                  ) : (faqAnswer ? <p>{faqAnswer}</p> : null)}
                </section>
              ) : null}
            </>
          );
        } catch {
          return null;
        }
      }}
      // No extras; route-level fallback is handled entirely via articleLead
    />
  );
}

export default memo(PositanoCostComparison);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "positanoCostComparison", {
    en: () => import("../../locales/en/guides/content/positanoCostComparison.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/positanoCostComparison.json`).catch(() => undefined),
  });
  return { lang } as const;
}


export const meta: MetaFunction<typeof clientLoader> = ({ data }) => {
  const lang = data?.lang ?? "en";
  const path = `/${lang}/${getSlug("experiences", lang as AppLanguage)}/${guideSlug(lang as AppLanguage, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  const title = `guides.meta.${GUIDE_KEY}.title`;
  const description = `guides.meta.${GUIDE_KEY}.description`;
  return buildRouteMeta({
    lang: lang as AppLanguage,
    title,
    description,
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
