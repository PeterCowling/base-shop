#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001 [ttl=2026-12-31] CLI migration script reads/writes workspace JSON files by explicit root. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig } from "../src/i18n.config";

import { runGuideContentMigrations } from "./lib/guide-content-migrations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

type CliOptions = {
  localesRoot: string;
  locales: string[];
  guides?: string[];
  fromVersion: number;
  toVersion: number;
  dryRun: boolean;
  outputPath?: string;
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseIntArg(name: string, value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value "${value}" (expected positive integer).`);
  }
  return parsed;
}

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    localesRoot: DEFAULT_LOCALES_ROOT,
    locales: ["en"],
    fromVersion: Number.NaN,
    toVersion: Number.NaN,
    dryRun: true,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--write") {
      options.dryRun = false;
      continue;
    }
    if (arg.startsWith("--locales-root=")) {
      options.localesRoot = path.resolve(
        APP_ROOT,
        arg.slice("--locales-root=".length),
      );
      continue;
    }
    if (arg.startsWith("--locales=")) {
      const selected = splitCsv(arg.slice("--locales=".length));
      options.locales = selected.length > 0 ? selected : options.locales;
      continue;
    }
    if (arg.startsWith("--guides=")) {
      const guides = splitCsv(arg.slice("--guides=".length));
      options.guides = guides.length > 0 ? guides : undefined;
      continue;
    }
    if (arg.startsWith("--from=")) {
      options.fromVersion = parseIntArg("--from", arg.slice("--from=".length));
      continue;
    }
    if (arg.startsWith("--to=")) {
      options.toVersion = parseIntArg("--to", arg.slice("--to=".length));
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

  if (!Number.isInteger(options.fromVersion)) {
    throw new Error("Missing required argument --from=<version>");
  }
  if (!Number.isInteger(options.toVersion)) {
    throw new Error("Missing required argument --to=<version>");
  }

  const supportedLocales = (i18nConfig.supportedLngs ?? []) as string[];
  for (const locale of options.locales) {
    if (!supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale "${locale}". Supported locales: ${supportedLocales.join(", ")}`);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const report = await runGuideContentMigrations({
    localesRoot: options.localesRoot,
    locales: options.locales,
    guides: options.guides,
    fromVersion: options.fromVersion,
    toVersion: options.toVersion,
    dryRun: options.dryRun,
  });
  const json = `${JSON.stringify(report, null, 2)}\n`;

  if (options.outputPath) {
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, json, "utf8");
    console.error(`guide content migration report written to ${options.outputPath}`);
  }

  process.stdout.write(json);

  if (report.summary.filesFailed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
