import path from "node:path";

import {
  listJsonFiles,
  readJson,
} from "./fsContent";

type SafeParseIssue = {
  path?: unknown;
  message?: unknown;
};

type SafeParseResult = {
  success: boolean;
  error?: {
    errors?: SafeParseIssue[];
    issues?: SafeParseIssue[];
  };
};

export interface SafeParseValidator {
  safeParse: (value: unknown) => SafeParseResult;
}

export type GuideContentValidationError = {
  path: string;
  message: string;
};

export type GuideContentValidationViolation = {
  file: string;
  locale: string;
  guideKey: string;
  errors: GuideContentValidationError[];
};

export type GuideContentValidationResult = {
  total: number;
  validated: number;
  skipped: number;
  violations: GuideContentValidationViolation[];
};

export type GuideContentValidationOptions = {
  schemaValidator: SafeParseValidator;
  localesRoot: string;
  locales: readonly string[];
  guideFilter?: ReadonlySet<string> | null;
  contentRelativeDir?: string;
  optOutKey?: string;
  optOutValue?: unknown;
  onSkippedFile?: (entry: {
    locale: string;
    guideKey: string;
    relativeFile: string;
  }) => void;
  onMissingLocaleContentDir?: (locale: string) => void;
};

const DEFAULT_CONTENT_RELATIVE_DIR = path.join("guides", "content");
const DEFAULT_OPT_OUT_KEY = "_schemaValidation";
const DEFAULT_OPT_OUT_VALUE = false;
const DEFAULT_VALIDATION_ERROR_CODE = "validation_error_unknown";

const toIssueMessage = (value: unknown): string =>
  typeof value === "string" ? value : DEFAULT_VALIDATION_ERROR_CODE;

const toIssuePath = (value: unknown): string => {
  if (!Array.isArray(value) || value.length === 0) {
    return "(root)";
  }

  return value.map(segment => String(segment)).join(".");
};

const toIssues = (result: SafeParseResult): GuideContentValidationError[] => {
  const rawIssues = result.error?.errors ?? result.error?.issues ?? [];
  if (!Array.isArray(rawIssues) || rawIssues.length === 0) {
    return [
      {
        path: "(root)",
        message: DEFAULT_VALIDATION_ERROR_CODE,
      },
    ];
  }

  return rawIssues.map(issue => ({
    path: toIssuePath(issue.path),
    message: toIssueMessage(issue.message),
  }));
};

export async function validateGuideContentFiles(
  options: GuideContentValidationOptions,
): Promise<GuideContentValidationResult> {
  const contentRelativeDir = options.contentRelativeDir ?? DEFAULT_CONTENT_RELATIVE_DIR;
  const optOutKey = options.optOutKey ?? DEFAULT_OPT_OUT_KEY;
  const optOutValue = options.optOutValue ?? DEFAULT_OPT_OUT_VALUE;
  const result: GuideContentValidationResult = {
    total: 0,
    validated: 0,
    skipped: 0,
    violations: [],
  };

  for (const locale of options.locales) {
    const contentRoot = path.join(options.localesRoot, locale, contentRelativeDir);

    let contentFiles: string[];
    try {
      contentFiles = await listJsonFiles(contentRoot);
    } catch {
      options.onMissingLocaleContentDir?.(locale);
      continue;
    }

    for (const relativeFile of contentFiles) {
      const guideKey = path.basename(relativeFile, ".json");
      if (options.guideFilter && !options.guideFilter.has(guideKey)) {
        continue;
      }

      result.total += 1;
      const absolutePath = path.join(contentRoot, relativeFile);

      try {
        const content = await readJson(absolutePath);
        if (
          typeof content === "object" &&
          content !== null &&
          optOutKey in content &&
          Object.is((content as Record<string, unknown>)[optOutKey], optOutValue)
        ) {
          result.skipped += 1;
          options.onSkippedFile?.({
            locale,
            guideKey,
            relativeFile,
          });
          continue;
        }

        const parsed = options.schemaValidator.safeParse(content);
        if (parsed.success) {
          result.validated += 1;
          continue;
        }

        result.violations.push({
          file: relativeFile,
          locale,
          guideKey,
          errors: toIssues(parsed),
        });
      } catch (error) {
        result.violations.push({
          file: relativeFile,
          locale,
          guideKey,
          errors: [
            {
              path: "(file)",
              message: error instanceof Error ? error.message : String(error),
            },
          ],
        });
      }
    }
  }

  return result;
}
