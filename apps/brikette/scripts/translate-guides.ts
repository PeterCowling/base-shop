#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

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

const LOCALE_NAMES: Record<string, string> = {
  ar: "Arabic",
  da: "Danish",
  de: "German",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
  hu: "Hungarian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ru: "Russian",
  sv: "Swedish",
  vi: "Vietnamese",
  zh: "Chinese (Simplified)",
};

type ProviderMode = "fixture" | "anthropic";

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
      if (provider !== "fixture" && provider !== "anthropic") {
        throw new Error(`Unsupported provider "${provider}". Use fixture or anthropic.`);
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

function buildTranslationPrompt(
  sourceContent: string,
  targetLocale: string,
  guideName: string,
): string {
  const localeName = LOCALE_NAMES[targetLocale] ?? targetLocale;
  return `You are a professional translator specializing in travel content for budget travelers.

TASK: Translate the following JSON guide content from English to ${localeName}.

CRITICAL REQUIREMENTS:
1. Preserve ALL special tokens EXACTLY as they appear:
   - %LINK:guideKey|anchor text% - translate ONLY the anchor text, keep guideKey unchanged
   - %IMAGE:filename.jpg|alt text% - translate ONLY the alt text, keep filename unchanged
   - %COMPONENT:name% - keep completely unchanged

2. Preserve JSON structure exactly - only translate string values, never keys

3. Translate naturally for the target audience (hostel guests visiting Positano, Italy):
   - Use appropriate formality level for ${localeName}
   - Maintain practical, direct, helpful tone
   - Keep content appropriate for budget travelers

4. Cultural adaptation:
   - Use natural expressions for the target language
   - Adapt measurements if culturally appropriate (but keep original in parentheses)
   - Keep proper nouns in original form (Positano, Chiesa Nuova, Via dei Mulini, etc.)

5. Return ONLY valid JSON - no explanations, no markdown code blocks

SOURCE CONTENT (${guideName}):
${sourceContent}

TRANSLATION (${localeName}):`;
}

async function createAnthropicProvider(): Promise<TranslationProvider> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is required for --provider=anthropic. Use fixture mode for deterministic no-network checks.",
    );
  }

  const anthropic = new Anthropic({ apiKey });

  return {
    id: "anthropic",
    async translate({ text, locale, context }) {
      const prompt = buildTranslationPrompt(text, locale, context.guideName);
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const firstBlock = message.content[0];
      if (!firstBlock || firstBlock.type !== "text") {
        throw new Error("Provider returned non-text content.");
      }

      return firstBlock.text;
    },
  };
}

async function createProvider(options: CliOptions): Promise<TranslationProvider> {
  if (options.provider === "anthropic") {
    return createAnthropicProvider();
  }

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
