/**
 * Node-only loader/writer for guide manifest overrides.
 *
 * This module provides filesystem operations for reading and writing manifest
 * overrides. It is only safe to import in Node.js (server-side) contexts.
 *
 * Key behaviors:
 * - Scoped path resolution prevents directory traversal attacks
 * - Atomic writes (temp file + rename) prevent corruption
 * - Missing file is gracefully handled (returns empty record)
 * - Backup file is created before each write for easy rollback
 */

/*
 * ESLint security plugin flags any non-literal file path passed to `fs.*` APIs.
 * Every path in this module is routed through `createScopedPathResolver`, which
 * guarantees that operations stay within the expected data directory and
 * throws if traversal is attempted.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- scoped path resolver guards fs usage */

import fs from "fs";
import path from "path";

import type { GuideKey } from "../../guides/slugs/keys";

import type { ManifestOverride, ManifestOverrides } from "./guide-manifest-overrides";
import { safeParseManifestOverrides } from "./guide-manifest-overrides";

/**
 * Creates a scoped path resolver that ensures all paths stay within a base directory.
 * Throws if traversal is attempted (e.g., via `../`).
 */
function createScopedPathResolver(baseDir: string) {
  const resolvedBase = path.resolve(baseDir);

  return (...segments: string[]): string => {
    const candidate = path.resolve(resolvedBase, ...segments);
    if (candidate === resolvedBase) return candidate;

    const withSeparator = `${resolvedBase}${path.sep}`;
    if (!candidate.startsWith(withSeparator)) {
      throw new Error(`Refusing to access path outside of ${resolvedBase}`);
    }

    return candidate;
  };
}

/**
 * Resolves the data directory root, checking common monorepo paths.
 */
function resolveDataRoot(cwd: string): string {
  const fallback = path.resolve(cwd, "src/data");
  const candidates = [
    fallback,
    path.resolve(cwd, "apps/brikette/src/data"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }

  return fallback;
}

const OVERRIDES_FILE = "guides/guide-manifest-overrides.json";
const BACKUP_FILE = "guides/guide-manifest-overrides.json.bak";

/**
 * Loads manifest overrides from the filesystem.
 * Returns an empty record if the file doesn't exist or is invalid.
 */
export function loadGuideManifestOverridesFromFs(
  cwd = process.cwd(),
): ManifestOverrides {
  const dataRoot = resolveDataRoot(cwd);
  const resolveScopedPath = createScopedPathResolver(dataRoot);
  const filePath = resolveScopedPath(OVERRIDES_FILE);

  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const data = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(data);
    const result = safeParseManifestOverrides(parsed);

    if (result.success) {
      return result.data as ManifestOverrides;
    }

    // Log validation error but return empty to avoid breaking the app
    console.warn(
      "[guide-manifest-overrides] Invalid overrides file, using empty defaults:",
      result.error.format(),
    );
    return {};
  } catch (err) {
    // File doesn't exist or can't be read - return empty
    if (err instanceof SyntaxError) {
      console.warn("[guide-manifest-overrides] Malformed JSON, using empty defaults");
    }
    return {};
  }
}

/**
 * Writes manifest overrides to the filesystem atomically.
 * Creates a backup of the existing file before writing.
 *
 * @throws Error if validation fails or write fails
 */
export function writeGuideManifestOverridesToFs(
  overrides: ManifestOverrides,
  cwd = process.cwd(),
): void {
  const dataRoot = resolveDataRoot(cwd);
  const resolveScopedPath = createScopedPathResolver(dataRoot);
  const filePath = resolveScopedPath(OVERRIDES_FILE);
  const backupPath = resolveScopedPath(BACKUP_FILE);
  const tempPath = `${filePath}.tmp`;

  // Validate before writing
  const result = safeParseManifestOverrides(overrides);
  if (!result.success) {
    throw new Error(`Invalid overrides: ${result.error.message}`);
  }

  // Ensure directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  // Create backup if file exists
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  // Atomic write: write to temp, then rename
  const json = JSON.stringify(overrides, null, 2);
  fs.writeFileSync(tempPath, `${json}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

/**
 * Gets the override for a specific guide key.
 * Returns undefined if no override exists.
 */
export function getGuideManifestOverrideFromFs(
  guideKey: GuideKey,
  cwd = process.cwd(),
): ManifestOverride | undefined {
  const overrides = loadGuideManifestOverridesFromFs(cwd);
  return overrides[guideKey];
}

/**
 * Sets the override for a specific guide key.
 * Pass undefined to remove the override.
 */
export function setGuideManifestOverrideToFs(
  guideKey: GuideKey,
  override: ManifestOverride | undefined,
  cwd = process.cwd(),
): void {
  const overrides = loadGuideManifestOverridesFromFs(cwd);

  if (override === undefined) {
    delete overrides[guideKey];
  } else {
    overrides[guideKey] = override;
  }

  writeGuideManifestOverridesToFs(overrides, cwd);
}

/**
 * Gets a manifest entry merged with FS-loaded overrides.
 * Server-side only: reads overrides from filesystem.
 */
export function getMergedGuideManifestEntryFromFs(
  guideKey: GuideKey,
  cwd = process.cwd(),
) {
  // Import dynamically to avoid circular dependency issues
   
  const { getGuideManifestEntryWithOverrides } = require("./guide-manifest") as typeof import("./guide-manifest");
  const overrides = loadGuideManifestOverridesFromFs(cwd);
  return getGuideManifestEntryWithOverrides(guideKey, overrides);
}

/**
 * Lists all manifest entries merged with FS-loaded overrides.
 * Server-side only: reads overrides from filesystem.
 */
export function listMergedGuideManifestEntriesFromFs(cwd = process.cwd()) {
   
  const { listGuideManifestEntriesWithOverrides } = require("./guide-manifest") as typeof import("./guide-manifest");
  const overrides = loadGuideManifestOverridesFromFs(cwd);
  return listGuideManifestEntriesWithOverrides(overrides);
}

/* eslint-enable security/detect-non-literal-fs-filename */
