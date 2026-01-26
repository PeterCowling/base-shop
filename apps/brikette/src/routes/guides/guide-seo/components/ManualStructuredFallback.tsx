/**
 * Manual structured fallback renderer.
 *
 * Renders a minimal ToC + sections from fallback data when routes prefer
 * manual handling for unlocalized locales.
 */
import TableOfContents from "@/components/guides/TableOfContents";
import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";

import type { StructuredFallback } from "../utils/fallbacks";

interface Props {
  fallback: StructuredFallback | null;
  hasLocalizedContent: boolean;
  preferManualWhenUnlocalized: boolean;
  suppressUnlocalizedFallback: boolean;
  translatorProvidedEmptyStructured: boolean;
  lang: AppLanguage;
}

export interface ManualStructuredFallbackResult {
  node: React.ReactNode;
  hasContent: boolean;
}

/**
 * Compute the manual structured fallback content.
 */
export function computeManualStructuredFallback({
  fallback,
  hasLocalizedContent,
  preferManualWhenUnlocalized,
  suppressUnlocalizedFallback,
  translatorProvidedEmptyStructured,
  lang,
}: Props): ManualStructuredFallbackResult {
  if (!preferManualWhenUnlocalized || suppressUnlocalizedFallback) {
    return { node: null, hasContent: false };
  }

  try {
    if (translatorProvidedEmptyStructured) {
      return { node: null, hasContent: false };
    }
    if (hasLocalizedContent) {
      return { node: null, hasContent: false };
    }
    if (!fallback) {
      return { node: null, hasContent: false };
    }

    const intro = Array.isArray(fallback.intro)
      ? (fallback.intro as unknown[])
          .map((paragraph) => (typeof paragraph === "string" ? paragraph.trim() : ""))
          .filter((text) => text.length > 0)
      : [];

    const sections = Array.isArray(fallback.sections)
      ? (fallback.sections as Array<Record<string, unknown>>)
          .map((section, idx) => {
            if (!section || typeof section !== "object") return null;
            const idRaw = typeof section["id"] === "string" ? section["id"].trim() : "";
            const id = idRaw.length > 0 ? idRaw : `s-${idx}`;
            const title = typeof section["title"] === "string" ? section["title"].trim() : "";
            const body = Array.isArray(section["body"])
              ? (section["body"] as unknown[])
                  .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
                  .filter((text) => text.length > 0)
              : [];
            if (title.length === 0 && body.length === 0) return null;
            return { id, title, body };
          })
          .filter((value): value is { id: string; title: string; body: string[] } => value != null)
      : [];

    if (intro.length === 0 && sections.length === 0) {
      return { node: null, hasContent: false };
    }

    const tocItems = sections
      .map((section) => ({ href: `#${section.id}`, label: section.title || section.id }))
      .filter((item) => item.label.length > 0);

    return {
      node: (
        <>
          {intro.length > 0 ? (
            <div className="space-y-4">
              {intro.map((paragraph, idx) => (
                <p key={idx}>{renderGuideLinkTokens(paragraph, lang, `intro-${idx}`)}</p>
              ))}
            </div>
          ) : null}
          {tocItems.length > 0 ? <TableOfContents items={tocItems} /> : null}
          {sections.map((section, idxSection) => (
            <section
              key={`${section.id}-${idxSection}`}
              id={section.id}
              className="scroll-mt-28 space-y-4"
            >
              {section.title ? <h2 className="text-xl font-semibold">{section.title}</h2> : null}
              {renderBodyBlocks(section.body, lang, `section-${section.id}`)}
            </section>
          ))}
        </>
      ),
      hasContent: true,
    };
  } catch {
    return { node: null, hasContent: false };
  }
}

export default function ManualStructuredFallback(props: Props): JSX.Element | null {
  const result = computeManualStructuredFallback(props);
  return result.node as JSX.Element | null;
}
