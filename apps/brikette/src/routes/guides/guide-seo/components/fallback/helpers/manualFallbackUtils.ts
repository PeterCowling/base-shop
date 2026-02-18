import type { GuideKey } from "@/guides/slugs";
import i18nApp from "@/i18n";
import type { TFunction } from "@/utils/i18nSafe";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { ManualFallback, ManualSection, ManualTocItem, NormalisedManualSection } from "./manualFallbackTypes";

export function asManualFallback(v: unknown): ManualFallback | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as ManualFallback) : null;
}

export function hasMeaningfulManual(mf: ManualFallback | null): boolean {
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
}

export function toStrictStringArray(val: unknown): string[] {
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
}

export function normaliseManualSections(base: ManualFallback): NormalisedManualSection[] {
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
}

export function checkManualLabelsCollapsed(t: TFunction, guideKey: GuideKey): boolean {
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
}

export function normaliseManualToc(
  toc: ManualTocItem[],
  sectionsEff: NormalisedManualSection[],
): Array<{ href: string; label: string }> {
  return toc
    .map((it, index) => {
      const label = typeof it?.label === "string" ? (it.label as string).trim() : "";
      const hrefRaw = typeof it?.href === "string" ? (it.href as string).trim() : "";
      const href = hrefRaw || `#${sectionsEff[index]?.id ?? `s-${index}`}`;
      return label ? { href, label } : null;
    })
    .filter((x): x is { href: string; label: string } => x != null);
}

export function resolveManualTocItems(
  tocWasProvided: boolean,
  tocLocal: Array<{ href: string; label: string }>,
  tocEn: Array<{ href: string; label: string }>,
  manualLabelsCollapsed: boolean,
  sectionsEff: NormalisedManualSection[],
): Array<{ href: string; label: string }> {
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
}

export function resolveManualTocTitle(
  manualLocal: ManualFallback | null,
  manualEn: ManualFallback | null,
  fallbackTranslator: TFunction | undefined,
  guideKey: GuideKey,
): string | undefined {
  const getStrLocal = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
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
}

export function fetchManualFallbacks(
  translations: { tGuides: TFunction },
  hookI18n: { getFixedT?: (lng: string, ns: string) => TFunction | undefined } | undefined,
  guideKey: GuideKey,
): { manualLocal: ManualFallback | null; manualEn: ManualFallback | null } {
  const kManual = `content.${guideKey}.fallback` as const;
  const manualLocalRaw = translations.tGuides(kManual, { returnObjects: true }) as unknown;
  const manualEnRaw = (hookI18n?.getFixedT?.("en", "guides")
    ?? i18nApp?.getFixedT?.("en", "guides"))?.(kManual, { returnObjects: true }) as unknown;

  const manualLocal = asManualFallback(manualLocalRaw);
  const manualEn = asManualFallback(manualEnRaw);

  return { manualLocal, manualEn };
}
