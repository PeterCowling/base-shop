import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { INTERNAL_SEGMENT_BY_KEY, TOP_LEVEL_SEGMENT_KEYS } from "@/routing/sectionSegments";
import { getSlug } from "@/utils/slug";

type PathPair = {
  sourceBasePath: string;
  targetBasePath: string;
};

type PathType = "missing" | "file" | "directory" | "other";

const BASE_FILE_SUFFIXES = [".html", ".txt", ".json", ".rsc"] as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT_DIR = path.join(APP_ROOT, "out");

function trimLeadingSlash(routePath: string): string {
  return routePath.replace(/^\/+/, "");
}

function parseOutDirArg(): string {
  const outDirArgPrefix = "--out-dir=";
  const outDirArg = process.argv.find((arg) => arg.startsWith(outDirArgPrefix));
  if (!outDirArg) return DEFAULT_OUT_DIR;
  return path.resolve(outDirArg.slice(outDirArgPrefix.length));
}

async function getPathType(targetPath: string): Promise<PathType> {
  try {
    const stats = await stat(targetPath);
    if (stats.isDirectory()) return "directory";
    if (stats.isFile()) return "file";
    return "other";
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return "missing";
    }
    throw error;
  }
}

async function removeIfEmpty(directoryPath: string): Promise<void> {
  const type = await getPathType(directoryPath);
  if (type !== "directory") return;

  const entries = await readdir(directoryPath);
  if (entries.length === 0) {
    await rm(directoryPath, { recursive: true, force: true });
  }
}

async function mergeDirectory(sourceDirectoryPath: string, targetDirectoryPath: string): Promise<void> {
  const sourceType = await getPathType(sourceDirectoryPath);
  if (sourceType !== "directory") return;

  const targetType = await getPathType(targetDirectoryPath);
  if (targetType === "missing") {
    await mkdir(path.dirname(targetDirectoryPath), { recursive: true });
    await rename(sourceDirectoryPath, targetDirectoryPath);
    return;
  }

  if (targetType !== "directory") {
    throw new Error(
      `Cannot merge "${sourceDirectoryPath}" into "${targetDirectoryPath}" because target is not a directory.`,
    );
  }

  const sourceEntries = await readdir(sourceDirectoryPath, { withFileTypes: true });
  for (const entry of sourceEntries) {
    const sourceChildPath = path.join(sourceDirectoryPath, entry.name);
    const targetChildPath = path.join(targetDirectoryPath, entry.name);

    if (entry.isDirectory()) {
      await mergeDirectory(sourceChildPath, targetChildPath);
      continue;
    }

    if (!entry.isFile()) continue;

    const targetChildType = await getPathType(targetChildPath);
    if (targetChildType === "missing") {
      await mkdir(path.dirname(targetChildPath), { recursive: true });
      await rename(sourceChildPath, targetChildPath);
      continue;
    }

    // Keep localized-target files on conflict; drop internal-source duplicate.
    await rm(sourceChildPath, { force: true });
  }

  await removeIfEmpty(sourceDirectoryPath);
}

async function normalizeBasePathPair(
  outDir: string,
  pair: PathPair,
): Promise<{ moved: number; removed: number }> {
  const sourceBasePath = path.join(outDir, trimLeadingSlash(pair.sourceBasePath));
  const targetBasePath = path.join(outDir, trimLeadingSlash(pair.targetBasePath));

  let moved = 0;
  let removed = 0;

  for (const suffix of BASE_FILE_SUFFIXES) {
    const sourceFilePath = `${sourceBasePath}${suffix}`;
    const targetFilePath = `${targetBasePath}${suffix}`;
    const sourceType = await getPathType(sourceFilePath);
    if (sourceType !== "file") continue;

    const targetType = await getPathType(targetFilePath);
    if (targetType === "missing") {
      await mkdir(path.dirname(targetFilePath), { recursive: true });
      await rename(sourceFilePath, targetFilePath);
      moved += 1;
      continue;
    }

    await rm(sourceFilePath, { force: true });
    removed += 1;
  }

  const sourceDirectoryType = await getPathType(sourceBasePath);
  if (sourceDirectoryType === "directory") {
    await mergeDirectory(sourceBasePath, targetBasePath);
    const sourceAfterMergeType = await getPathType(sourceBasePath);
    if (sourceAfterMergeType === "directory") {
      const sourceEntries = await readdir(sourceBasePath);
      if (sourceEntries.length === 0) {
        await rm(sourceBasePath, { recursive: true, force: true });
      }
    }
    moved += 1;
  }

  return { moved, removed };
}

function buildNormalizationPairs(
  languages: readonly AppLanguage[] = i18nConfig.supportedLngs as AppLanguage[],
): PathPair[] {
  const pairs: PathPair[] = [];
  const seen = new Set<string>();

  const addPair = (sourceBasePath: string, targetBasePath: string): void => {
    if (sourceBasePath === targetBasePath) return;
    const key = `${sourceBasePath}->${targetBasePath}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ sourceBasePath, targetBasePath });
  };

  for (const lang of languages) {
    for (const key of TOP_LEVEL_SEGMENT_KEYS) {
      const sourceBasePath = `/${lang}/${INTERNAL_SEGMENT_BY_KEY[key]}`;
      const targetBasePath = `/${lang}/${getSlug(key, lang)}`;
      addPair(sourceBasePath, targetBasePath);
    }
  }

  for (const lang of languages) {
    const sourceBasePath = `/${lang}/${INTERNAL_SEGMENT_BY_KEY.experiences}/${INTERNAL_SEGMENT_BY_KEY.guidesTags}`;
    const targetBasePath = `/${lang}/${getSlug("experiences", lang)}/${getSlug("guidesTags", lang)}`;
    addPair(sourceBasePath, targetBasePath);
  }

  for (const lang of languages) {
    // Legacy aliases emitted by explicit route folders; normalize to localized contract.
    addPair(`/${lang}/help`, `/${lang}/${getSlug("assistance", lang)}`);
    addPair(`/${lang}/book-dorm-bed`, `/${lang}/${getSlug("book", lang)}`);
  }

  // Process deeper paths first (e.g. /:lang/experiences/tags before /:lang/experiences).
  return pairs.sort((a, b) => b.sourceBasePath.split("/").length - a.sourceBasePath.split("/").length);
}

async function main(): Promise<void> {
  const outDir = parseOutDirArg();
  const outDirType = await getPathType(outDir);

  if (outDirType === "missing") {
    console.log(`Skipped localized route normalization: "${outDir}" does not exist.`);
    return;
  }
  if (outDirType !== "directory") {
    throw new Error(`Expected output directory at "${outDir}", got ${outDirType}.`);
  }

  const pairs = buildNormalizationPairs();
  let moved = 0;
  let removed = 0;

  for (const pair of pairs) {
    const result = await normalizeBasePathPair(outDir, pair);
    moved += result.moved;
    removed += result.removed;
  }

  console.log(
    `Localized route normalization complete for ${outDir}. Processed ${pairs.length} mappings, moved ${moved} path groups, removed ${removed} duplicate files.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
