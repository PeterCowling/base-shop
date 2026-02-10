import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  runTranslationSpike,
  type TranslationProvider,
  TranslationSpikeError,
  type TranslationSpikeErrorCode,
} from "./translation-runner-spike";

export type TranslationRunFailureCode =
  | TranslationSpikeErrorCode
  | "source_read_error"
  | "write_error";

export type TranslationRunEntryStatus =
  | "written"
  | "unchanged"
  | "dry-run"
  | "failed";

export type TranslationRunEntry = {
  guideName: string;
  locale: string;
  status: TranslationRunEntryStatus;
  outputPath: string;
  failureCode?: TranslationRunFailureCode;
  failureMessage?: string;
};

export type TranslationRunSummary = {
  total: number;
  written: number;
  unchanged: number;
  plannedWrites: number;
  failed: number;
  entries: TranslationRunEntry[];
};

export type TranslateGuidesRunnerOptions = {
  provider: TranslationProvider;
  sourceRoot: string;
  outputRoot: string;
  guides: readonly string[];
  targetLocales: readonly string[];
  sourceLocale?: string;
  contentRelativeDir?: string;
  dryRun?: boolean;
};

const CONTENT_RELATIVE_DIR = path.join("guides", "content");

const toOutputJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function translateOne(
  options: {
    provider: TranslationProvider;
    sourceJson: string;
    guideName: string;
    locale: string;
    sourceLocale: string;
    outputPath: string;
    dryRun: boolean;
  },
): Promise<TranslationRunEntry> {
  try {
    const result = await runTranslationSpike({
      provider: options.provider,
      sourceJson: options.sourceJson,
      targetLocale: options.locale,
      guideName: options.guideName,
      sourceLocale: options.sourceLocale,
    });
    const outputJson = toOutputJson(result.translatedJson);

    if (options.dryRun) {
      return {
        guideName: options.guideName,
        locale: options.locale,
        status: "dry-run",
        outputPath: options.outputPath,
      };
    }

    const existing = await readOptionalFile(options.outputPath);
    if (existing === outputJson) {
      return {
        guideName: options.guideName,
        locale: options.locale,
        status: "unchanged",
        outputPath: options.outputPath,
      };
    }

    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, outputJson, "utf8");
    return {
      guideName: options.guideName,
      locale: options.locale,
      status: "written",
      outputPath: options.outputPath,
    };
  } catch (error) {
    if (error instanceof TranslationSpikeError) {
      return {
        guideName: options.guideName,
        locale: options.locale,
        status: "failed",
        outputPath: options.outputPath,
        failureCode: error.code,
        failureMessage: error.message,
      };
    }

    return {
      guideName: options.guideName,
      locale: options.locale,
      status: "failed",
      outputPath: options.outputPath,
      failureCode: "write_error",
      failureMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runGuideTranslationBatch(
  options: TranslateGuidesRunnerOptions,
): Promise<TranslationRunSummary> {
  const sourceLocale = options.sourceLocale ?? "en";
  const contentRelativeDir = options.contentRelativeDir ?? CONTENT_RELATIVE_DIR;
  const dryRun = options.dryRun ?? false;
  const entries: TranslationRunEntry[] = [];

  for (const guideName of options.guides) {
    const sourcePath = path.join(
      options.sourceRoot,
      sourceLocale,
      contentRelativeDir,
      guideName,
    );
    let sourceJson: string;
    try {
      sourceJson = await readFile(sourcePath, "utf8");
    } catch (error) {
      for (const locale of options.targetLocales) {
        const outputPath = path.join(
          options.outputRoot,
          locale,
          contentRelativeDir,
          guideName,
        );
        entries.push({
          guideName,
          locale,
          status: "failed",
          outputPath,
          failureCode: "source_read_error",
          failureMessage: error instanceof Error ? error.message : String(error),
        });
      }
      continue;
    }

    for (const locale of options.targetLocales) {
      const outputPath = path.join(
        options.outputRoot,
        locale,
        contentRelativeDir,
        guideName,
      );
      entries.push(
        await translateOne({
          provider: options.provider,
          sourceJson,
          guideName,
          locale,
          sourceLocale,
          outputPath,
          dryRun,
        }),
      );
    }
  }

  return {
    total: entries.length,
    written: entries.filter((entry) => entry.status === "written").length,
    unchanged: entries.filter((entry) => entry.status === "unchanged").length,
    plannedWrites: entries.filter((entry) => entry.status === "dry-run").length,
    failed: entries.filter((entry) => entry.status === "failed").length,
    entries,
  };
}
