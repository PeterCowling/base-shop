/* eslint-disable security/detect-non-literal-fs-filename -- GS-001 [ttl=2026-12-31] Migration helper intentionally reads/writes locale JSON files selected by explicit CLI scope. */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { guideContentSchema } from "@acme/guide-system";
import { listJsonFiles } from "@acme/guides-core";

export const GUIDE_CONTENT_MIGRATION_REPORT_SCHEMA_VERSION = 1 as const;

const CONTENT_RELATIVE_DIR = path.join("guides", "content");

type JsonRecord = Record<string, unknown>;

export type GuideContentMigration = {
  id: string;
  fromVersion: number;
  toVersion: number;
  migrate: (content: JsonRecord) => JsonRecord;
};

export type GuideContentMigrationFileStatus =
  | "would-update"
  | "updated"
  | "unchanged"
  | "skipped-version"
  | "failed";

export type GuideContentMigrationFileResult = {
  locale: string;
  relativePath: string;
  status: GuideContentMigrationFileStatus;
  beforeVersion: number | null;
  afterVersion: number | null;
  migrationIds: string[];
  error?: string;
};

export type GuideContentMigrationReport = {
  schemaVersion: typeof GUIDE_CONTENT_MIGRATION_REPORT_SCHEMA_VERSION;
  generatedAt: string;
  dryRun: boolean;
  fromVersion: number;
  toVersion: number;
  locales: string[];
  summary: {
    filesScanned: number;
    filesTouched: number;
    filesUnchanged: number;
    filesSkipped: number;
    filesFailed: number;
  };
  versionCountsBefore: Record<string, number>;
  versionCountsAfter: Record<string, number>;
  files: GuideContentMigrationFileResult[];
};

export type RunGuideContentMigrationsOptions = {
  localesRoot: string;
  locales: readonly string[];
  guides?: readonly string[];
  fromVersion: number;
  toVersion: number;
  dryRun?: boolean;
};

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function countVersion(
  counts: Record<string, number>,
  version: number | null,
): void {
  const key = version === null ? "null" : String(version);
  counts[key] = (counts[key] ?? 0) + 1;
}

function normalizeGuideFileName(guideKey: string): string {
  return guideKey.endsWith(".json") ? guideKey : `${guideKey}.json`;
}

function detectContentSchemaVersion(content: unknown): number {
  if (!isRecord(content)) {
    throw new Error("Guide content JSON must be an object.");
  }

  const value = content.schemaVersion;
  if (value === undefined) {
    return 1;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid schemaVersion "${String(value)}" (expected positive integer).`);
  }

  return value;
}

function formatGuideSchemaError(error: ReturnType<typeof guideContentSchema.safeParse>): string {
  if (error.success) {
    return "unknown schema validation error";
  }

  const first = error.error.issues[0];
  if (!first) {
    return "unknown schema validation error";
  }

  const pathLabel =
    first.path.length > 0
      ? first.path.map((segment) => String(segment)).join(".")
      : "<root>";
  return `${pathLabel}: ${first.message}`;
}

const guideContentMigrations: readonly GuideContentMigration[] = [
  {
    id: "guide-content-v1-to-v2",
    fromVersion: 1,
    toVersion: 2,
    migrate(content) {
      return {
        ...content,
        schemaVersion: 2,
      };
    },
  },
];

export function resolveGuideContentMigrationPath(
  fromVersion: number,
  toVersion: number,
): GuideContentMigration[] {
  if (!Number.isInteger(fromVersion) || fromVersion <= 0) {
    throw new Error(`Invalid --from version "${String(fromVersion)}" (expected positive integer).`);
  }
  if (!Number.isInteger(toVersion) || toVersion <= 0) {
    throw new Error(`Invalid --to version "${String(toVersion)}" (expected positive integer).`);
  }
  if (fromVersion > toVersion) {
    throw new Error(
      `Downgrade migrations are not supported (from ${fromVersion} to ${toVersion}).`,
    );
  }
  if (fromVersion === toVersion) {
    return [];
  }

  const pathMigrations: GuideContentMigration[] = [];
  const visited = new Set<number>([fromVersion]);
  let currentVersion = fromVersion;

  while (currentVersion < toVersion) {
    const next = guideContentMigrations.find(
      (migration) => migration.fromVersion === currentVersion,
    );
    if (!next) {
      throw new Error(
        `Unsupported migration path: missing transform from v${currentVersion} toward v${toVersion}.`,
      );
    }
    if (next.toVersion <= currentVersion || visited.has(next.toVersion)) {
      throw new Error(`Invalid migration registry around ${next.id}.`);
    }

    pathMigrations.push(next);
    currentVersion = next.toVersion;
    visited.add(currentVersion);
  }

  if (currentVersion !== toVersion) {
    throw new Error(
      `Unsupported migration path: reached v${currentVersion} but requested v${toVersion}.`,
    );
  }

  return pathMigrations;
}

export function applyGuideContentMigrations(
  content: unknown,
  options: {
    fromVersion: number;
    toVersion: number;
  },
): {
  content: JsonRecord;
  appliedMigrationIds: string[];
  finalVersion: number;
} {
  if (!isRecord(content)) {
    throw new Error("Guide content JSON must be an object.");
  }

  const migrations = resolveGuideContentMigrationPath(
    options.fromVersion,
    options.toVersion,
  );
  let current: JsonRecord = { ...content };

  for (const migration of migrations) {
    current = migration.migrate(current);
  }

  const parsed = guideContentSchema.safeParse(current);
  if (!parsed.success) {
    throw new Error(`guideContentSchema validation failed: ${formatGuideSchemaError(parsed)}`);
  }

  const finalVersion =
    migrations.length > 0 ? migrations[migrations.length - 1].toVersion : options.toVersion;
  return {
    content: current,
    appliedMigrationIds: migrations.map((migration) => migration.id),
    finalVersion,
  };
}

async function listLocaleGuideContentFiles(
  localeRoot: string,
  guides?: readonly string[],
): Promise<string[]> {
  const allFiles = await listJsonFiles(localeRoot, CONTENT_RELATIVE_DIR);
  if (!guides || guides.length === 0) {
    return allFiles.sort();
  }

  const allowedNames = new Set(guides.map(normalizeGuideFileName));
  return allFiles
    .filter((relativePath) => allowedNames.has(path.basename(relativePath)))
    .sort();
}

function toOutputJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function runGuideContentMigrations(
  options: RunGuideContentMigrationsOptions,
): Promise<GuideContentMigrationReport> {
  const dryRun = options.dryRun ?? false;
  const files: GuideContentMigrationFileResult[] = [];
  const versionCountsBefore: Record<string, number> = {};
  const versionCountsAfter: Record<string, number> = {};

  // Validate path up front so unsupported migrations fail early and explicitly.
  const migrationPath = resolveGuideContentMigrationPath(
    options.fromVersion,
    options.toVersion,
  );
  const migrationIds = migrationPath.map((migration) => migration.id);

  for (const locale of options.locales) {
    const localeRoot = path.join(options.localesRoot, locale);
    const relativePaths = await listLocaleGuideContentFiles(
      localeRoot,
      options.guides,
    );

    for (const relativePath of relativePaths) {
      const absolutePath = path.join(localeRoot, relativePath);
      let content: unknown;
      let detectedVersion: number;

      try {
        const raw = await readFile(absolutePath, "utf8");
        content = JSON.parse(raw) as unknown;
        detectedVersion = detectContentSchemaVersion(content);
      } catch (error) {
        files.push({
          locale,
          relativePath,
          status: "failed",
          beforeVersion: null,
          afterVersion: null,
          migrationIds,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      countVersion(versionCountsBefore, detectedVersion);

      if (detectedVersion === options.toVersion) {
        countVersion(versionCountsAfter, detectedVersion);
        files.push({
          locale,
          relativePath,
          status: "unchanged",
          beforeVersion: detectedVersion,
          afterVersion: detectedVersion,
          migrationIds,
        });
        continue;
      }

      if (detectedVersion !== options.fromVersion) {
        countVersion(versionCountsAfter, detectedVersion);
        files.push({
          locale,
          relativePath,
          status: "skipped-version",
          beforeVersion: detectedVersion,
          afterVersion: detectedVersion,
          migrationIds,
          error: `File schemaVersion is ${detectedVersion}; expected ${options.fromVersion} for this run.`,
        });
        continue;
      }

      try {
        const migrated = applyGuideContentMigrations(content, {
          fromVersion: options.fromVersion,
          toVersion: options.toVersion,
        });
        countVersion(versionCountsAfter, migrated.finalVersion);

        if (!dryRun) {
          await writeFile(absolutePath, toOutputJson(migrated.content), "utf8");
        }

        files.push({
          locale,
          relativePath,
          status: dryRun ? "would-update" : "updated",
          beforeVersion: detectedVersion,
          afterVersion: migrated.finalVersion,
          migrationIds: migrated.appliedMigrationIds,
        });
      } catch (error) {
        countVersion(versionCountsAfter, detectedVersion);
        files.push({
          locale,
          relativePath,
          status: "failed",
          beforeVersion: detectedVersion,
          afterVersion: detectedVersion,
          migrationIds,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return {
    schemaVersion: GUIDE_CONTENT_MIGRATION_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    dryRun,
    fromVersion: options.fromVersion,
    toVersion: options.toVersion,
    locales: [...options.locales],
    summary: {
      filesScanned: files.length,
      filesTouched: files.filter(
        (file) => file.status === "would-update" || file.status === "updated",
      ).length,
      filesUnchanged: files.filter((file) => file.status === "unchanged").length,
      filesSkipped: files.filter((file) => file.status === "skipped-version").length,
      filesFailed: files.filter((file) => file.status === "failed").length,
    },
    versionCountsBefore,
    versionCountsAfter,
    files,
  };
}
