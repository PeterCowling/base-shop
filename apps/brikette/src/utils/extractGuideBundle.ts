import i18n from "@/i18n";

type I18nBundleReader = {
  getResourceBundle?: (lang: string, namespace: string) => unknown;
};

function resolveBundleReader(source: unknown): I18nBundleReader {
  if (source && typeof source === "object" && "getResourceBundle" in source) {
    return source as I18nBundleReader;
  }
  if (
    source &&
    typeof source === "object" &&
    "default" in source &&
    source.default &&
    typeof source.default === "object"
  ) {
    return source.default as I18nBundleReader;
  }
  return {};
}

/**
 * Extract a slim guide translation bundle containing only shared keys and
 * the current guide's content. Returns undefined if the i18n store is empty.
 */
export function extractGuideBundle(
  lang: string,
  guideKey: string,
): Record<string, unknown> | undefined {
  return extractGuidesBundle(lang, [guideKey]);
}

/**
 * Extract a slim guide translation bundle containing only shared keys and
 * the requested guide content entries. Returns undefined if the i18n store
 * is empty.
 */
export function extractGuidesBundle(
  lang: string,
  guideKeys: readonly string[],
): Record<string, unknown> | undefined {
  const bundleReader = resolveBundleReader(i18n);
  const bundle = bundleReader.getResourceBundle?.(lang, "guides") as
    | Record<string, unknown>
    | undefined;
  if (!bundle || typeof bundle !== "object") return undefined;
  const { content, ...shared } = bundle;
  const contentRecord = (content as Record<string, unknown> | undefined) ?? {};
  const selectedContent: Record<string, unknown> = {};
  for (const key of guideKeys) {
    const entry = contentRecord[key];
    if (typeof entry !== "undefined") {
      selectedContent[key] = entry;
    }
  }
  return {
    ...shared,
    content: selectedContent,
  };
}
