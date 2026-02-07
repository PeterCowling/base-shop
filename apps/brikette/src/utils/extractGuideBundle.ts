import i18n from "i18next";

/**
 * Extract a slim guide translation bundle containing only shared keys and
 * the current guide's content. Returns undefined if the i18n store is empty.
 */
export function extractGuideBundle(
  lang: string,
  guideKey: string,
): Record<string, unknown> | undefined {
  const bundle = i18n.getResourceBundle(lang, "guides") as
    | Record<string, unknown>
    | undefined;
  if (!bundle || typeof bundle !== "object") return undefined;
  const { content, ...shared } = bundle;
  const guideContent = (content as Record<string, unknown> | undefined)?.[
    guideKey
  ];
  return {
    ...shared,
    content: guideContent ? { [guideKey]: guideContent } : {},
  };
}
