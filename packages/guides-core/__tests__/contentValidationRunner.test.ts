/** @jest-environment node */
/* eslint-disable security/detect-non-literal-fs-filename -- Test creates temporary paths per-case. */

import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  type SafeParseValidator,
  validateGuideContentFiles,
} from "../src/contentValidationRunner";

const schemaValidator: SafeParseValidator = {
  safeParse(value) {
    if (typeof value !== "object" || value === null) {
      return {
        success: false,
        error: {
          errors: [
            {
              path: [],
              message: "Expected object",
            },
          ],
        },
      };
    }

    const record = value as Record<string, unknown>;
    if (typeof record.title !== "string") {
      return {
        success: false,
        error: {
          errors: [
            {
              path: ["title"],
              message: "Expected string",
            },
          ],
        },
      };
    }

    if (!Array.isArray(record.sections)) {
      return {
        success: false,
        error: {
          errors: [
            {
              path: ["sections"],
              message: "Expected array",
            },
          ],
        },
      };
    }

    return { success: true };
  },
};

const writeGuideContent = (
  rootDir: string,
  locale: string,
  guideKey: string,
  content: Record<string, unknown>,
): void => {
  const contentDir = path.join(rootDir, locale, "guides", "content");
  mkdirSync(contentDir, { recursive: true });
  writeFileSync(
    path.join(contentDir, `${guideKey}.json`),
    `${JSON.stringify(content, null, 2)}\n`,
    "utf8",
  );
};

describe("validateGuideContentFiles", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(path.join(tmpdir(), "guides-core-validation-"));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("returns zero violations for valid content", async () => {
    writeGuideContent(rootDir, "en", "rules", {
      title: "Rules",
      sections: [],
    });

    const result = await validateGuideContentFiles({
      schemaValidator,
      localesRoot: rootDir,
      locales: ["en"],
    });

    expect(result).toEqual({
      total: 1,
      validated: 1,
      skipped: 0,
      violations: [],
    });
  });

  it("returns deterministic violation output for invalid content", async () => {
    writeGuideContent(rootDir, "en", "rules", {
      title: 42,
      sections: [],
    });

    const result = await validateGuideContentFiles({
      schemaValidator,
      localesRoot: rootDir,
      locales: ["en"],
    });

    expect(result.total).toBe(1);
    expect(result.validated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.violations).toEqual([
      {
        file: "rules.json",
        locale: "en",
        guideKey: "rules",
        errors: [
          {
            path: "title",
            message: "Expected string",
          },
        ],
      },
    ]);
  });

  it("skips files with _schemaValidation=false opt-out marker", async () => {
    writeGuideContent(rootDir, "en", "rules", {
      _schemaValidation: false,
      title: 42,
      sections: [],
    });

    const skipped: string[] = [];
    const result = await validateGuideContentFiles({
      schemaValidator,
      localesRoot: rootDir,
      locales: ["en"],
      onSkippedFile: ({ relativeFile }) => {
        skipped.push(relativeFile);
      },
    });

    expect(result.total).toBe(1);
    expect(result.validated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.violations).toEqual([]);
    expect(skipped).toEqual(["rules.json"]);
  });

  it("applies guide filter to validate only selected guide keys", async () => {
    writeGuideContent(rootDir, "en", "rules", {
      title: "Rules",
      sections: [],
    });
    writeGuideContent(rootDir, "en", "faq", {
      title: 42,
      sections: [],
    });

    const result = await validateGuideContentFiles({
      schemaValidator,
      localesRoot: rootDir,
      locales: ["en"],
      guideFilter: new Set(["rules"]),
    });

    expect(result.total).toBe(1);
    expect(result.validated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.violations).toEqual([]);
  });
});
