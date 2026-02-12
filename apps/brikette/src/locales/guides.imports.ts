// file path: src/locales/guides.imports.ts
// -----------------------------------------------------------------------------
// Client/runtime loader that assembles the guides namespace from split JSON
// files when import.meta.webpackContext is unavailable (e.g. Turbopack).
// -----------------------------------------------------------------------------

import { GENERATED_GUIDE_SLUGS } from "../data/generate-guide-slugs";
import { isGuideLive } from "../data/guides.index";

import type { GuidesNamespace } from "./guides.types";
import { isRecord } from "./guides.util";
import { loadGuidesLocaleResource } from "./locale-loader.guides";

// Only load content for live guides — draft/review content is excluded from the bundle
const ALL_KEYS = Object.keys(GENERATED_GUIDE_SLUGS);
const CONTENT_KEYS = ALL_KEYS.filter((key) => isGuideLive(key));

type GlobalGuideImport = {
  key: string;
  ns: string;
};

const GLOBAL_IMPORTS: GlobalGuideImport[] = [
  { key: "breadcrumbs", ns: "guides/breadcrumbs" },
  { key: "components", ns: "guides/components" },
  { key: "fallbacks", ns: "guides/fallbacks" },
  { key: "indexRedirect", ns: "guides/indexRedirect" },
  { key: "labels", ns: "guides/labels" },
  { key: "robots", ns: "guides/robots" },
  { key: "structured", ns: "guides/structured" },
  { key: "tagPage", ns: "guides/tagPage" },
  { key: "tags", ns: "guides/tags" },
  { key: "tagsIndex", ns: "guides/tagsIndex" },
  { key: "transportNotice", ns: "guides/transportNotice" },
];

const META_IMPORTS: GlobalGuideImport[] = [
  { key: "index", ns: "guides/meta/index" },
];

const toRecord = (value: unknown): Record<string, unknown> | undefined =>
  isRecord(value) ? (value as Record<string, unknown>) : undefined;

const mergeRecords = (
  base?: Record<string, unknown>,
  patch?: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  if (!base && !patch) return undefined;
  return { ...(base ?? {}), ...(patch ?? {}) };
};

export async function loadGuidesNamespaceFromImports(
  lang: string,
): Promise<GuidesNamespace | undefined> {
  const legacyRaw = await loadGuidesLocaleResource(lang, "guides");
  const legacy = toRecord(legacyRaw);

  const globals: Record<string, unknown> = {};
  let hasGlobals = false;

  for (const { key, ns } of GLOBAL_IMPORTS) {
    const data = await loadGuidesLocaleResource(lang, ns);
    if (typeof data !== "undefined") {
      globals[key] = data;
      hasGlobals = true;
    }
  }

  const metaEntries: Record<string, unknown> = {};
  for (const { key, ns } of META_IMPORTS) {
    const data = await loadGuidesLocaleResource(lang, ns);
    if (typeof data !== "undefined") {
      metaEntries[key] = data;
      hasGlobals = true;
    }
  }

  if (Object.keys(metaEntries).length > 0) {
    globals["meta"] = metaEntries;
  }

  if (!legacy && !hasGlobals) {
    return undefined;
  }

  const merged: GuidesNamespace = {
    ...(legacy ?? {}),
    ...(hasGlobals ? globals : {}),
    content: {},
  };

  // Load content files from guides/content/*.json
  // These contain intro, sections, faqs, seo for each guide
  const contentEntries: Record<string, unknown> = {};
  await Promise.all(
    CONTENT_KEYS.map(async (key) => {
      const data = await loadGuidesLocaleResource(lang, `guides/content/${key}`);
      if (typeof data !== "undefined" && data !== null) {
        contentEntries[key] = data;
      }
    }),
  );

  // Merge: legacy content (linkLabels etc) + split content files (intro, sections, faqs)
  const legacyContent = toRecord(legacy?.["content"]) ?? {};
  const mergedContent: Record<string, unknown> = { ...legacyContent };
  for (const [key, splitData] of Object.entries(contentEntries)) {
    const existing = toRecord(mergedContent[key]) ?? {};
    mergedContent[key] = { ...existing, ...(toRecord(splitData) ?? {}) };
  }
  if (Object.keys(mergedContent).length > 0) {
    merged.content = mergedContent;
  }

  const meta = mergeRecords(toRecord(legacy?.["meta"]), toRecord(merged["meta"]));
  if (meta && Object.keys(meta).length > 0) {
    merged["meta"] = meta;
  }

  return merged;
}

// Re-export for tests
export { CONTENT_KEYS as __CONTENT_KEYS_FOR_TESTS };
