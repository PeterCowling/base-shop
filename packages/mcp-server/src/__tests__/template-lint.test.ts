/** @jest-environment node */

import { readFileSync } from "fs";
import { join } from "path";

import {
  findPlaceholders,
  lintTemplates,
  lintTemplatesSync,
  partitionIssues,
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
      (issue) => issue.code === "policy_mismatch"
    );
    expect(policyIssue).toBeDefined();
  });

  it("partitions broken_link issues as warnings and others as hard failures", () => {
    const issues = [
      { subject: "A", code: "broken_link", details: "Link failed (404): https://example.com" },
      { subject: "B", code: "placeholder", details: "Unfilled placeholder: {name}" },
      { subject: "C", code: "broken_link", details: "Link failed (404): https://example.com/2" },
      { subject: "D", code: "policy_mismatch", details: "Missing policy keywords" },
    ];
    const { hard, warnings } = partitionIssues(issues);
    expect(hard).toHaveLength(2);
    expect(warnings).toHaveLength(2);
    expect(hard.every((i) => i.code !== "broken_link")).toBe(true);
    expect(warnings.every((i) => i.code === "broken_link")).toBe(true);
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

  it("TC-03-01: all stored templates pass sync lint (no placeholders, no here-without-url)", () => {
    const templates = loadStoredTemplates();
    const issues = lintTemplatesSync(templates);
    const hard = issues.filter((i) => i.code !== "broken_link");
    expect(hard).toHaveLength(0);
  });

  it("TC-03-02: broken-link stub fixture fails with here_without_url error", () => {
    const brokenStub = [
      {
        subject: "Out of hours check-in (stub)",
        body: "Dear Guest,\r\n\r\nPlease find our out of hours check-in process here.\r\n\r\nBest regards,\r\nPeter Cowling\r\nOwner",
        category: "check-in",
      },
    ];
    const issues = lintTemplatesSync(brokenStub);
    expect(issues.some((i) => i.code === "here_without_url")).toBe(true);
    const issue = issues.find((i) => i.code === "here_without_url");
    expect(issue?.details).toMatch(/here.*as link anchor without a URL/i);
  });

  it("TC-03-03: double-brace placeholder fixture fails with placeholder error", () => {
    const placeholderFixture = [
      {
        subject: "Template with double-brace",
        body: "Dear {{guest_name}},\r\n\r\nYour booking reference is {{booking_ref}}.",
        category: "general",
      },
    ];
    const issues = lintTemplatesSync(placeholderFixture);
    expect(issues.some((i) => i.code === "placeholder")).toBe(true);
    const details = issues.filter((i) => i.code === "placeholder").map((i) => i.details);
    expect(details.some((d) => d.includes("{{guest_name}}"))).toBe(true);
  });

  it("TC-03-03: bracket-style [PLACEHOLDER] fixture fails with placeholder error", () => {
    const placeholderFixture = [
      {
        subject: "Template with bracket placeholder",
        body: "Dear Guest,\r\n\r\nYour check-in code is [ACCESS CODE]. Please use [ROOM NUMBER] to find your room.",
        category: "check-in",
      },
    ];
    const issues = lintTemplatesSync(placeholderFixture);
    expect(issues.some((i) => i.code === "placeholder")).toBe(true);
  });

  it("TC-03-04: all 10 new template subjects exist in the stored template set", () => {
    const templates = loadStoredTemplates();
    const subjects = new Set(templates.map((t) => t.subject));
    const expectedNewSubjects = [
      "Bar and Terrace \u2014 Hours and Access",
      "Parking \u2014 Not Available, Nearby Options",
      "Pets \u2014 Policy",
      "City Tax \u2014 What to Expect at Check-in",
      "Private Room vs Dormitory \u2014 Comparison",
      "Things to Do in Positano",
      "Receipt / Invoice Request",
      "Group Booking \u2014 How It Works",
      "Out of Hours Check-In Instructions",
      "Arriving by Bus",
    ];
    for (const subject of expectedNewSubjects) {
      expect(subjects.has(subject)).toBe(true);
    }
  });

  it("TC-03-04: city tax template is in check-in category", () => {
    const templates = loadStoredTemplates();
    const cityTax = templates.find((t) => t.subject === "City Tax \u2014 What to Expect at Check-in");
    expect(cityTax).toBeDefined();
    expect(cityTax?.category).toBe("check-in");
  });

  it("TC-03-04: fixed 'Out of hours check-in' template no longer has here-without-url issue", () => {
    const templates = loadStoredTemplates();
    const outOfHours = templates.find((t) => t.subject === "Out of hours check-in");
    expect(outOfHours).toBeDefined();
    if (!outOfHours) return;
    const issues = lintTemplatesSync([outOfHours]);
    expect(issues.filter((i) => i.code === "here_without_url")).toHaveLength(0);
  });
});
