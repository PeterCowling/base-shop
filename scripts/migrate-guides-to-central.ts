import { existsSync } from "node:fs";
import {
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import { ulid } from "ulid";

import {
  guideContentSchema,
  type GuidePublication,
} from "../packages/types/src/Guide";

type GuideStatus = "draft" | "review" | "live" | "published";

type ManifestEntry = {
  key: string;
  slug: string;
  contentKey: string;
  status?: GuideStatus;
  areas?: string[];
  primaryArea?: string;
  template?: string;
  focusKeyword?: string;
  primaryQuery?: string;
  blocks?: unknown[];
  relatedGuides?: string[];
  structuredData?: unknown[];
  options?: Record<string, unknown>;
  timeSensitive?: boolean;
};

type ManifestOverride = {
  areas?: string[];
  primaryArea?: string;
  status?: GuideStatus;
};

type ManifestOverrides = Record<string, ManifestOverride>;

type MigrationOptions = {
  shop?: string;
  sourceRoot?: string;
  targetRoot?: string;
  dryRun?: boolean;
  manifestEntries?: ManifestEntry[];
  overrides?: ManifestOverrides;
  locales?: string[];
  timestamp?: string;
  logger?: (message: string) => void;
};

type MissingContent = {
  key: string;
  locale: string;
  sourcePath: string;
};

type ValidationFailure = {
  key: string;
  locale: string;
  sourcePath: string;
  error: string;
};

export type MigrationSummary = {
  shop: string;
  dryRun: boolean;
  totalGuides: number;
  locales: string[];
  metadataPath: string;
  contentWrites: number;
  missingContent: MissingContent[];
  validationFailures: ValidationFailure[];
  localesPerGuide: Record<string, number>;
};

const DEFAULT_SOURCE_ROOT = path.resolve(process.cwd(), "apps/brikette/src");
const DEFAULT_TARGET_ROOT = path.resolve(process.cwd(), "data/shops");

export function mapGuideStatus(status: GuideStatus | undefined): "draft" | "review" | "published" {
  if (status === "live" || status === "published") {
    return "published";
  }
  if (status === "review") {
    return "review";
  }
  return "draft";
}

export function applyManifestOverride(
  entry: ManifestEntry,
  overrides: ManifestOverrides,
): ManifestEntry {
  const override = overrides[entry.key];
  if (!override) {
    return entry;
  }

  const nextAreas = override.areas ?? entry.areas ?? [];
  const nextPrimaryArea = override.primaryArea ?? entry.primaryArea ?? nextAreas[0] ?? "help";

  return {
    ...entry,
    areas: nextAreas,
    primaryArea: nextPrimaryArea,
    status: override.status ?? entry.status,
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function resolveLocales(sourceRoot: string): Promise<string[]> {
  const localesDir = path.join(sourceRoot, "locales");
  const entries = await readdir(localesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_"))
    .filter((name) =>
      existsSync(path.join(localesDir, name, "guides", "content")),
    )
    .sort();
}

async function loadOverrides(sourceRoot: string): Promise<ManifestOverrides> {
  const overridesPath = path.join(
    sourceRoot,
    "data",
    "guides",
    "guide-manifest-overrides.json",
  );
  if (!existsSync(overridesPath)) {
    return {};
  }
  try {
    return await readJson<ManifestOverrides>(overridesPath);
  } catch {
    return {};
  }
}

async function loadManifestEntries(sourceRoot: string): Promise<ManifestEntry[]> {
  const manifestModulePath = path.join(
    sourceRoot,
    "routes",
    "guides",
    "guide-manifest.ts",
  );

  if (existsSync(manifestModulePath)) {
    try {
      const manifestModule = (await import(
        pathToFileURL(manifestModulePath).href
      )) as {
        listGuideManifestEntries?: () => ManifestEntry[];
      };
      if (typeof manifestModule.listGuideManifestEntries === "function") {
        return manifestModule.listGuideManifestEntries();
      }
    } catch {
      // Fallback to the snapshot if tsx cannot resolve app-level aliases.
    }
  }

  const snapshotPath = path.join(
    sourceRoot,
    "data",
    "guides",
    "guide-manifest-snapshot.json",
  );
  const snapshot = await readJson<{
    entries: ManifestEntry[];
  }>(snapshotPath);
  return snapshot.entries;
}

async function readExistingMetadata(
  metadataPath: string,
): Promise<Map<string, GuidePublication>> {
  if (!existsSync(metadataPath)) {
    return new Map();
  }
  const existing = await readJson<GuidePublication[]>(metadataPath);
  return new Map(existing.map((guide) => [guide.key, guide]));
}

function toGuidePublication(
  entry: ManifestEntry,
  shop: string,
  timestamp: string,
  existing: GuidePublication | undefined,
): GuidePublication {
  const areas = entry.areas ?? [];
  const primaryArea = entry.primaryArea ?? areas[0] ?? "help";

  return {
    id: existing?.id ?? ulid(),
    shop,
    key: entry.key,
    slug: entry.slug,
    contentKey: entry.contentKey,
    status: mapGuideStatus(entry.status),
    areas,
    primaryArea,
    template: entry.template,
    focusKeyword: entry.focusKeyword,
    primaryQuery: entry.primaryQuery,
    blocks: entry.blocks ?? [],
    relatedGuides: entry.relatedGuides ?? [],
    structuredData: entry.structuredData ?? [],
    options: entry.options,
    riskTier: existing?.riskTier ?? 0,
    schemaVersion: existing?.schemaVersion ?? 1,
    row_version: existing?.row_version ?? 1,
    created_at: existing?.created_at ?? timestamp,
    updated_at: existing?.updated_at ?? timestamp,
    lastValidated: existing?.lastValidated,
    timeSensitive: entry.timeSensitive ?? existing?.timeSensitive,
  };
}

export async function migrateGuidesToCentral(
  options: MigrationOptions = {},
): Promise<MigrationSummary> {
  const shop = options.shop ?? "brikette";
  const sourceRoot = options.sourceRoot ?? DEFAULT_SOURCE_ROOT;
  const targetRoot = options.targetRoot ?? DEFAULT_TARGET_ROOT;
  const dryRun = options.dryRun ?? false;
  const timestamp = options.timestamp ?? new Date().toISOString();
  const log = options.logger ?? console.log;

  const entries = options.manifestEntries ?? (await loadManifestEntries(sourceRoot));
  const overrides = options.overrides ?? (await loadOverrides(sourceRoot));
  const locales = options.locales ?? (await resolveLocales(sourceRoot));

  const shopRoot = path.join(targetRoot, shop);
  const metadataPath = path.join(shopRoot, "guides.json");
  const existingByKey = await readExistingMetadata(metadataPath);

  const missingContent: MissingContent[] = [];
  const validationFailures: ValidationFailure[] = [];
  const localesPerGuide: Record<string, number> = {};
  const migratedGuides: GuidePublication[] = [];

  let contentWrites = 0;

  for (const rawEntry of entries) {
    const entry = applyManifestOverride(rawEntry, overrides);
    const existing = existingByKey.get(entry.key);
    const publication = toGuidePublication(entry, shop, timestamp, existing);
    migratedGuides.push(publication);

    let localeCount = 0;
    for (const locale of locales) {
      const sourcePath = path.join(
        sourceRoot,
        "locales",
        locale,
        "guides",
        "content",
        `${entry.contentKey}.json`,
      );

      if (!existsSync(sourcePath)) {
        missingContent.push({ key: entry.key, locale, sourcePath });
        continue;
      }

      let payload: unknown;
      try {
        payload = await readJson<unknown>(sourcePath);
      } catch (error) {
        validationFailures.push({
          key: entry.key,
          locale,
          sourcePath,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      const validation = guideContentSchema.safeParse(payload);
      if (!validation.success) {
        validationFailures.push({
          key: entry.key,
          locale,
          sourcePath,
          error: validation.error.message,
        });
        continue;
      }

      const targetPath = path.join(
        shopRoot,
        "guides",
        "content",
        entry.key,
        `${locale}.json`,
      );

      localeCount += 1;
      contentWrites += 1;

      if (!dryRun) {
        // Preserve source payload exactly (including nested passthrough keys and
        // non-normalized strings) while still enforcing schema validity.
        await writeJson(targetPath, payload);
      }
    }

    localesPerGuide[entry.key] = localeCount;
  }

  migratedGuides.sort((a, b) => a.key.localeCompare(b.key));
  if (!dryRun) {
    await writeJson(metadataPath, migratedGuides);
  }

  const summary: MigrationSummary = {
    shop,
    dryRun,
    totalGuides: migratedGuides.length,
    locales,
    metadataPath,
    contentWrites,
    missingContent,
    validationFailures,
    localesPerGuide,
  };

  log(
    [
      dryRun ? "[dry-run] guide migration summary" : "guide migration summary",
      `guides=${summary.totalGuides}`,
      `locales=${summary.locales.length}`,
      `contentWrites=${summary.contentWrites}`,
      `missingContent=${summary.missingContent.length}`,
      `validationFailures=${summary.validationFailures.length}`,
    ].join(" | "),
  );

  return summary;
}

function parseCliArgs(argv: string[]): MigrationOptions {
  const options: MigrationOptions = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg.startsWith("--shop=")) {
      options.shop = arg.slice("--shop=".length);
      continue;
    }
    if (arg.startsWith("--source-root=")) {
      options.sourceRoot = path.resolve(arg.slice("--source-root=".length));
      continue;
    }
    if (arg.startsWith("--target-root=")) {
      options.targetRoot = path.resolve(arg.slice("--target-root=".length));
      continue;
    }
    throw new Error(
      `Unknown argument: ${arg}. Supported: --dry-run, --shop=<id>, --source-root=<path>, --target-root=<path>`,
    );
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const summary = await migrateGuidesToCentral(options);

  if (summary.validationFailures.length > 0) {
    process.exitCode = 1;
  }
}

function isDirectExecution(): boolean {
  const scriptArg = process.argv[1];
  if (!scriptArg) {
    return false;
  }
  const resolvedArg = path.resolve(scriptArg);
  return (
    resolvedArg === path.resolve(process.cwd(), "scripts/migrate-guides-to-central.ts") ||
    resolvedArg === path.resolve(process.cwd(), "scripts/migrate-guides-to-central.js")
  );
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
