#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import path from "node:path";

import { runGuideTranslationBatch } from "./lib/translate-guides-runner";
import {
  createFixtureTranslationProvider,
  type FixtureTranslationProviderMap,
  type TranslationProvider,
} from "./lib/translation-runner-spike";

const DEFAULT_GUIDES_TO_TRANSLATE = [
  "historyPositano.json",
  "ferragostoPositano.json",
  "folkloreAmalfi.json",
  "avoidCrowdsPositano.json",
  "positanoPompeii.json",
] as const;

const DEFAULT_TARGET_LOCALES = [
  "ar",
  "da",
  "de",
  "es",
  "fr",
  "hi",
  "hu",
  "it",
  "ja",
  "ko",
  "no",
  "pl",
  "pt",
  "ru",
  "sv",
  "vi",
  "zh",
] as const;
type ProviderMode = "fixture";

type CliOptions = {
  provider: ProviderMode;
  sourceRoot: string;
  outputRoot: string;
  sourceLocale: string;
  contentRelativeDir: string;
  guides: string[];
  locales: string[];
  dryRun: boolean;
  allowFailures: boolean;
  fixtureFile?: string;
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseArgs(argv: readonly string[]): CliOptions {
  const defaultRoot = path.join(process.cwd(), "src", "locales");
  const options: CliOptions = {
    provider: "fixture",
    sourceRoot: defaultRoot,
    outputRoot: defaultRoot,
    sourceLocale: "en",
    contentRelativeDir: path.join("guides", "content"),
    guides: [...DEFAULT_GUIDES_TO_TRANSLATE],
    locales: [...DEFAULT_TARGET_LOCALES],
    dryRun: true,
    allowFailures: false,
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
    if (arg === "--allow-failures") {
      options.allowFailures = true;
      continue;
    }
    if (arg.startsWith("--provider=")) {
      const provider = arg.slice("--provider=".length).trim();
      if (provider !== "fixture") {
        throw new Error(`Unsupported provider "${provider}". Only fixture is supported.`);
      }
      options.provider = provider;
      continue;
    }
    if (arg.startsWith("--guides=")) {
      options.guides = splitCsv(arg.slice("--guides=".length));
      continue;
    }
    if (arg.startsWith("--locales=")) {
      options.locales = splitCsv(arg.slice("--locales=".length));
      continue;
    }
    if (arg.startsWith("--source-root=")) {
      options.sourceRoot = path.resolve(arg.slice("--source-root=".length));
      continue;
    }
    if (arg.startsWith("--output-root=")) {
      options.outputRoot = path.resolve(arg.slice("--output-root=".length));
      continue;
    }
    if (arg.startsWith("--source-locale=")) {
      options.sourceLocale = arg.slice("--source-locale=".length).trim();
      continue;
    }
    if (arg.startsWith("--content-dir=")) {
      options.contentRelativeDir = arg.slice("--content-dir=".length).trim();
      continue;
    }
    if (arg.startsWith("--fixture-file=")) {
      options.fixtureFile = path.resolve(arg.slice("--fixture-file=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.guides.length === 0) {
    throw new Error("At least one guide must be provided via --guides.");
  }
  if (options.locales.length === 0) {
    throw new Error("At least one locale must be provided via --locales.");
  }

  if (options.provider === "fixture" && !options.fixtureFile) {
    throw new Error("Fixture provider requires --fixture-file=<path-to-fixtures.json>.");
  }

  return options;
}

async function createProvider(options: CliOptions): Promise<TranslationProvider> {
  const fixturePath = options.fixtureFile;
  if (!fixturePath) {
    throw new Error("fixtureFile must be provided for fixture provider.");
  }

  const fixtureRaw = await readFile(fixturePath, "utf8");
  const parsed = JSON.parse(fixtureRaw) as FixtureTranslationProviderMap;
  return createFixtureTranslationProvider(parsed);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const provider = await createProvider(options);

  console.info("Guide translation runner");
  console.info(`provider=${options.provider} (id=${provider.id})`);
  console.info(`sourceRoot=${options.sourceRoot}`);
  console.info(`outputRoot=${options.outputRoot}`);
  console.info(`sourceLocale=${options.sourceLocale}`);
  console.info(`guides=${options.guides.join(",")}`);
  console.info(`locales=${options.locales.join(",")}`);
  console.info(`dryRun=${String(options.dryRun)}`);

  const summary = await runGuideTranslationBatch({
    provider,
    sourceRoot: options.sourceRoot,
    outputRoot: options.outputRoot,
    sourceLocale: options.sourceLocale,
    contentRelativeDir: options.contentRelativeDir,
    guides: options.guides,
    targetLocales: options.locales,
    dryRun: options.dryRun,
  });

  console.info("");
  console.info("Translation summary");
  console.info(`total=${summary.total}`);
  console.info(`written=${summary.written}`);
  console.info(`unchanged=${summary.unchanged}`);
  console.info(`plannedWrites=${summary.plannedWrites}`);
  console.info(`failed=${summary.failed}`);

  if (summary.failed > 0) {
    console.error("");
    console.error("Failures");
    for (const entry of summary.entries.filter((item) => item.status === "failed")) {
      console.error(
        `- ${entry.locale}/${entry.guideName} :: ${entry.failureCode ?? "unknown"} :: ${entry.failureMessage ?? "no message"}`,
      );
    }
  }

  if (summary.failed > 0 && !options.allowFailures) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
