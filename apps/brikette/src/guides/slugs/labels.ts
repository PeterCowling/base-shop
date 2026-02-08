import { GENERATED_GUIDE_LINK_LABELS } from "../../data/generated-guide-link-labels";
import { getGuidesBundle } from "../../locales/guides";

type GuideContentEntry = { linkLabel?: unknown } | undefined;

function readContentLinkLabels(bundle: Record<string, unknown> | undefined): Record<string, string> {
  if (!bundle || typeof bundle !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(bundle)) {
    const linkLabel = (value as GuideContentEntry)?.linkLabel;
    if (typeof linkLabel === "string") {
      const trimmed = linkLabel.trim();
      if (trimmed.length > 0) {
        result[key] = linkLabel;
      }
    }
  }
  return result;
}

function readLegacyLinkLabels(bundle: { links?: Record<string, unknown> } | undefined): Record<string, string> {
  const links = bundle?.links;
  if (!links || typeof links !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(links)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

function readGeneratedLinkLabels(locale: string): Record<string, string> {
  const normalized = locale.trim().toLowerCase();
  const baseLanguage = normalized.split("-")[0];
  return (
    GENERATED_GUIDE_LINK_LABELS[normalized] ??
    GENERATED_GUIDE_LINK_LABELS[baseLanguage] ??
    {}
  );
}

export function getGuideLinkLabels(locale: string): Record<string, string> {
  const generatedLabels = readGeneratedLinkLabels(locale);
  const bundle = getGuidesBundle(locale) as
    | ({ content?: Record<string, GuideContentEntry> } & { links?: Record<string, unknown> })
    | undefined;
  if (!bundle) return generatedLabels;

  const contentLabels = readContentLinkLabels(bundle.content as Record<string, GuideContentEntry>);
  const legacyLabels = readLegacyLinkLabels(bundle);

  // Synthesise labels from SEO titles when linkLabel is missing.
  const seoTitleLabels: Record<string, string> = {};
  type ContentWithSeo = { seo?: { title?: unknown } } | undefined;
  const content = (bundle.content || {}) as Record<string, ContentWithSeo>;
  for (const [key, value] of Object.entries(content)) {
    if (typeof contentLabels[key] === "string" || typeof legacyLabels[key] === "string") continue;
    const seo = value?.seo;
    const title = typeof seo?.title === "string" ? seo.title.trim() : "";
    if (title) seoTitleLabels[key] = title;
  }

  return { ...generatedLabels, ...legacyLabels, ...contentLabels, ...seoTitleLabels };
}

const PLACEHOLDER_LABEL_PATTERNS: readonly (readonly RegExp[])[] = Object.freeze([
  [/अनुवाद/iu, /जा\s*रहा\s*है/iu],
  [/bản\s*dịch\s*đang\s*được\s*chuẩn\s*bị/iu],
  [/fordítás/iu, /folyamatban/iu],
]);

export const isPlaceholderGuideLabel = (label: string | undefined | null): boolean => {
  if (!label) return false;
  return PLACEHOLDER_LABEL_PATTERNS.some((patterns) => patterns.every((pattern) => pattern.test(label)));
};
