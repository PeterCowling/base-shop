import itFixture from "../__fixtures__/draft-pipeline/IT-01.json";
import mltFixture from "../__fixtures__/draft-pipeline/MLT-01.json";
import ppFixture from "../__fixtures__/draft-pipeline/PP-01.json";
import sglCheckInFixture from "../__fixtures__/draft-pipeline/SGL-01.json";
import sglCancellationFixture from "../__fixtures__/draft-pipeline/SGL-04.json";
import {
  generateAgentDraft,
  type ThreadContext,
  toParitySnapshot,
} from "../draft-pipeline.server";

type DraftPipelineFixture = {
  id: string;
  class: string;
  description: string;
  input: {
    from?: string;
    subject?: string;
    body: string;
  };
  expected: {
    dominant_scenario_category: string;
    comparison_fields: string[];
  };
};

const fixtures: DraftPipelineFixture[] = [
  sglCheckInFixture,
  sglCancellationFixture,
  mltFixture,
  ppFixture,
  itFixture,
];

function buildInput(fixture: DraftPipelineFixture): ThreadContext {
  if (fixture.id === "PP-01") {
    return {
      ...fixture.input,
      prepaymentStep: "first",
      prepaymentProvider: "hostelworld",
    };
  }

  return fixture.input;
}

describe("generateAgentDraft", () => {
  it("returns an error result for malformed input instead of throwing", async () => {
    await expect(generateAgentDraft({ body: "" })).resolves.toMatchObject({
      status: "error",
      plainText: null,
      html: null,
      error: {
        code: "invalid_input",
      },
    });
  });

  it("assembles interpret, generate, and quality stages for the saved parity fixtures", async () => {
    const results = await Promise.all(fixtures.map(async (fixture) => ({
      fixture,
      result: await generateAgentDraft(buildInput(fixture)),
    })));

    for (const { fixture, result } of results) {
      const snapshot = toParitySnapshot(result);

      expect(result.status).not.toBe("error");
      expect(
        Object.keys(snapshot).sort(),
      ).toEqual(fixture.expected.comparison_fields.slice().sort());
      expect(snapshot.branded_html_present).toBe(true);
      expect(snapshot.quality_result).not.toBeNull();
      expect(snapshot.selected_template_subject).not.toBeUndefined();
      expect(snapshot.selected_template_category).not.toBeUndefined();
    }
  });

  it("keeps the check-in path high-confidence and quality-passing", async () => {
    const result = await generateAgentDraft(sglCheckInFixture.input);
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.selected_template_category === "check-in" || snapshot.selected_template_category === "faq").toBe(true);
    expect(snapshot.quality_result?.passed).toBe(true);
    expect(snapshot.answered_question_set.some((question) => /check[-\s]?in/i.test(question))).toBe(true);
  });

  it("uses the workflow-specific prepayment template path when the caller supplies step/provider context", async () => {
    const result = await generateAgentDraft(buildInput(ppFixture));
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.dominant_scenario_category).toBe("prepayment");
    expect(snapshot.selected_template_subject).toBe(
      "Prepayment - 1st Attempt Failed (Hostelworld)",
    );
    expect(snapshot.selected_template_category).toBe("prepayment");
  });

  it("answers multiple questions in the saved multi-topic fixture", async () => {
    const result = await generateAgentDraft(mltFixture.input);
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.answered_question_set.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.quality_result?.failed_checks).not.toContain("unanswered_questions");
  });

  it("preserves language detection for the Italian fixture", async () => {
    const result = await generateAgentDraft(itFixture.input);
    const snapshot = toParitySnapshot(result);

    expect(result.status).not.toBe("error");
    expect(snapshot.interpreted_language).toBe("IT");
    expect(snapshot.answered_question_set.some((question) => /colazione|breakfast/i.test(question))).toBe(true);
    expect(snapshot.branded_html_present).toBe(true);
  });
});
