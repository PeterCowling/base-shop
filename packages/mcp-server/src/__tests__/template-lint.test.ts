/** @jest-environment node */

import { readFileSync } from "fs";
import { join } from "path";

import {
  findPlaceholders,
  lintTemplates,
  type TemplateLintIssue,
} from "../utils/template-lint";

type StoredTemplate = {
  subject: string;
  body: string;
  category: string;
};

function loadStoredTemplates(): StoredTemplate[] {
  const raw = readFileSync(
    join(process.cwd(), "packages", "mcp-server", "data", "email-templates.json"),
    "utf8"
  );
  return JSON.parse(raw) as StoredTemplate[];
}

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

  it("TASK-09 TC-01/TC-02: rewritten non-refundable cancellation template is empathetic and avoids rigid legacy phrasing", () => {
    const templates = loadStoredTemplates();
    const cancellationTemplate = templates.find(
      (template) => template.subject === "Cancellation of Non-Refundable Booking"
    );
    expect(cancellationTemplate).toBeDefined();
    if (!cancellationTemplate) return;

    const bodyLower = cancellationTemplate.body.toLowerCase();
    expect(bodyLower).toContain("non-refundable");
    expect(bodyLower).not.toContain("pre-paid, non-refundable");
    expect(
      /(sorry|understand|difficult|disappointing)/.test(bodyLower)
    ).toBe(true);
  });

  it("TASK-09 TC-03/TC-04: high-stakes medical and dispute templates exist with policy-safe next steps", () => {
    const templates = loadStoredTemplates();
    const medicalTemplate = templates.find(
      (template) => template.subject === "Cancellation Request — Medical Hardship"
    );
    const disputeTemplate = templates.find(
      (template) => template.subject === "Payment Dispute — Acknowledgement"
    );
    const overbookingTemplate = templates.find(
      (template) => template.subject === "Overbooking Support — Next Steps"
    );

    expect(medicalTemplate).toBeDefined();
    expect(disputeTemplate).toBeDefined();
    expect(overbookingTemplate).toBeDefined();

    if (medicalTemplate) {
      expect(medicalTemplate.body.toLowerCase()).toContain("non-refundable");
      expect(medicalTemplate.body.toLowerCase()).toContain("travel insurance");
    }
    if (disputeTemplate) {
      expect(disputeTemplate.body.toLowerCase()).toContain("reviewing this with priority");
      expect(disputeTemplate.body.toLowerCase()).toContain("next steps");
    }
  });

  it("TASK-09 TC-07: prepayment templates progress from gentle reminder to final cancellation", () => {
    const templates = loadStoredTemplates();
    const firstAttempt = templates.find(
      (template) => template.subject === "Prepayment - 1st Attempt Failed (Octorate)"
    );
    const secondAttempt = templates.find(
      (template) => template.subject === "Prepayment - 2nd Attempt Failed"
    );
    const thirdAttempt = templates.find(
      (template) => template.subject === "Prepayment - Cancelled post 3rd Attempt"
    );

    expect(firstAttempt).toBeDefined();
    expect(secondAttempt).toBeDefined();
    expect(thirdAttempt).toBeDefined();

    if (firstAttempt) {
      expect(firstAttempt.body.toLowerCase()).toContain("second time tomorrow");
    }
    if (secondAttempt) {
      expect(secondAttempt.body.toLowerCase()).toContain("one final attempt");
    }
    if (thirdAttempt) {
      expect(thirdAttempt.body.toLowerCase()).toContain("reservation has now been cancelled");
    }
  });
});
