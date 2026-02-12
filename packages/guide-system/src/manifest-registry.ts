/**
 * Guide manifest registry.
 *
 * Provides a singleton registry where apps register their guide manifest
 * entries. This decouples the manifest data (app-specific) from the
 * access functions (shared).
 */
import type { ManifestOverride,ManifestOverrides } from "./manifest-overrides";
import type { GuideManifestEntry } from "./manifest-types";

let entries: GuideManifestEntry[] = [];
let entryMap: Map<string, GuideManifestEntry> = new Map();

/**
 * Register manifest entries. Called once at app startup.
 */
export function registerManifestEntries(newEntries: GuideManifestEntry[]): void {
  entries = newEntries;
  entryMap = new Map(newEntries.map((e) => [e.key, e]));
}

/**
 * Get a single manifest entry by key.
 */
export function getGuideManifestEntry(key: string): GuideManifestEntry | undefined {
  return entryMap.get(key);
}

/**
 * List all manifest entries.
 */
export function listGuideManifestEntries(): GuideManifestEntry[] {
  return entries;
}

/**
 * Merge a manifest entry with overrides.
 */
export function mergeManifestOverride(
  entry: GuideManifestEntry,
  override: ManifestOverride | undefined,
): GuideManifestEntry {
  if (!override) return entry;
  return {
    ...entry,
    ...(override.areas ? { areas: override.areas } : {}),
    ...(override.primaryArea ? { primaryArea: override.primaryArea } : {}),
    ...(override.status ? { status: override.status } : {}),
    ...(override.draftPathSegment ? { draftPathSegment: override.draftPathSegment } : {}),
  };
}

/**
 * Get a manifest entry with overrides applied.
 */
export function getGuideManifestEntryWithOverrides(
  key: string,
  overrides: ManifestOverrides,
): GuideManifestEntry | undefined {
  const entry = entryMap.get(key);
  if (!entry) return undefined;
  return mergeManifestOverride(entry, overrides[key]);
}

/**
 * List all manifest entries with overrides applied.
 */
export function listGuideManifestEntriesWithOverrides(
  overrides: ManifestOverrides,
): GuideManifestEntry[] {
  return entries.map((entry) =>
    mergeManifestOverride(entry, overrides[entry.key]),
  );
}

/**
 * Resolve the draft path segment for a guide entry.
 */
export function resolveDraftPathSegment(
  entry: GuideManifestEntry,
  overridePath?: string | undefined,
): string {
  const override = overridePath?.trim();
  if (override) return override;
  const explicit = entry.draftPathSegment?.trim();
  if (explicit) return explicit;
  const slug = entry.slug.trim();
  if (!slug) return `guides/${entry.key}`;
  return slug.includes("/") ? slug : `guides/${slug}`;
}
