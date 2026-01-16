// src/locales/guide-link-labels.ts
// ---------------------------------------------------------------------------
// Build-time map of guide link labels per locale sourced directly from the
// static JSON content under `src/locales/*/guides/content/*.json`.
// Falls back gracefully when the glob helper is unavailable (e.g. certain
// test environments), letting callers continue to rely on other strategies.
// ---------------------------------------------------------------------------

type GuideContentModule = { default?: { linkLabel?: unknown }; linkLabel?: unknown };
type GuideLabelMap = Record<string, Record<string, string>>;

const STATIC_GUIDE_LABELS: GuideLabelMap = (() => {
  let modules: Record<string, GuideContentModule> | undefined;
  try {
    modules = import.meta.glob("./*/guides/content/*.json", {
      eager: true,
    }) as Record<string, GuideContentModule>;
  } catch {
    modules = undefined;
  }
  if (!modules || Object.keys(modules).length === 0) {
    return {};
  }

  const labels: GuideLabelMap = {};

  for (const [path, mod] of Object.entries(modules)) {
    const parsed = parseLocaleAndSlug(path);
    if (!parsed) continue;
    const { locale, slug } = parsed;

    const label = readLinkLabel(mod);
    if (!label) continue;

    if (!labels[locale]) {
      labels[locale] = {};
    }
    labels[locale]![slug] = label;
  }

  return labels;
})();

function readLinkLabel(module: GuideContentModule): string | undefined {
  const payload = (module?.default ?? module) as { linkLabel?: unknown } | undefined;
  if (!payload) return undefined;
  const raw = payload.linkLabel;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseLocaleAndSlug(rawPath: string): { locale: string; slug: string } | null {
  const normalized = rawPath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  const guidesIndex = segments.lastIndexOf("guides");
  if (guidesIndex <= 0) {
    return null;
  }
  const locale = segments[guidesIndex - 1];
  const contentSegment = segments[guidesIndex + 1];
  const fileSegment = segments[guidesIndex + 2];
  if (!locale || contentSegment !== "content" || !fileSegment) {
    return null;
  }
  const slug = fileSegment.replace(/\.json$/iu, "");
  if (!slug) {
    return null;
  }
  return { locale, slug };
}

export function getStaticGuideLabel(locale: string, key: string): string | undefined {
  return STATIC_GUIDE_LABELS[locale]?.[key];
}