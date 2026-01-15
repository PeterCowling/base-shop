// scripts/generate-guides-index-core.ts
// Generates src/data/guides.index.ts and src/data/tags.index.ts from the shared
// guide manifest + per-route handle tags so navigation, tag pages, and preview
// guards stay in sync with authored content.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path, { resolve } from "node:path";

import {
  guideComponentPath,
  type GuideKey,
  publishedGuideKeysByBase,
} from "../src/guides/slugs/index.ts";
import {
  buildGuideStatusMap,
  guideAreaToSlugKey,
  listGuideManifestEntries,
  type GuideManifestEntry,
} from "../src/routes/guides/guide-manifest.ts";

const ROOT = resolve(process.cwd());
const resolveWithinRoot = (candidate: string) =>
  path.isAbsolute(candidate) ? candidate : resolve(ROOT, candidate);
const GUIDES_INDEX_OUT_FILE = resolveWithinRoot(
  process.env.GUIDES_INDEX_OUT_FILE ?? "src/data/guides.index.ts",
);
const TAGS_INDEX_OUT_FILE = resolveWithinRoot(
  process.env.TAGS_INDEX_OUT_FILE ?? "src/data/tags.index.ts",
);

const TAGS_RE = /export\s+const\s+handle\s*=\s*\{[^}]*tags\s*:\s*\[((?:.|\n)*?)\]/ims;
const STRING_RE = /["'`]([^"'`]+)["'`]/g;
const REEXPORT_HANDLE_FROM_RE = /export\s+\{([^}]*?)\}\s+from\s+['"]([^'"]+)['"]/m;
const IMPORT_HANDLE_FROM_RE = /import\s+\{[^}]*?handle[^}]*?\}\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_HANDLE_RE = /export\s+\{[^}]*?handle[^}]*?\}/m;
const MODULE_EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".cts", ".js", ".mjs"];

type GuideSection = "help" | "experiences";
type GuideStatus = "draft" | "review" | "published";

const SECTION_BY_AREA: Record<ReturnType<typeof guideAreaToSlugKey>, GuideSection> = {
  experiences: "experiences",
  assistance: "help",
  howToGetHere: "help",
};

const SECTION_SORT_WEIGHT: Record<GuideSection, number> = {
  help: 0,
  experiences: 1,
};

const GUIDE_STATUS_SORT_WEIGHT: Record<GuideStatus, number> = {
  published: 0,
  review: 1,
  draft: 2,
};

const isProdEnv = (() => {
  if (process.env.GUIDES_INCLUDE_DRAFTS === "1") return false;
  if (process.env.NODE_ENV === "development" || process.env.VITEST) return false;
  return true;
})();

const ensureGuideSection = (
  key: GuideKey,
  manifestEntry: GuideManifestEntry | undefined,
): GuideSection => {
  if (manifestEntry) {
    const area = guideAreaToSlugKey(manifestEntry.primaryArea);
    return SECTION_BY_AREA[area] ?? "experiences";
  }
  return "experiences";
};

const extractTags = (absFile: string): string[] => {
  if (!existsSync(absFile)) {
    console.warn(`⚠️  Missing guide component for tags extraction: ${absFile}`);
    return [];
  }
  const raw = readFileSync(absFile, "utf8");
  const match = raw.match(TAGS_RE);
  if (!match) {
    console.warn(`⚠️  No handle.tags export found in ${absFile}`);
    return [];
  }
  const tagBlock = match[1] ?? "";
  const tags = Array.from(tagBlock.matchAll(STRING_RE))
    .map((m) => (m[1] ?? "").trim())
    .filter((tag) => tag.length > 0);
  return Array.from(new Set(tags));
};

function buildGuidesIndex() {
  console.log("buildGuidesIndex: start");
  const manifestEntries = listGuideManifestEntries();
  console.log(`manifest entries count: ${manifestEntries.length}`);
  console.log(`📦 Loaded ${manifestEntries.length} guide manifest entries`);
  const manifestMap = new Map<GuideKey, GuideManifestEntry>();
  for (const entry of manifestEntries) {
    manifestMap.set(entry.key as GuideKey, entry);
  }
  const statusMap = buildGuideStatusMap(manifestEntries);
  const publishedGroups = publishedGuideKeysByBase(isProdEnv, statusMap, manifestEntries);
  const orderedKeys = Array.from(
    new Set<GuideKey>([
      ...publishedGroups.experiences,
      ...publishedGroups.assistance,
      ...publishedGroups.howToGetHere,
    ]),
  );

  const rows = orderedKeys
    .map((key) => {
      const manifestEntry = manifestMap.get(key);
      const relPath = guideComponentPath(key);
      const abs = resolve(ROOT, "src", relPath.replace(/^src[\\/]/, ""));
      const section = ensureGuideSection(key, manifestEntry);
      const tags = extractTags(abs);
      const status = (statusMap[key] ?? "draft") as GuideStatus;
      return { key, tags, section, status };
    })
    .sort((a, b) => {
      if (a.section !== b.section) {
        return SECTION_SORT_WEIGHT[a.section] - SECTION_SORT_WEIGHT[b.section];
      }
      if (a.status !== b.status) {
        return GUIDE_STATUS_SORT_WEIGHT[a.status] - GUIDE_STATUS_SORT_WEIGHT[b.status];
      }
      return a.key.localeCompare(b.key);
    });

  console.log(`🧭 Indexed ${rows.length} guides for ${isProdEnv ? "production" : "preview"} mode`);
  return rows;
}

function writeGuidesIndex(rows: Array<{ key: GuideKey; tags: string[]; section: GuideSection; status: GuideStatus }>) {
  const helpSection = "help";
  const experiencesSection = "experiences";

  const content = `// src/data/guides.index.ts (generated)
import type { GuideKey } from "@/routes.guides-helpers";

export type GuideSection = "help" | "experiences";
export type GuideMeta = {
  key: GuideKey;
  tags: string[];
  section: GuideSection;
  status: "draft" | "review" | "published";
};

export const GUIDES_INDEX: GuideMeta[] = ${JSON.stringify(rows, null, 2)};

const HELP_GUIDE_SECTION = "${helpSection}" satisfies GuideSection;
const EXPERIENCES_GUIDE_SECTION = "${experiencesSection}" satisfies GuideSection;

export const HELP_GUIDES = Object.freeze(
  GUIDES_INDEX.filter((guide) => guide.section === HELP_GUIDE_SECTION),
) as ReadonlyArray<GuideMeta>;

export const EXPERIENCES_GUIDES = Object.freeze(
  GUIDES_INDEX.filter((guide) => guide.section === EXPERIENCES_GUIDE_SECTION),
) as ReadonlyArray<GuideMeta>;

export const EXPERIENCE_GUIDE_KEYS = Object.freeze(
  EXPERIENCES_GUIDES.map((guide) => guide.key),
) as ReadonlyArray<GuideKey>;

export const GUIDE_SECTION_BY_KEY = Object.freeze(
  Object.fromEntries(GUIDES_INDEX.map((guide) => [guide.key, guide.section])),
) as Readonly<Record<GuideKey, GuideSection>>;

export const TAGS_BY_KEY = Object.freeze(
  Object.fromEntries(GUIDES_INDEX.map((guide) => [guide.key, new Set(guide.tags)])),
) as Readonly<Record<GuideKey, ReadonlySet<string>>>;

export const GUIDE_STATUS_BY_KEY = Object.freeze(
  Object.fromEntries(GUIDES_INDEX.map((guide) => [guide.key, guide.status])),
) as Readonly<Record<GuideKey, "draft" | "review" | "published">>;
`;

  writeFileSync(GUIDES_INDEX_OUT_FILE, content);
  console.log(`Wrote ${GUIDES_INDEX_OUT_FILE} with ${rows.length} guides`);
}

function writeTagsIndex(
  rows: Array<{ key: GuideKey; tags: string[] }>,
) {
  const tagMap = new Map<string, Set<GuideKey>>();
  for (const { key, tags } of rows) {
    for (const tag of tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, new Set());
      }
      tagMap.get(tag)!.add(key);
    }
  }

  const objectMap = Object.fromEntries(
    Array.from(tagMap.entries()).map(([tag, keys]) => [tag, Array.from(keys).sort()]),
  );
  const summaries = Array.from(tagMap.entries())
    .map(([tag, keys]) => ({ tag, count: keys.size, keys: Array.from(keys).sort() }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const content = `// src/data/tags.index.ts (generated)
import type { GuideKey } from "@/routes.guides-helpers";

export type TagSummary = { tag: string; count: number; keys: GuideKey[] };

export const TAGS_TO_KEYS = ${JSON.stringify(objectMap, null, 2)} as Readonly<Record<string, ReadonlyArray<GuideKey>>>;

export const TAGS_SUMMARY = ${JSON.stringify(summaries, null, 2)} as ReadonlyArray<TagSummary>;
`;

  writeFileSync(TAGS_INDEX_OUT_FILE, content);
  console.log(`Wrote ${TAGS_INDEX_OUT_FILE} with ${summaries.length} tags`);
}

export function main() {
  console.log("main: start");
  const rows = buildGuidesIndex();
  if (rows.length === 0) {
    console.warn("⚠️  No guides discovered; skipping guides index generation");
    return;
  }
  writeGuidesIndex(rows);
  writeTagsIndex(rows);
}