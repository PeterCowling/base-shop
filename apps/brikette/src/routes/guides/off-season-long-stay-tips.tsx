// src/routes/guides/off-season-long-stay-tips.tsx
import { memo } from "react";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { LoaderFunctionArgs } from "react-router-dom";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { GuideKey } from "@/routes.guides-helpers";
import type { MetaFunction, LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import TableOfContents from "@/components/guides/TableOfContents";

export const handle = { tags: ["digital-nomads", "off-season", "positano"] };

export const GUIDE_KEY = "offSeasonLongStay" as const satisfies GuideKey;
export const GUIDE_SLUG = "off-season-long-stay-tips-positano" as const;

function OffSeasonLongStayTips(): JSX.Element {
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      // Prefer manual fallback rendering when the locale lacks structured content
      preferManualWhenUnlocalized
      // Suppress template-level unlocalized fallbacks; the route renders
      // its curated manual fallback via articleLead when structured arrays
      // are missing. This prevents duplicated intro/ToC/sections/FAQs.
      suppressUnlocalizedFallback
      // Allow GenericContent when localized structured content exists so
      // tests can assert the forwarded translator props. Manual fallback
      // rendering remains handled by articleLead when unlocalized.
      renderGenericContent
      // Suppress structured ToC derived from sections for this route; tests expect
      // no ToC unless an explicit fallback object provides one.
      buildTocItems={() => []}
      // Provide a route-scoped manual fallback renderer so tests can assert
      // exact text and ToC when localized structured arrays are missing.
      articleLead={(ctx) => {
        try {
          // If localized structured arrays exist, skip manual fallback.
          const introLocal = ctx.translator(`content.${GUIDE_KEY}.intro`, { returnObjects: true }) as unknown;
          const sectionsLocal = ctx.translator(`content.${GUIDE_KEY}.sections`, { returnObjects: true }) as unknown;
          if (Array.isArray(introLocal) && introLocal.length > 0) return null;
          if (Array.isArray(sectionsLocal) && sectionsLocal.length > 0) return null;

          const fbRaw = ctx.translator(`content.${GUIDE_KEY}.fallback`, { returnObjects: true }) as unknown;
          if (!fbRaw || typeof fbRaw !== 'object' || Array.isArray(fbRaw)) return null;
          const fb = fbRaw as Record<string, unknown>;
          const intro = Array.isArray(fb["intro"])
            ? (fb["intro"] as unknown[]).filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            : [];
          const tocArr = Array.isArray(fb["toc"])
            ? (fb["toc"] as unknown[]).map((it) => {
            const rec = (it && typeof it === 'object') ? (it as Record<string, unknown>) : {};
            const href = typeof rec["href"] === "string" ? rec["href"].trim() : "";
            const label = typeof rec["label"] === "string" ? rec["label"].trim() : "";
            return href && label ? { href, label } : null;
          }).filter((x): x is { href: string; label: string } => x != null) : [];
          const tocTitle = typeof (fb as Record<string, unknown>)["tocTitle"] === "string"
            ? ((fb as Record<string, unknown>)["tocTitle"] as string).trim() || undefined
            : undefined;
          const sections = Array.isArray(fb["sections"])
            ? (fb["sections"] as unknown[]).map((s, idx) => {
            const rec = (s && typeof s === 'object') ? (s as Record<string, unknown>) : {};
            const id = typeof rec["id"] === "string" && rec["id"].trim().length > 0 ? rec["id"].trim() : `s-${idx}`;
            const title = typeof rec["title"] === "string" ? rec["title"].trim() : "";
            const body = Array.isArray(rec["body"])
              ? (rec["body"] as unknown[]).filter((v): v is string => typeof v === "string" && v.trim().length > 0)
              : [];
            return title || body.length > 0 ? { id, title, body } : null;
          }).filter((x): x is { id: string; title: string; body: string[] } => x != null) : [];
          const faqsTitle =
            typeof fb["faqsTitle"] === "string" && fb["faqsTitle"].trim().length > 0
              ? (fb["faqsTitle"] as string).trim()
              : undefined;
          const faqsArr = Array.isArray(fb["faqs"])
            ? (fb["faqs"] as unknown[]).map((f) => {
            const rec = (f && typeof f === 'object') ? (f as Record<string, unknown>) : {};
            const q = typeof rec["q"] === "string" ? rec["q"].trim() : "";
            let a: string[] = [];
            if (Array.isArray(rec["a"])) {
              a = (rec["a"] as unknown[]).filter((v): v is string => typeof v === "string" && v.trim().length > 0);
            } else if (typeof rec["a"] === "string") {
              const s = rec["a"].trim();
              if (s) a = [s];
            }
            return q && a.length > 0 ? { q, a } : null;
          }).filter((x): x is { q: string; a: string[] } => x != null) : [];

          const hasAny = intro.length > 0 || tocArr.length > 0 || sections.length > 0 || faqsArr.length > 0;
          if (!hasAny) return null;

          return (
            <>
              {intro.length > 0 ? (
                <div className="space-y-4">
                  {intro.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              ) : null}
              {tocArr.length > 0 ? (
                <TableOfContents
                  items={tocArr}
                  {...(typeof tocTitle === "string" ? { title: tocTitle } : {})}
                />
              ) : null}
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
                  {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
                  {s.body.map((b, i) => (<p key={i}>{b}</p>))}
                </section>
              ))}
              {faqsArr.length > 0 ? (
                <section id="faqs" className="space-y-4">
                  <h2 className="text-xl font-semibold">{faqsTitle ?? 'FAQs'}</h2>
                  <div className="space-y-3">
                    {faqsArr.map((f, i) => (
                      <details key={i}>
                        <summary className="font-medium">{f.q}</summary>
                        {f.a.map((ans, j) => (<p key={j}>{ans}</p>))}
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          );
        } catch {
          return null;
        }
      }}
      relatedGuides={{ items: [{ key: "workCafes" }, { key: "positanoWinterBudget" }, { key: "positanoTravelGuide" }] }}
    />
  );
}

export default memo(OffSeasonLongStayTips);
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
  const imageSrc = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    image: { src: imageSrc, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
  });
};

export const links: LinksFunction = () => buildRouteLinks();


export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "offSeasonLongStay", {
    en: () => import("../../locales/en/guides/content/offSeasonLongStay.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/offSeasonLongStay.json`).catch(() => undefined),
  });
  return { lang } as const;
}

// Helpers used by unit tests
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const v = value.trim();
    return v ? [v] : [];
  }
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

type TocEntry = { href: string; label: string };
type Section = { id: string; title: string; body: string[] };
type Faq = { q: string; a: string[] };

export function normaliseToc(value: unknown): TocEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: TocEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const hrefRaw = item["href"];
    const labelRaw = item["label"];
    const href = typeof hrefRaw === "string" ? hrefRaw.trim() : "";
    const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
    if (!href || !label) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    result.push({ href, label });
  }
  return result;
}

export function normaliseSections(value: unknown): Section[] {
  if (!Array.isArray(value)) return [];
  const result: Section[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const idRaw = item["id"];
    const titleRaw = item["title"];
    const bodyRaw = item["body"];
    const id = typeof idRaw === "string" ? idRaw.trim() : "";
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    if (!id || !title) continue;
    let body: string[] = [];
    if (Array.isArray(bodyRaw)) {
      body = bodyRaw
        .map((v) => (typeof v === "string" ? v.trim() : null))
        .filter((v): v is string => !!v);
    } else if (typeof bodyRaw === "string") {
      const trimmed = bodyRaw.trim();
      if (trimmed) {
        body = [trimmed];
      }
    }
    result.push({ id, title, body });
  }
  return result;
}

export function normaliseFaqs(value: unknown): Faq[] {
  if (!Array.isArray(value)) return [];
  const result: Faq[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const qRaw = item["q"];
    const aRaw = item["a"];
    const q = typeof qRaw === "string" ? qRaw.trim() : "";
    let a: string[] = [];
    if (Array.isArray(aRaw)) {
      a = aRaw
        .map((v) => (typeof v === "string" ? v.trim() : null))
        .filter((v): v is string => !!v);
    } else if (typeof aRaw === "string") {
      const trimmed = aRaw.trim();
      if (trimmed) {
        a = [trimmed];
      }
    }
    if (!q || a.length === 0) continue;
    result.push({ q, a });
  }
  return result;
}

export function normaliseFallbackContent(value: unknown): {
  intro: string[];
  toc: TocEntry[];
  tocTitle: string | undefined;
  sections: Section[];
  faqsTitle: string | undefined;
  faqs: Faq[];
} {
  if (!isRecord(value)) {
    return { intro: [], toc: [], tocTitle: undefined, sections: [], faqsTitle: undefined, faqs: [] };
  }
  const intro = toStringArray(value["intro"]);
  const toc = normaliseToc(value["toc"]);
  const tocTitleRaw = value["tocTitle"];
  const tocTitle = typeof tocTitleRaw === "string" ? tocTitleRaw.trim() || undefined : undefined;
  const sections = normaliseSections(value["sections"]);
  const faqsTitleRaw = value["faqsTitle"];
  const faqsTitle = typeof faqsTitleRaw === "string" ? faqsTitleRaw.trim() || undefined : undefined;
  const faqs = normaliseFaqs(value["faqs"]);

  return { intro, toc, tocTitle, sections, faqsTitle, faqs };
}
