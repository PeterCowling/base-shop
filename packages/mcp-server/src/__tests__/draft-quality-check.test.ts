/** @jest-environment node */

import handleDraftQualityTool from "../tools/draft-quality-check";

function parseResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    passed: boolean;
    failed_checks: string[];
    warnings: string[];
  };
}

describe("draft_quality_check", () => {
  const baseActionPlan = {
    language: "EN" as const,
    intents: {
      questions: [{ text: "What time is check-in?" }],
    },
    workflow_triggers: {
      booking_monitor: true,
    },
    scenario: {
      category: "faq",
    },
    thread_summary: {
      prior_commitments: ["Breakfast is included"],
    },
  };

  it("TC-01: missing answers triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Hello. Best regards, Hostel Brikette",
        bodyHtml: "<p>Hello</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("unanswered_questions");
  });

  it("TC-02: prohibited claims are detected", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Availability confirmed. Best regards, Hostel Brikette",
        bodyHtml: "<p>Availability confirmed</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("prohibited_claims");
  });

  it("TC-03: missing required link triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in is at 3pm</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_required_link");
  });

  it("TC-04: missing signature triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. https://example.com",
        bodyHtml: "<p>Check-in is at 3pm</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_signature");
  });

  it("TC-05: missing html/plaintext triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. https://example.com Best regards, Hostel Brikette",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_html");
  });

  it("TC-06: length rule yields warning", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Short. Best regards, Hostel Brikette https://example.com",
        bodyHtml: "<p>Short</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.warnings).toContain("length_out_of_range");
  });

  it("TC-07: request keywords in draft body pass quality check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [],
          requests: [{ text: "Please let us know if 3 guests are allowed in the room" }],
        },
        workflow_triggers: { booking_monitor: false },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Thank you for your email. Our rooms can accommodate multiple guests. Private rooms are available for groups. We look forward to welcoming you to the hostel. Best regards, Hostel Brikette",
        bodyHtml:
          '<!DOCTYPE html><html><body><p>Our rooms can accommodate multiple guests.</p></body></html>',
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("unanswered_questions");
  });

  it("TC-08: missing request keywords triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [],
          requests: [{ text: "Please confirm the room capacity for 3 guests" }],
        },
        workflow_triggers: { booking_monitor: false },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "We appreciate your inquiry. Breakfast is served daily. Best regards, Hostel Brikette",
        bodyHtml:
          '<!DOCTYPE html><html><body><p>We appreciate your inquiry.</p></body></html>',
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("unanswered_questions");
  });

  it("TC-09: empty requests array has no impact", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [],
          requests: [],
        },
        workflow_triggers: { booking_monitor: false },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Thank you for your email. We look forward to seeing you soon. Best regards, Hostel Brikette",
        bodyHtml:
          '<!DOCTYPE html><html><body><p>Thank you.</p></body></html>',
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("unanswered_questions");
  });
});
