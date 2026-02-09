/**
 * Filesystem operations for guide manifest overrides.
 *
 * Adapted from apps/brikette/src/routes/guides/guide-manifest-overrides.node.ts
 * with configurable paths for cross-app usage.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001: scoped path resolver guards fs usage */
import fs from "fs";
import path from "path";

import {
  type ManifestOverride,
  type ManifestOverrides,
  safeParseManifestOverrides,
} from "@acme/guide-system";

import { getDataDir } from "./config";

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

const OVERRIDES_FILE = "guides/guide-manifest-overrides.json";
const BACKUP_FILE = "guides/guide-manifest-overrides.json.bak";

export function loadGuideManifestOverridesFromFs(): ManifestOverrides {
  const dataRoot = getDataDir();
  const resolveScopedPath = createScopedPathResolver(dataRoot);
  const filePath = resolveScopedPath(OVERRIDES_FILE);

  try {
    if (!fs.existsSync(filePath)) return {};
    const data = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(data);
    const result = safeParseManifestOverrides(parsed);
    if (result.success) return result.data as ManifestOverrides;
    console.warn("[guide-manifest-overrides] Invalid overrides file, using empty defaults");
    return {};
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn("[guide-manifest-overrides] Malformed JSON, using empty defaults");
    }
    return {};
  }
}

export function writeGuideManifestOverridesToFs(overrides: ManifestOverrides): void {
  const dataRoot = getDataDir();
  const resolveScopedPath = createScopedPathResolver(dataRoot);
  const filePath = resolveScopedPath(OVERRIDES_FILE);
  const backupPath = resolveScopedPath(BACKUP_FILE);
  const tempPath = `${filePath}.tmp`;

  const result = safeParseManifestOverrides(overrides);
  if (!result.success) {
    throw new Error(`Invalid overrides: ${result.error.message}`);
  }

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  const json = JSON.stringify(overrides, null, 2);
  fs.writeFileSync(tempPath, `${json}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

export function getGuideManifestOverrideFromFs(guideKey: string): ManifestOverride | undefined {
  const overrides = loadGuideManifestOverridesFromFs();
  return overrides[guideKey];
}

export function setGuideManifestOverrideToFs(
  guideKey: string,
  override: ManifestOverride | undefined,
): void {
  const overrides = loadGuideManifestOverridesFromFs();
  if (override === undefined) {
    delete overrides[guideKey];
  } else {
    overrides[guideKey] = override;
  }
  writeGuideManifestOverridesToFs(overrides);
}
/* eslint-enable security/detect-non-literal-fs-filename -- GS-001 */
