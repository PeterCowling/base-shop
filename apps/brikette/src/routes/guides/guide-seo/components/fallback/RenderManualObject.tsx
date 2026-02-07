import TableOfContents from "@/components/guides/TableOfContents";
import type { GuideKey } from "@/guides/slugs";
import i18nApp from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";
import { debugGuide } from "@/utils/debug";
import type { TFunction } from "@/utils/i18nSafe";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

interface Props {
  translations: { tGuides: TFunction };
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
  guideKey: GuideKey;
  lang: AppLanguage;
  t: TFunction;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackTranslator?: TFunction | undefined;
}

/** Manual object fallback under content.{guideKey}.fallback */
export default function RenderManualObject({
  translations,
  hookI18n,
  guideKey,
  lang,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
  fallbackTranslator,
}: Props): JSX.Element | null {
  try {
    const kManual = `content.${guideKey}.fallback` as const;
    const manualLocalRaw = translations.tGuides(kManual, { returnObjects: true }) as unknown;
    const manualEnRaw = (hookI18n?.getFixedT?.("en", "guides")
      ?? i18nApp?.getFixedT?.("en", "guides"))?.(kManual, { returnObjects: true }) as unknown;

    type ManualSection = {
      id?: unknown;
      title?: unknown;
      heading?: unknown;
      body?: unknown;
      items?: unknown;
    };
    type ManualTocItem = { href?: unknown; label?: unknown };
    type ManualFallback = {
      intro?: unknown;
      sections?: ManualSection[];
      toc?: ManualTocItem[];
      tocTitle?: unknown;
      faq?: { summary?: unknown; answer?: unknown };
    };

    const asObj = (v: unknown): ManualFallback | null =>
      v && typeof v === "object" && !Array.isArray(v) ? (v as ManualFallback) : null;
    const manualLocal = asObj(manualLocalRaw);
    const manualEn = asObj(manualEnRaw);
    if (!manualLocal && !manualEn) return null;

    const hasMeaningfulManual = (mf: ManualFallback | null): boolean => {
      if (!mf) return false;
      try {
        const intro = ensureStringArray(mf.intro).filter((p) => p && p.trim().length > 0);
        if (intro.length > 0) return true;
      } catch { /* noop */ }
      try {
        const secs = ensureArray<ManualSection>(mf.sections).map((s) => ensureStringArray(s?.body ?? s?.items));
        if (secs.some((arr) => arr.length > 0)) return true;
      } catch { /* noop */ }
      return false;
    };

    const base: ManualFallback = (hasMeaningfulManual(manualLocal) ? manualLocal : (manualEn ?? {})) as ManualFallback;
    const getStrLocal = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const toStrictStringArray = (val: unknown): string[] => {
      if (Array.isArray(val)) {
        return (val as unknown[])
          .filter((x): x is string => typeof x === 'string')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      if (typeof val === 'string') {
        const s = val.trim();
        return s.length > 0 ? [s] : [];
      }
      return [];
    };
    const introEff = toStrictStringArray(base.intro);

    const faqSummary = getStrLocal(base?.faq?.summary);
    const faqAnswerArr = ensureStringArray(base?.faq?.answer);
    // Avoid hardcoded copy; prefer translation or omit the heading when absent
    const faqLabelRaw = t("labels.faqsHeading") as unknown;
    const faqLabel = typeof faqLabelRaw === "string" && faqLabelRaw.trim() !== "labels.faqsHeading"
      ? faqLabelRaw.trim()
      : "";

    const sectionsEff = (() => {
      const sectionsLocal = ensureArray<ManualSection>(base.sections);
      return sectionsLocal
        .map((s, idx) => ({
          id: typeof s?.id === "string" && s.id.trim().length > 0 ? s.id.trim() : `s-${idx}`,
          title:
            typeof s?.title === "string"
              ? s.title
              : typeof s?.heading === "string"
              ? s.heading
              : "",
          body: toStrictStringArray((s as ManualSection)?.body ?? (s as ManualSection)?.items),
        }))
        // Only keep sections with meaningful body content; drop title-only
        // entries to avoid rendering empty headings like "Missing" in tests.
        .filter((s) => s.body.length > 0)
        .map((s) => ({
          ...s,
          title: (s.title || "").trim(),
          body: s.body.map((p) => p.trim()).filter((p) => p.length > 0),
        }));
    })();

    const tocWasProvided = Object.prototype.hasOwnProperty.call(base ?? {}, "toc");
    const tocBase: Array<{ href?: unknown; label?: unknown }> = Array.isArray(base?.toc) ? base!.toc! : [];
    const tocEnBase: Array<{ href?: unknown; label?: unknown }> = Array.isArray(manualEn?.toc)
      ? (manualEn!.toc as Array<{ href?: unknown; label?: unknown }>)
      : [];

    const manualLabelsCollapsed = (() => {
      try {
        const keys = [
          `content.${guideKey}.toc.speeds`,
          `content.${guideKey}.toc.habits`,
          `content.${guideKey}.toc.gear`,
          `content.${guideKey}.toc.faqs`,
        ] as const;
        const vals = keys.map((k) => {
          const v = t(k) as unknown;
          return typeof v === "string" ? v.trim() : "";
        });
        return vals.every(
          (v) =>
            v.length === 0 ||
            v === `content.${guideKey}.toc.speeds` ||
            v === `content.${guideKey}.toc.habits` ||
            v === `content.${guideKey}.toc.gear` ||
            v === `content.${guideKey}.toc.faqs`,
        );
      } catch {
        return false;
      }
    })();

    const normaliseToc = (toc: Array<{ href?: unknown; label?: unknown }>) =>
      toc
        .map((it, index) => {
          const label = typeof it?.label === "string" ? (it.label as string).trim() : "";
          const hrefRaw = typeof it?.href === "string" ? (it.href as string).trim() : "";
          const href = hrefRaw || `#${sectionsEff[index]?.id ?? `s-${index}`}`;
          return label ? { href, label } : null;
        })
        .filter((x): x is { href: string; label: string } => x != null);

    const tocLocal = normaliseToc(tocBase);
    const tocEn = normaliseToc(tocEnBase);

    const tocItems = (() => {
      if (tocWasProvided) {
        return tocLocal;
      }
      if (tocLocal.length > 0) {
        return tocLocal;
      }
      if (tocEn.length > 0) {
        return tocEn;
      }
      if (manualLabelsCollapsed) return [] as { href: string; label: string }[];
      return sectionsEff.map((s) => ({ href: `#${s.id}`, label: s.title || s.id }));
    })();

    try {
      debugGuide(
        "GuideSeoTemplate object fallback toc", // i18n-exempt -- DEV-000 [ttl=2099-12-31] Debug label
        tocItems,
      );
    } catch {
      void 0;
    }

    // If both intro and sections are empty, suppress fallback rendering
    // altogether (including any toc-only entries). This matches tests that
    // expect no fallback output when curated copy sanitises away.
    if (introEff.length === 0 && sectionsEff.length === 0) return null;

    return (
      <>
	        {introEff.length > 0 ? (
	          <div className="space-y-4">
	            {renderBodyBlocks(introEff, lang, `manual-intro-${guideKey}`, guideKey)}
	          </div>
	        ) : null}
        {tocItems.length > 0 && showTocWhenUnlocalized ? (
          suppressTocTitle ? (
            <TableOfContents items={tocItems} />
          ) : (
            (() => {
              const tocTitle = (() => {
                const manualTitle = getStrLocal(manualLocal?.tocTitle);
                if (manualTitle) return manualTitle;
                const enTitle = getStrLocal(manualEn?.tocTitle);
                if (enTitle) return enTitle;
                try {
                  const raw = fallbackTranslator?.(`${guideKey}.tocTitle`);
                  const v = typeof raw === "string" ? raw.trim() : "";
                  if (v && v !== `${guideKey}.tocTitle`) return v;
                } catch {
                  void 0;
                }
                return undefined;
              })();
              return (
                <TableOfContents
                  items={tocItems}
                  {...(typeof tocTitle === "string" ? { title: tocTitle } : {})}
                />
              );
            })()
          )
        ) : null}
	        {sectionsEff.map((s) => (
	          <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
	            {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
	            {renderBodyBlocks(s.body, lang, `manual-section-${s.id}`, guideKey)}
	          </section>
	        ))}
        {faqLabel || faqSummary || faqAnswerArr.length > 0 ? (
          <section className="space-y-4">
	            {faqLabel ? <h2 className="text-xl font-semibold">{faqLabel}</h2> : null}
	            <div className="space-y-3">
	              <details>
	                <summary role="button" className="font-medium">
	                  {faqSummary ? renderGuideLinkTokens(faqSummary, lang, `manual-faq-summary-${guideKey}`, guideKey) : ""}
	                </summary>
	                {renderBodyBlocks(faqAnswerArr, lang, `manual-faq-${guideKey}`, guideKey)}
	              </details>
	            </div>
	          </section>
	        ) : null}
      </>
    );
  } catch {
    void 0;
  }
  return null;
}
