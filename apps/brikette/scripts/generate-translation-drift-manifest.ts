#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001 [ttl=2026-12-31] CLI script reads/writes workspace-local JSON manifests by explicit path. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig } from "../src/i18n.config";

import { buildTranslationDriftManifest } from "./lib/translation-drift-manifest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");
const DEFAULT_BASELINE_LOCALE = "en";

type CliOptions = {
  localesRoot: string;
  baselineLocale: string;
  locales: string[];
  outputPath?: string;
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    localesRoot: DEFAULT_LOCALES_ROOT,
    baselineLocale: DEFAULT_BASELINE_LOCALE,
    locales: ((i18nConfig.supportedLngs ?? []) as string[]).filter(
      (locale) => locale !== DEFAULT_BASELINE_LOCALE,
    ),
  };

  for (const arg of argv) {
    if (arg.startsWith("--locales-root=")) {
      options.localesRoot = path.resolve(
        APP_ROOT,
        arg.slice("--locales-root=".length),
      );
      continue;
    }
    if (arg.startsWith("--baseline-locale=")) {
      options.baselineLocale = arg.slice("--baseline-locale=".length).trim();
      continue;
    }
    if (arg.startsWith("--locales=")) {
      options.locales = splitCsv(arg.slice("--locales=".length));
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.outputPath = path.resolve(
        APP_ROOT,
        arg.slice("--output=".length),
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.locales = options.locales.filter(
    (locale) => locale !== options.baselineLocale,
  );

  if (options.locales.length === 0) {
    throw new Error("At least one non-baseline locale must be provided.");
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const manifest = await buildTranslationDriftManifest({
    localesRoot: options.localesRoot,
    baselineLocale: options.baselineLocale,
    locales: options.locales,
  });
  const json = `${JSON.stringify(manifest, null, 2)}\n`;

  if (options.outputPath) {
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, json, "utf8");
    console.error(`translation drift manifest written to ${options.outputPath}`);
  }

  process.stdout.write(json);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
