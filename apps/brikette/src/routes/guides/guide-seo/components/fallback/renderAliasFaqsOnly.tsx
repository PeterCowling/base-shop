import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { GuideSeoTemplateContext } from "../../types";

/**
 * Render alias FAQs-only section when no localized intro/sections exist.
 * Generalized from the former interrail-specific implementation.
 */
export function renderAliasFaqsOnly(params: {
  context: GuideSeoTemplateContext;
  hasStructuredLocal: boolean;
  translations: any;
  tFb: TFunction | undefined;
  guideKey: string;
  t: TFunction;
  alias: string;
}): JSX.Element | null {
  const { context, hasStructuredLocal, translations, tFb, guideKey, t, alias } = params;

  try {
    const lang = (typeof context?.lang === "string" ? context.lang : "en") as AppLanguage;

    const localizedStructuredExists = (() => {
      if (hasStructuredLocal) return true;
      try {
        const introArr = Array.isArray((context as any)?.intro) ? ((context as any).intro as unknown[]) : [];
        const hasIntro = introArr.some((p) => typeof p === "string" && p.trim().length > 0);
        if (hasIntro) return true;
      } catch { /* noop */ }
      try {
        const sectionsArr = Array.isArray((context as any)?.sections) ? ((context as any).sections as unknown[]) : [];
        const hasSections = sectionsArr.some((section: any) => {
          if (!section || typeof section !== "object") return false;
          const title = typeof section.title === "string" ? section.title.trim() : "";
          if (title.length > 0) return true;
          const body = Array.isArray(section.body)
            ? (section.body as unknown[])
            : Array.isArray(section.items)
            ? (section.items as unknown[])
            : [];
          return body.some((value) => typeof value === "string" && value.trim().length > 0);
        });
        if (hasSections) return true;
      } catch { /* noop */ }
      return false;
    })();

    if (localizedStructuredExists) return null;

    type AliasFaqEntry = { q?: string; a?: unknown; answer?: unknown };
    const mapFaqs = (entries: AliasFaqEntry[] | undefined) =>
      ensureArray<AliasFaqEntry>(entries)
        .map((entry) => ({
          q: typeof entry?.q === "string" ? entry.q.trim() : "",
          a: ensureStringArray((entry as any)?.a ?? (entry as any)?.answer),
        }))
        .filter((faq) => faq.q.length > 0 && faq.a.length > 0);

    let aliasFaqsSource = ensureArray<AliasFaqEntry>(
      (tFb as any)?.(`${alias}.faqs`, { returnObjects: true } as any),
    );
    if (aliasFaqsSource.length === 0) {
      aliasFaqsSource = ensureArray<AliasFaqEntry>(
        (tFb as any)?.(`content.${alias}.faqs`, { returnObjects: true } as any),
      );
    }
    const aliasFaqsRaw = mapFaqs(aliasFaqsSource);

    const genericFaqsRaw = mapFaqs(
      ensureArray<AliasFaqEntry>(
        (translations as any)?.tGuides?.(`content.${guideKey}.faqs`, { returnObjects: true } as any) as unknown,
      ),
    );

    const combined = [...genericFaqsRaw, ...aliasFaqsRaw];
    if (combined.length === 0) return null;

    const aliasLabel = (() => {
      try {
        const tocKey = `content.${alias}.toc.faqs`;
        const tocRaw: unknown = translations.tGuides?.(tocKey);
        const tocLabel = typeof tocRaw === "string" ? tocRaw.trim() : "";
        if (tocLabel.length > 0 && tocLabel !== tocKey) return tocLabel;
      } catch { /* noop */ }
      try {
        const kA1 = `content.${alias}.faqsTitle`;
        const r1: unknown = (tFb as any)?.(kA1);
        const s1 = typeof r1 === "string" ? r1.trim() : "";
        if (s1.length > 0 && s1 !== kA1) return s1;
      } catch { /* noop */ }
      try {
        const kA2 = `${alias}.faqsTitle`;
        const r2: unknown = (tFb as any)?.(kA2);
        const s2 = typeof r2 === "string" ? r2.trim() : "";
        if (s2.length > 0 && s2 !== kA2) return s2;
      } catch { /* noop */ }
      return (t("labels.faqsHeading", { defaultValue: "FAQs" }) as string) ?? "FAQs";
    })();

    return (
      <section id="faqs" className="space-y-4">
        <h2 className="text-pretty text-2xl font-semibold leading-snug tracking-tight text-brand-heading sm:text-3xl">
          {aliasLabel}
        </h2>
        <div className="space-y-4">
          {combined.map((faq, index) => (
            <details
              key={`${faq.q}-${index}`}
              className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
	            >
	              <summary
	                role="button"
	                className="px-4 py-3 text-lg font-semibold leading-snug text-brand-heading sm:text-xl"
	              >
	                {renderGuideLinkTokens(faq.q, lang, `alias-faq-q-${index}`, guideKey)}
	              </summary>
	              <div className="space-y-3 px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
	                {renderBodyBlocks(faq.a, lang, `alias-faq-${index}`, guideKey)}
	              </div>
	            </details>
	          ))}
	        </div>
      </section>
    ) as any;
  } catch {
    return null;
  }
}
