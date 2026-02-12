/* eslint-disable security/detect-non-literal-fs-filename -- GS-001 [ttl=2026-12-31] Manifest helper intentionally reads locale JSON files selected by workspace-relative paths. */
import { createHash } from "node:crypto";
import {
  readFile,
  stat,
} from "node:fs/promises";
import path from "node:path";

import { listJsonFiles } from "@acme/guides-core";

export const TRANSLATION_DRIFT_SCHEMA_VERSION = 1 as const;

export type DriftManifestLocaleEntry = {
  hash: string | null;
};

export type DriftManifestEntry = {
  relativePath: string;
  sourceHash: string;
  locales: Record<string, DriftManifestLocaleEntry>;
};

export type TranslationDriftManifest = {
  schemaVersion: typeof TRANSLATION_DRIFT_SCHEMA_VERSION;
  generatedAt: string;
  baselineLocale: string;
  locales: string[];
  trackedPaths: string[];
  summary: {
    trackedFiles: number;
    missingLocaleFiles: number;
  };
  entries: DriftManifestEntry[];
};

export type BuildTranslationDriftManifestOptions = {
  localesRoot: string;
  baselineLocale: string;
  locales: readonly string[];
};

type DriftCheckStatus = "fresh" | "stale" | "missing";

export type DriftCheckEntry = {
  relativePath: string;
  locale: string;
  status: DriftCheckStatus;
  sourceChanged: boolean;
  localeChanged: boolean;
  previousSourceHash: string;
  currentSourceHash: string | null;
  previousLocaleHash: string | null;
  currentLocaleHash: string | null;
};

export type TranslationDriftCheckReport = {
  schemaVersion: typeof TRANSLATION_DRIFT_SCHEMA_VERSION;
  checkedAt: string;
  baselineLocale: string;
  locales: string[];
  manifestGeneratedAt: string;
  summary: {
    totalComparisons: number;
    staleLocales: number;
    missingLocales: number;
    newTrackedFilesSinceManifest: number;
  };
  stale: DriftCheckEntry[];
  missing: DriftCheckEntry[];
  fresh: DriftCheckEntry[];
  newTrackedFilesSinceManifest: string[];
};

export type CheckTranslationDriftManifestOptions = {
  manifest: TranslationDriftManifest;
  localesRoot: string;
};

const TRACKED_ROOT_JSON_FILES = new Set([
  "guides.json",
  "guides.tags.json",
  "guidesFallback.json",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (isRecord(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashJsonContent(raw: string): string {
  const parsed = JSON.parse(raw) as unknown;
  const canonical = stableStringify(parsed);
  return createHash("sha256").update(canonical).digest("hex");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}

async function getJsonHashOrNull(filePath: string): Promise<string | null> {
  if (!(await fileExists(filePath))) {
    return null;
  }

  const raw = await readFile(filePath, "utf8");
  return hashJsonContent(raw);
}

function isTrackedGuidePath(relativePath: string): boolean {
  if (TRACKED_ROOT_JSON_FILES.has(relativePath)) {
    return true;
  }

  if (!relativePath.startsWith("guides/")) {
    return false;
  }

  if (!relativePath.endsWith(".json")) {
    return false;
  }

  return true;
}

async function listTrackedGuidePaths(localeRoot: string): Promise<string[]> {
  const allJsonPaths = await listJsonFiles(localeRoot);
  return allJsonPaths.filter(isTrackedGuidePath).sort();
}

export async function buildTranslationDriftManifest(
  options: BuildTranslationDriftManifestOptions,
): Promise<TranslationDriftManifest> {
  const baselineLocaleRoot = path.join(options.localesRoot, options.baselineLocale);
  const trackedPaths = await listTrackedGuidePaths(baselineLocaleRoot);
  const entries: DriftManifestEntry[] = [];
  let missingLocaleFiles = 0;

  for (const relativePath of trackedPaths) {
    const sourcePath = path.join(baselineLocaleRoot, relativePath);
    const sourceHash = await getJsonHashOrNull(sourcePath);
    if (!sourceHash) {
      continue;
    }

    const localeHashes: Record<string, DriftManifestLocaleEntry> = {};
    for (const locale of options.locales) {
      const localePath = path.join(options.localesRoot, locale, relativePath);
      const localeHash = await getJsonHashOrNull(localePath);
      if (!localeHash) {
        missingLocaleFiles += 1;
      }
      localeHashes[locale] = { hash: localeHash };
    }

    entries.push({
      relativePath,
      sourceHash,
      locales: localeHashes,
    });
  }

  return {
    schemaVersion: TRANSLATION_DRIFT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    baselineLocale: options.baselineLocale,
    locales: [...options.locales],
    trackedPaths,
    summary: {
      trackedFiles: entries.length,
      missingLocaleFiles,
    },
    entries,
  };
}

export async function checkTranslationDriftManifest(
  options: CheckTranslationDriftManifestOptions,
): Promise<TranslationDriftCheckReport> {
  const manifest = options.manifest;
  const baselineLocaleRoot = path.join(options.localesRoot, manifest.baselineLocale);
  const currentTrackedPaths = await listTrackedGuidePaths(baselineLocaleRoot);
  const manifestPathSet = new Set(manifest.entries.map((entry) => entry.relativePath));
  const newTrackedFilesSinceManifest = currentTrackedPaths
    .filter((relativePath) => !manifestPathSet.has(relativePath))
    .sort();

  const stale: DriftCheckEntry[] = [];
  const missing: DriftCheckEntry[] = [];
  const fresh: DriftCheckEntry[] = [];

  for (const entry of manifest.entries) {
    const sourcePath = path.join(baselineLocaleRoot, entry.relativePath);
    const currentSourceHash = await getJsonHashOrNull(sourcePath);
    const sourceChanged = currentSourceHash !== entry.sourceHash;

    for (const locale of manifest.locales) {
      const previousLocaleHash = entry.locales[locale]?.hash ?? null;
      const localePath = path.join(options.localesRoot, locale, entry.relativePath);
      const currentLocaleHash = await getJsonHashOrNull(localePath);
      const localeChanged = currentLocaleHash !== previousLocaleHash;
      const status: DriftCheckStatus =
        currentLocaleHash === null
          ? "missing"
          : sourceChanged && !localeChanged
            ? "stale"
            : "fresh";

      const result: DriftCheckEntry = {
        relativePath: entry.relativePath,
        locale,
        status,
        sourceChanged,
        localeChanged,
        previousSourceHash: entry.sourceHash,
        currentSourceHash,
        previousLocaleHash,
        currentLocaleHash,
      };

      if (status === "stale") {
        stale.push(result);
      } else if (status === "missing") {
        missing.push(result);
      } else {
        fresh.push(result);
      }
    }
  }

  return {
    schemaVersion: TRANSLATION_DRIFT_SCHEMA_VERSION,
    checkedAt: new Date().toISOString(),
    baselineLocale: manifest.baselineLocale,
    locales: [...manifest.locales],
    manifestGeneratedAt: manifest.generatedAt,
    summary: {
      totalComparisons: stale.length + missing.length + fresh.length,
      staleLocales: stale.length,
      missingLocales: missing.length,
      newTrackedFilesSinceManifest: newTrackedFilesSinceManifest.length,
    },
    stale,
    missing,
    fresh,
    newTrackedFilesSinceManifest,
  };
}
