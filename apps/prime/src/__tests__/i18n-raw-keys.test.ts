import path from "node:path";

import {
  auditLocaleJsonForRawKeys,
  formatRawKeyAuditIssues,
} from "~test/i18n/localeRawKeyAudit";

describe("i18n raw key enforcement", () => {
  test("TC-26: locale JSON does not contain raw key placeholders", () => {
    const LOCALES = ["en", "it"] as const;
    const localesRoot = path.resolve(__dirname, "../../public/locales");

    const issues = auditLocaleJsonForRawKeys({
      localesRoot,
      baselineLocale: "en",
      locales: LOCALES,
    });

    if (issues.length > 0) {
      throw new Error(formatRawKeyAuditIssues(issues));
    }
  });
});

