import { isGuideDebugEnabled } from "@/utils/debug";

interface ArticleHeaderProps {
  displayTitle: string;
  subtitle?: string;
  debug: {
    lang: string;
    guideKey: string;
    effectiveTitle: string;
    hasLocalizedContent: boolean;
    article: { title: string; description: string };
    counts: { sections: number; intro: number; faqs: number; baseToc: number };
  };
}

export default function ArticleHeader({ displayTitle, subtitle, debug }: ArticleHeaderProps): JSX.Element {
  const resolvedTitle = (() => {
    const primary = typeof displayTitle === "string" ? displayTitle.trim() : "";
    if (primary.length > 0) return primary;
    const fromMeta = typeof debug?.article?.title === "string" ? debug.article.title.trim() : "";
    if (fromMeta.length > 0) return fromMeta;
    const fromEffective = typeof debug?.effectiveTitle === "string" ? debug.effectiveTitle.trim() : "";
    if (fromEffective.length > 0) return fromEffective;
    const fromGuideKey = typeof debug?.guideKey === "string" ? debug.guideKey : "";
    return fromGuideKey;
  })();
  const subtitleText = typeof subtitle === "string" ? subtitle.trim() : "";

  return (
    <>
      {isGuideDebugEnabled() ? (
        <pre data-debug-guide-title className="mt-2 overflow-auto rounded bg-brand-surface/40 p-2 text-xs text-brand-muted">
          {JSON.stringify(
            {
              lang: debug.lang,
              guideKey: debug.guideKey,
              expectedKey: `content.${debug.guideKey}.seo.title`,
              resolvedTitle: debug.effectiveTitle,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
      <h1 className="text-pretty text-4xl font-semibold tracking-tight" aria-label={resolvedTitle}>
        {resolvedTitle}
      </h1>
      {subtitleText.length > 0 ? <p>{subtitleText}</p> : null}
      {isGuideDebugEnabled() ? (
        <pre data-debug-guide-content className="mt-2 overflow-auto rounded bg-brand-surface/40 p-2 text-xs text-brand-muted">
          {JSON.stringify(
            {
              lang: debug.lang,
              guideKey: debug.guideKey,
              hasLocalizedContent: debug.hasLocalizedContent,
              article: debug.article,
              counts: debug.counts,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </>
  );
}
