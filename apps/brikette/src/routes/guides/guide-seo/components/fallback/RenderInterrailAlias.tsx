import TableOfContents from "@/components/guides/TableOfContents";
import { getContentAlias } from "@/config/guide-overrides";
import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { GuideTranslationSuite } from "../../translations";
import type { Translator } from "../../types";

interface Props {
  lang: AppLanguage;
  guideKey: string;
  translations: Pick<GuideTranslationSuite, "tGuides">;
  t: Translator;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
}

/**
 * Alias handling for guides with a configured contentAlias.
 * Returns a structured fallback block when alias arrays are present.
 */
export default function RenderInterrailAlias({
  lang,
  guideKey,
  translations,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
}: Props): JSX.Element | null {
  const aliasKey = getContentAlias(guideKey);
  if (!aliasKey) return null;
  try {
    const aliasIntroRaw = translations.tGuides?.(
      `content.${aliasKey}.intro`,
      { returnObjects: true },
    ) as unknown;
    const aliasIntro = Array.isArray(aliasIntroRaw) ? ensureStringArray(aliasIntroRaw) : [];

    const aliasSectionsRaw = translations.tGuides?.(
      `content.${aliasKey}.sections`,
      { returnObjects: true },
    ) as unknown;
    const aliasSectionsArr = ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
      aliasSectionsRaw,
    );
    const aliasSections = aliasSectionsArr
      .map((s, idx) => {
        const id = typeof s?.id === "string" && s.id.trim().length > 0 ? s.id.trim() : `s-${idx}`;
        const title = typeof s?.title === "string" ? s.title.trim() : "";
        const body = ensureStringArray(s?.body ?? s?.items);
        if (!title && body.length === 0) return null;
        return { id, title, body };
      })
      .filter((x): x is { id: string; title: string; body: string[] } => x != null);

    const aliasFaqsRaw = translations.tGuides?.(
      `content.${aliasKey}.faqs`,
      { returnObjects: true },
    ) as unknown;
    const aliasFaqsArr = ensureArray<{ q?: string; a?: unknown }>(aliasFaqsRaw)
      .map((f) => ({ q: typeof f?.q === "string" ? f.q.trim() : "", a: ensureStringArray(f?.a) }))
      .filter((f) => f.q.length > 0 && f.a.length > 0);

    if (aliasIntro.length === 0 && aliasSections.length === 0 && aliasFaqsArr.length === 0) return null;

    const tocItemsBase = aliasSections
      .map((s) => ({ href: `#${s.id}`, label: (s.title || "").trim() }))
      .filter((it) => it.label.length > 0);

    // Append FAQs anchor when alias FAQs exist to match expectations
    // in tests that the TOC includes a link to the FAQs section.
    const tocItems = (() => {
      const items = [...tocItemsBase];
      if (aliasFaqsArr.length > 0 && !items.some((i) => i.href === "#faqs")) {
        const label = ((): string => {
          try {
            const raw: unknown = translations.tGuides?.(
              `content.${aliasKey}.toc.faqs`,
            );
            const s = typeof raw === "string" ? raw.trim() : "";
            if (s.length > 0 && s !== `content.${aliasKey}.toc.faqs`) return s;
          } catch {
            /* noop */
          }
          return (t("labels.faqsHeading", { defaultValue: "FAQs" }) as string) ?? "FAQs";
        })();
        items.push({ href: "#faqs", label });
      }
      return items;
    })();

    return (
      <>
        {aliasIntro.length > 0 ? (
          <div className="space-y-4">
            {aliasIntro.map((p, idx) => (
              <p key={idx}>{renderGuideLinkTokens(p, lang, `alias-intro-${idx}`, guideKey)}</p>
            ))}
          </div>
        ) : null}
        {tocItems.length > 0 && showTocWhenUnlocalized ? (
          suppressTocTitle ? (
            <TableOfContents items={tocItems} />
          ) : (
            <TableOfContents items={tocItems} title={t(`labels.onThisPage`, { defaultValue: "On this page" }) as string} />
          )
        ) : null}
        {aliasSections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
            {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
            {renderBodyBlocks(s.body, lang, `alias-section-${s.id}`, guideKey)}
          </section>
        ))}
        {aliasFaqsArr.length > 0 ? (
          <section id="faqs" className="space-y-4">
            <h2 className="text-xl font-semibold">
              {translations.tGuides?.(`content.${aliasKey}.toc.faqs`)
                ? String(translations.tGuides(
                    `content.${aliasKey}.toc.faqs`,
                  ))
                : ((t("labels.faqsHeading", { defaultValue: "FAQs" }) as string) ?? "FAQs")}
            </h2>
            <div className="space-y-3">
              {aliasFaqsArr.map((f, i) => (
                <details key={i}>
                  <summary role="button" className="font-medium">{f.q}</summary>
                  {renderBodyBlocks(f.a, lang, `alias-faq-${i}`, guideKey)}
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </>
    );
  } catch {
    /* ignore – treat alias content as absent */
  }
  return null;
}
