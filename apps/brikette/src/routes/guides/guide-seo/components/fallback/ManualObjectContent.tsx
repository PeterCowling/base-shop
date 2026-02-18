import TableOfContents from "@/components/guides/TableOfContents";
import type { GuideKey } from "@/guides/slugs";
import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";

import type { NormalisedManualSection } from "./helpers/manualFallbackTypes";

interface Props {
  introEff: string[];
  tocItems: Array<{ href: string; label: string }>;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle: boolean | undefined;
  tocTitle: string | undefined;
  sectionsEff: NormalisedManualSection[];
  faqLabel: string;
  faqSummary: string;
  faqAnswerArr: string[];
  lang: AppLanguage;
  guideKey: GuideKey;
}

export function ManualObjectContent({
  introEff,
  tocItems,
  showTocWhenUnlocalized,
  suppressTocTitle,
  tocTitle,
  sectionsEff,
  faqLabel,
  faqSummary,
  faqAnswerArr,
  lang,
  guideKey,
}: Props): JSX.Element {
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
          <TableOfContents
            items={tocItems}
            {...(typeof tocTitle === "string" ? { title: tocTitle } : {})}
          />
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
}
