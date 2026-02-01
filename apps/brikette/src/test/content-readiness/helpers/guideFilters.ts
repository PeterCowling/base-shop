import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";

type GuideFilterOptions = {
  guideArea?: string | undefined;
  guideKeys?: string[] | undefined;
};

function normalizeList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function getEnvGuideFilters(): GuideFilterOptions {
  const guideArea = process.env.GUIDE_AREA?.trim() || process.env.GUIDE_AREAS?.trim();
  const guideKeys = normalizeList(process.env.GUIDE_KEYS);
  return { guideArea: guideArea || undefined, guideKeys };
}

function matchesArea(entry: GuideManifestEntry, guideArea: string): boolean {
  // We accept either slug-ish names ("experiences") or manifest values ("experience").
  const normalized = guideArea.trim().toLowerCase();
  const area = normalized === "experiences" ? "experience" : normalized;
  return entry.primaryArea === area || entry.areas.includes(area as never);
}

/**
 * Returns a set of `guides/content/<contentKey>.json` files to include, based on env vars.
 *
 * Supported env vars:
 * - `GUIDE_AREA=experience` (or `GUIDE_AREAS=experience`)
 * - `GUIDE_KEYS=key1,key2`
 *
 * If no filters are set, returns `undefined` (meaning "include all").
 */
export function resolveGuideContentFileAllowlist(): Set<string> | undefined {
  const { guideArea, guideKeys } = getEnvGuideFilters();
  if (!guideArea && (!guideKeys || guideKeys.length === 0)) return undefined;

  const allow = new Set<string>();
  const entries = listGuideManifestEntries();

  const keyFilter = guideKeys ? new Set(guideKeys) : undefined;

  for (const entry of entries) {
    if (guideArea && !matchesArea(entry, guideArea)) continue;
    if (keyFilter && !keyFilter.has(entry.key)) continue;
    allow.add(`guides/content/${entry.contentKey}.json`);
  }

  return allow;
}

