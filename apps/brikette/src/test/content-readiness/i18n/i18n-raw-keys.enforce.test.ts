import path from "node:path";

import { type AppLanguage, i18nConfig } from "@/i18n.config";

import {
  auditLocaleJsonForRawKeys,
  formatRawKeyAuditIssues,
} from "~test/i18n/localeRawKeyAudit";

describe("i18n raw key enforcement (non-guide content)", () => {
  it("fails if any locale JSON value contains raw i18n key placeholders", () => {
    const localesRoot = path.resolve(__dirname, "../../../locales");
    const locales = (i18nConfig.supportedLngs ?? []) as AppLanguage[];

    const issues = auditLocaleJsonForRawKeys({
      localesRoot,
      baselineLocale: "en",
      locales,
      // Long-form guide content has its own suites; keep this enforcement fast and focused.
      skipFilePrefixes: ["guides/content/"],
    });

    if (issues.length > 0) {
      throw new Error(formatRawKeyAuditIssues(issues));
    }
  });
});
