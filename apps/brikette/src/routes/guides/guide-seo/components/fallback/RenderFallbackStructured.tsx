import TableOfContents from "@/components/guides/TableOfContents";
import {
  getContentAlias,
  getContentKey,
  shouldMergeAliasFaqs,
  shouldSuppressFallbackStructuredWhenManualEn,
} from "@/config/guide-overrides";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";

import type { GuideSeoTemplateContext, Translator } from "../../types";
import type { FallbackTranslator, StructuredFallback } from "../../utils/fallbacks";

import { resolveFallbackFaqs, resolveFaqHeading } from "./helpers/resolveFaqData";
import { addFaqToToc, filterTocItems, finalizeTocItems, resolveTocItems } from "./helpers/resolveTocItems";
import { resolveTocTitle } from "./helpers/resolveTocTitle";

interface Props {
  fallback: StructuredFallback;
  context: GuideSeoTemplateContext;
  guideKey: string;
  t: Translator;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  preferManualWhenUnlocalized?: boolean;
}

export default function RenderFallbackStructured({
  fallback,
  context,
  guideKey,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
  preferManualWhenUnlocalized,
}: Props): JSX.Element {
  const tFb: FallbackTranslator | undefined = fallback?.translator;
  const aliasKey = getContentAlias(guideKey);
  const mergeAliasFaqs = shouldMergeAliasFaqs(guideKey);

  // Suppress EN structured fallbacks entirely for the eco‑friendly Amalfi
  // guide when the route prefers manual handling for unlocalized locales.
  // Other routes (e.g., sunsetViewpoints) should still render EN structured
  // fallback intro/sections. Narrow the suppression to the specific guide key
  // to match test expectations.
  try {
    const lang = context.lang;
    if (
      preferManualWhenUnlocalized &&
      lang === 'en' &&
      fallback?.source === 'guidesEn' &&
      shouldSuppressFallbackStructuredWhenManualEn(guideKey)
    ) {
      return <></>;
    }
  } catch { /* noop */ }

  // Compute a camelCased legacy key candidate derived from the route slug,
  // matching the transformation used by buildStructuredFallback. This allows
  // reading alternate keys such as content.amalfiCoastPublicTransportGuide.*
  // when the primary guideKey lacks structured arrays.
  const legacyKey = getContentKey(guideKey);

  const tocTitleFb = resolveTocTitle(tFb, guideKey, legacyKey);

  // Consider only sections that have meaningful body content when rendering
  // headings and deriving ToC entries. This avoids showing placeholder
  // headings like "Missing" when no copy accompanies the section.
  const meaningfulSections = fallback.sections.filter((section) =>
    Array.isArray(section?.body) && section.body.some((p) => typeof p === 'string' && p.trim().length > 0),
  );

  const tocItems = resolveTocItems(tFb, t, guideKey, legacyKey, aliasKey, mergeAliasFaqs, meaningfulSections);
  const filteredTocItemsBase = filterTocItems(tocItems);
  const filteredTocItems = finalizeTocItems(filteredTocItemsBase, tFb, guideKey, legacyKey);
  const tocWithFaq = addFaqToToc(filteredTocItems, tFb, t, guideKey, legacyKey, fallback, preferManualWhenUnlocalized);

  const shouldShowToc = tocWithFaq.length > 0 && showTocWhenUnlocalized;

  const fallbackFaqs = resolveFallbackFaqs(tFb, guideKey, legacyKey);
  const fallbackFaqHeading = resolveFaqHeading(tFb, t, guideKey, legacyKey, aliasKey, mergeAliasFaqs);

  return (
    <>
      {fallback.intro.length > 0 ? (
        <div className="space-y-4">
          {fallback.intro.map((paragraph, index) => (
            <p key={`intro-${index}`}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`, guideKey)}</p>
          ))}
        </div>
      ) : null}
      {shouldShowToc
        ? suppressTocTitle
          ? (
              <TableOfContents items={tocWithFaq} />
            )
          : (
              <TableOfContents items={tocWithFaq} title={tocTitleFb} />
            )
        : null}
	      {meaningfulSections.length > 0
	        ? meaningfulSections.map((section) => (
	            <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
	              {section.title ? (
	                <h2 className="text-xl font-semibold">{section.title}</h2>
	              ) : null}
	              {renderBodyBlocks(section.body, context.lang, `section-${section.id}`, guideKey)}
	            </section>
	          ))
	        : null}
      {fallbackFaqs.length > 0 ? (
        <section id="faqs" className="space-y-4">
          <h2 className="text-xl font-semibold">{fallbackFaqHeading}</h2>
          <div className="space-y-3">
            {fallbackFaqs.map((f, i) => (
              <details key={f.question}>
                <summary role="button" className="font-medium">{f.question}</summary>
                {f.answer.map((ans, j) => (
                  <p key={`faq-${i}-${j}`}>{renderGuideLinkTokens(ans, context.lang, `faq-${i}-${j}`, guideKey)}</p>
                ))}
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
