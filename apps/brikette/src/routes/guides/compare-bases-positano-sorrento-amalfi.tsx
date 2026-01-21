// src/routes/guides/compare-bases-positano-sorrento-amalfi.tsx
import { memo } from "react";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";

import TableOfContents from "@/components/guides/TableOfContents";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest, toAppLanguage } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import GuideSeoTemplate from "./_GuideSeoTemplate";

export const GUIDE_KEY: GuideKey = "compareBasesPositanoSorrentoAmalfi";
export const GUIDE_SLUG = "compare-bases-positano-sorrento-amalfi" as const;

export const handle = { tags: ["comparison", "positano", "sorrento", "amalfi", "transport", "budgeting"] };

function CompareBasesPSA(): JSX.Element {
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      relatedGuides={{ items: [{ key: "positanoTravelGuide" }, { key: "transportBudget" }, { key: "dayTripsAmalfi" }] }}
      // Prefer curated fallback content when the active locale lacks
      // structured arrays, and avoid rendering a second ToC from
      // GenericContent to prevent duplicate "On this page" navs.
      preferManualWhenUnlocalized
      // The articleLead below renders curated fallback intro/sections/ToC for
      // unlocalized locales. Suppress the template-level unlocalized fallback
      // renderer to prevent duplicate ToC/sections.
      suppressUnlocalizedFallback
      genericContentOptions={{ showToc: false }}
      // Disable the template-level structured ToC for this route; tests rely
      // on the curated fallback ToC derived from guidesFallback.
      buildTocItems={() => []}
      // Route-scoped article lead that renders curated guidesFallback content
      // when the active locale lacks structured arrays.
      articleLead={({ lang, hasLocalizedContent }) => {
        if (hasLocalizedContent) return null;
        const t = i18n.getFixedT(lang, "guidesFallback");
        const tx: (segment: string, options?: { returnObjects?: boolean }) => unknown = (
          segment,
          options,
        ) => t(`${GUIDE_KEY}.${segment}`, options);
        const fb = buildFallbackContent(tx);
        const tocItems = fb.toc.length > 0
          ? fb.toc
          : fb.sections.map((s) => ({ href: `#${s.id}`, label: s.title || s.id }));
        return (
          <>
            {fb.intro.length > 0 ? (
              <div className="space-y-4">
                {fb.intro.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            ) : null}
            {tocItems.length > 0 ? (
              <TableOfContents items={tocItems} title={i18n.t("guides:labels.onThisPage", { defaultValue: "On this page" }) as string} />
            ) : null}
            {fb.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
                {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
                {s.body.map((b, i) => (
                  <p key={i}>{b}</p>
                ))}
              </section>
            ))}
            {fb.faqs.length > 0 ? (
              <section id="faqs" className="scroll-mt-28 space-y-4">
                {fb.faqsTitle ? <h2 className="text-xl font-semibold">{fb.faqsTitle}</h2> : null}
                <div className="space-y-3">
                  {fb.faqs.map((f, i) => (
                    <details key={i}>
                      <summary className="font-medium">{f.q}</summary>
                      {f.a.map((ans, j) => (
                        <p key={j}>{ans}</p>
                      ))}
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        );
      }}
    />
  );
}

export default memo(CompareBasesPSA);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await preloadNamespacesWithFallback(lang, ["guidesFallback"], { optional: true, fallbackOptional: true });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "compareBasesPositanoSorrentoAmalfi", {
    en: () => import("../../locales/en/guides/content/compareBasesPositanoSorrentoAmalfi.json"),
    local:
      lang === "en"
        ? undefined
        : () =>
            import(`../../locales/${lang}/guides/content/compareBasesPositanoSorrentoAmalfi.json`).catch(() => undefined),
  });
  return { lang } as const;
}

// ---- Helper exports used by tests ----
export type FallbackContent = {
  intro: string[];
  toc: Array<{ href: string; label: string }>;
  sections: Array<{ id: string; title: string; body: string[] }>;
  faqs: Array<{ q: string; a: string[] }>;
  faqsTitle: string;
};

export function hasGuideStructuredContent(input: {
  intro?: unknown;
  sections?: unknown;
  faqs?: unknown;
  legacyFaqs?: unknown;
  tips?: unknown;
  warnings?: unknown;
}): boolean {
  const hasArrayWithContent = (v: unknown): boolean => Array.isArray(v) && v.some((x) => typeof x === "string" && x.trim().length > 0);

  if (hasArrayWithContent(input.intro)) return true;

  if (Array.isArray(input.sections)) {
    for (const s of input.sections) {
      const sObj = (typeof s === "object" && s !== null) ? (s as Record<string, unknown>) : undefined;
      const title = typeof sObj?.["title"] === "string" ? (sObj["title"] as string) : undefined;
      const body = (sObj?.["body"] as unknown) as unknown[] | undefined;
      const itemsCandidate = (sObj?.["items"] as unknown) ?? (sObj?.["list"] as unknown);
      const items = Array.isArray(itemsCandidate) ? itemsCandidate : undefined;
      const hasTitle = typeof title === "string" && title.trim().length > 0;
      const hasBody = Array.isArray(body) && body.some((t) => typeof t === "string" && t.trim().length > 0);
      const hasItems = Array.isArray(items) && items.some((t) => typeof t === "string" && t.trim().length > 0);
      if ((hasTitle && hasBody) || (hasTitle && hasItems)) return true;
    }
  }

  if (Array.isArray(input.faqs)) {
    for (const f of input.faqs) {
      const fObj = (typeof f === "object" && f !== null) ? (f as Record<string, unknown>) : undefined;
      const qCandidate = typeof fObj?.["q"] === "string" ? (fObj["q"] as string) : (typeof fObj?.["question"] === "string" ? (fObj["question"] as string) : undefined);
      const aCandidate = (fObj?.["a"] as unknown) ?? (fObj?.["answer"] as unknown);
      const q = qCandidate;
      const a = Array.isArray(aCandidate) ? aCandidate : undefined;
      const hasQ = typeof q === "string" && q.trim().length > 0;
      const hasA = Array.isArray(a) && a.some((t) => typeof t === "string" && t.trim().length > 0);
      if (hasQ && hasA) return true;
    }
  }

  return false;
}

export function buildFallbackContent(translate: (segment: string, options?: { returnObjects?: boolean }) => unknown): FallbackContent {
  const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? (v.filter((x) => typeof x === "string" && (x as string).trim().length > 0) as string[]) : []);
  const asObjectArray = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : []);

  const intro = asStringArray(translate("intro", { returnObjects: true }));

  const rawToc = asObjectArray(translate("toc", { returnObjects: true }));
  // Default anchors mirror the original index within the raw toc array so
  // consumers can derive stable section targets even when some entries are
  // filtered out (e.g., blank labels).
  const toc: Array<{ href: string; label: string }> = [];
  for (let i = 0; i < rawToc.length; i++) {
    const item = rawToc[i] ?? ({} as Record<string, unknown>);
    const labelRaw = item["label"] as string | undefined;
    const hrefRaw = item["href"] as string | undefined;
    const label = (labelRaw ?? "").trim();
    if (!label) continue;
    const href = (hrefRaw ?? "").trim() || `#s-${i}`;
    toc.push({ href, label });
  }

  const rawSections = asObjectArray(translate("sections", { returnObjects: true }));
  const sections: Array<{ id: string; title: string; body: string[] }> = [];
  let autoIndex = 0;
  for (const s of rawSections) {
    const idRaw = s["id"] as string | undefined;
    const titleRaw = s["title"] as string | undefined;
    const bodyRaw = asStringArray(s["body"]);
    const sObj = s as Record<string, unknown>;
    const itemsRaw = asStringArray(
      Array.isArray(sObj["items"]) ? (sObj["items"] as unknown[]) : Array.isArray(sObj["list"]) ? (sObj["list"] as unknown[]) : [],
    );
    const title = (titleRaw ?? "").trim();
    const body = bodyRaw.length > 0 ? bodyRaw : itemsRaw.length > 0 ? itemsRaw : [];
    if (!title || body.length === 0) continue;
    const id = (idRaw ?? "").trim() || `s-${autoIndex++}`;
    sections.push({ id, title, body });
  }

  const rawFaqs = asObjectArray(translate("faqs", { returnObjects: true }));
  const faqs: Array<{ q: string; a: string[] }> = [];
  for (const f of rawFaqs) {
    const qRaw = (f["q"] as string | undefined) ?? (f["question"] as string | undefined);
    const aRaw = (f["a"] as unknown[]) ?? (f["answer"] as unknown[]);
    const q = (qRaw ?? "").trim();
    const a = asStringArray(aRaw);
    if (!q || a.length === 0) continue;
    // Keep original answer strings (including padding) but filter by trimmed length above
    const answers = Array.isArray(aRaw)
      ? (aRaw.filter((x) => typeof x === "string" && (x as string).trim().length > 0) as string[])
      : a;
    faqs.push({ q, a: answers });
  }

  const faqsTitleRaw = translate("faqsTitle") as string | undefined;
  const faqsTitle = typeof faqsTitleRaw === "string" ? faqsTitleRaw.trim() : "";

  return { intro, toc, sections, faqs, faqsTitle };
}


// Head helpers ensure twitter:card and canonical + x-default
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lng = toAppLanguage((data as { lang?: string } | undefined)?.lang);
  const path = `/${lng}/${getSlug("experiences", lng)}/${guideSlug(lng, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({
    lang: lng,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
