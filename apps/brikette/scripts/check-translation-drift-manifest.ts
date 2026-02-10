#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001 [ttl=2026-12-31] CLI script reads workspace-local manifest/report paths supplied by operator. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  checkTranslationDriftManifest,
  TRANSLATION_DRIFT_SCHEMA_VERSION,
  type TranslationDriftManifest,
} from "./lib/translation-drift-manifest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

type CliOptions = {
  manifestPath: string;
  localesRoot: string;
  failOnDrift: boolean;
};

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    manifestPath: "",
    localesRoot: DEFAULT_LOCALES_ROOT,
    failOnDrift: false,
  };

  for (const arg of argv) {
    if (arg === "--fail-on-drift") {
      options.failOnDrift = true;
      continue;
    }
    if (arg.startsWith("--manifest=")) {
      options.manifestPath = path.resolve(
        APP_ROOT,
        arg.slice("--manifest=".length),
      );
      continue;
    }
    if (arg.startsWith("--locales-root=")) {
      options.localesRoot = path.resolve(
        APP_ROOT,
        arg.slice("--locales-root=".length),
      );
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.manifestPath) {
    throw new Error("Missing required argument --manifest=<path-to-manifest.json>");
  }

  return options;
}

function parseManifest(raw: string): TranslationDriftManifest {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Manifest must be a JSON object.");
  }

  const manifest = parsed as Partial<TranslationDriftManifest>;
  if (manifest.schemaVersion !== TRANSLATION_DRIFT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported manifest schemaVersion "${String(manifest.schemaVersion)}"; expected ${TRANSLATION_DRIFT_SCHEMA_VERSION}.`,
    );
  }
  if (!manifest.baselineLocale || typeof manifest.baselineLocale !== "string") {
    throw new Error("Manifest missing baselineLocale.");
  }
  if (!Array.isArray(manifest.locales) || manifest.locales.length === 0) {
    throw new Error("Manifest missing locales.");
  }
  if (!Array.isArray(manifest.entries)) {
    throw new Error("Manifest missing entries.");
  }

  return manifest as TranslationDriftManifest;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const manifestRaw = await readFile(options.manifestPath, "utf8");
  const manifest = parseManifest(manifestRaw);

  const report = await checkTranslationDriftManifest({
    manifest,
    localesRoot: options.localesRoot,
  });

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  if (
    options.failOnDrift &&
    (report.summary.staleLocales > 0 ||
      report.summary.missingLocales > 0 ||
      report.summary.newTrackedFilesSinceManifest > 0)
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
