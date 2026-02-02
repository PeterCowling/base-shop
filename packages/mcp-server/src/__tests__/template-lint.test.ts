/** @jest-environment node */

import {
  findPlaceholders,
  lintTemplates,
  type TemplateLintIssue,
} from "../utils/template-lint";

describe("template linting", () => {
  it("TC-01: detects unfilled placeholders", () => {
    const placeholders = findPlaceholders("Hello {name}, welcome!");
    expect(placeholders).toEqual(["{name}"]);
  });

  it("TC-02: flags broken links", async () => {
    const issues = await lintTemplates(
      [
        {
          subject: "Test",
          body: "See https://example.com/broken",
          category: "faq",
        },
      ],
      {
        policyKeywords: new Set(["policy"]),
        checkLink: async () => ({ ok: false, status: 404 }),
      }
    );

    expect(issues.some((issue) => issue.code === "broken_link")).toBe(true);
  });

  it("TC-03: flags policy templates without policy keywords", async () => {
    const issues = await lintTemplates(
      [
        {
          subject: "Policy Template",
          body: "House rules for guests",
          category: "policies",
        },
      ],
      {
        policyKeywords: new Set(["age", "quiet", "check-in"]),
        checkLink: async () => ({ ok: true, status: 200 }),
      }
    );

    const policyIssue = issues.find(
      (issue: TemplateLintIssue) => issue.code === "policy_mismatch"
    );
    expect(policyIssue).toBeDefined();
  });
});
