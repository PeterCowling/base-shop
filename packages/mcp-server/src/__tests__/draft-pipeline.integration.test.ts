/** @jest-environment node */

/**
 * TASK-09: End-to-end evaluation harness for the email draft quality pipeline.
 *
 * Runs synthetic email scenarios through the full pipeline:
 *   draft_interpret → draft_generate → (coverage evaluation + quality gate)
 *
 * Measures: question coverage rate, quality gate pass rate, sources_used attribution.
 * Fail gate: passRate >= 0.90 (same threshold as pipeline-integration.test.ts)
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="draft-pipeline.integration" --no-coverage
 */

import { readFileSync } from "node:fs";

import { handleDraftGenerateTool } from "../tools/draft-generate";
import handleDraftInterpretTool from "../tools/draft-interpret";
import handleDraftQualityTool from "../tools/draft-quality-check";
import { evaluateQuestionCoverage } from "../utils/coverage";

// ---------------------------------------------------------------------------
// Mocks – knowledge resources require mocking in test context
// ---------------------------------------------------------------------------

jest.mock("../resources/brikette-knowledge.js", () => ({
  handleBriketteResourceRead: jest.fn(async (uri: string) => ({
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          faq: [
            { q: "What time is check-in?", a: "Check-in is from 2:30pm. Early bag drop from 10:30am." },
            { q: "Is breakfast included?", a: "Breakfast is served 8-10am daily in the dining room." },
            { q: "Do you have WiFi?", a: "Yes, free WiFi is available throughout the property." },
            { q: "Is luggage storage available?", a: "Yes, free luggage storage on arrival and departure days." },
            { q: "What time is checkout?", a: "Checkout is by 10:30am." },
          ],
          policies: {
            cancellation: "Non-refundable bookings cannot be cancelled or modified.",
            alcohol: "Outside alcohol is not permitted on premises.",
            age: "Age restrictions apply during peak season.",
          },
        }),
      },
    ],
  })),
}));

jest.mock("../resources/draft-guide.js", () => ({
  handleDraftGuideRead: jest.fn(async () => ({
    contents: [
      {
        uri: "brikette://draft-guide",
        mimeType: "application/json",
        text: "{}",
      },
    ],
  })),
}));

jest.mock("../resources/voice-examples.js", () => ({
  handleVoiceExamplesRead: jest.fn(async () => ({
    contents: [
      {
        uri: "brikette://voice-examples",
        mimeType: "application/json",
        text: "{}",
      },
    ],
  })),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PipelineFixture = {
  id: string;
  description: string;
  from: string;
  subject: string;
  body: string;
  scenarioType: "single-topic" | "multi-topic";
  expectedCategory: string;
  expectedMinQuestions: number;
};

type SourcesUsedEntry = {
  uri: string;
  citation: string;
  text: string;
  score: number;
  injected: boolean;
};

type InterpretResult = {
  normalized_text: string;
  language: string;
  intents: {
    questions: Array<{ text: string }>;
    requests: Array<{ text: string }>;
    confirmations: Array<{ text: string }>;
  };
  scenario: { category: string; confidence: number };
  escalation: { tier: "NONE" | "HIGH" | "CRITICAL"; triggers: string[]; confidence: number };
};

type GenerateResult = {
  draft: { bodyPlain: string; bodyHtml: string };
  answered_questions: string[];
  quality: { passed: boolean; failed_checks: string[]; warnings: string[] };
  sources_used?: SourcesUsedEntry[];
};

type QualityResult = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
  confidence: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

// ---------------------------------------------------------------------------
// Fixtures – synthetic labeled scenarios (inline, no production data)
// ---------------------------------------------------------------------------

const PIPELINE_FIXTURES: PipelineFixture[] = [
  // ── Single-topic (5 fixtures) ──────────────────────────────────────────────
  {
    id: "SGL-01",
    description: "Check-in time inquiry",
    from: "Alice Brown",
    subject: "Check-in question",
    body: "Hi there, what time can we check in? We are arriving by train around 1pm and want to make sure we plan accordingly.",
    scenarioType: "single-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 1,
  },
  {
    id: "SGL-02",
    description: "WiFi availability query",
    from: "Bob Chen",
    subject: "WiFi question",
    body: "Hello! Does the hostel have WiFi? We need to work remotely for part of our stay and need a reliable connection.",
    scenarioType: "single-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 1,
  },
  {
    id: "SGL-03",
    description: "Luggage storage after checkout",
    from: "Carol Davis",
    subject: "Bag storage",
    body: "Hi, we have a late flight on our departure day. Can we store our luggage with you after we check out until the evening?",
    scenarioType: "single-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 1,
  },
  {
    id: "SGL-04",
    description: "Cancellation policy request",
    from: "David Ellis",
    subject: "Cancellation inquiry",
    body: "Hello, I need to understand the cancellation policy for our booking. What happens if we need to cancel our reservation?",
    scenarioType: "single-topic",
    expectedCategory: "cancellation",
    expectedMinQuestions: 1,
  },
  {
    id: "SGL-05",
    description: "Late check-in feasibility",
    from: "Eva Ferreira",
    subject: "Late arrival",
    body: "Hi, our flight arrives at 11:30pm. Is it possible to check in that late? We do not want to miss our check-in window.",
    scenarioType: "single-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 1,
  },
  // ── Multi-topic (5 fixtures) ───────────────────────────────────────────────
  {
    id: "MLT-01",
    description: "Breakfast, WiFi, and check-in timing",
    from: "Fiona Grant",
    subject: "Pre-arrival questions",
    body: "Hello! We are very excited about our visit. Could you let us know: is breakfast included in our booking? Do you have WiFi available? And what time is check-in? Thank you so much for your help!",
    scenarioType: "multi-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 2,
  },
  {
    id: "MLT-02",
    description: "Checkout time and luggage storage",
    from: "George Harris",
    subject: "Checkout and bags",
    body: "Hi there, what time is checkout? We have an evening flight so we were wondering if we could store our luggage with you for the day after we check out.",
    scenarioType: "multi-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 2,
  },
  {
    id: "MLT-03",
    description: "Room availability and cancellation terms",
    from: "Hannah Irving",
    subject: "Availability and cancellation",
    body: "Hello, I am interested in booking two rooms in August. Can you tell me about availability, and also what your cancellation policy is in case our plans change?",
    scenarioType: "multi-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 2,
  },
  {
    id: "MLT-04",
    description: "Transport directions and early bag drop",
    from: "Ivan Jensen",
    subject: "Arrival questions",
    body: "Hi! We are arriving from the train station. How do we get to the hostel from there? Also, is it possible to drop our bags early in the morning before the official check-in time?",
    scenarioType: "multi-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 2,
  },
  {
    id: "MLT-05",
    description: "Group booking with breakfast and WiFi queries",
    from: "Julia Kim",
    subject: "Group stay queries",
    body: "Hi, we are a group of 5 people. Do you have rooms to accommodate all of us? We would also like to know if breakfast is available each morning and whether you have good WiFi for video calls.",
    scenarioType: "multi-topic",
    expectedCategory: "faq",
    expectedMinQuestions: 2,
  },
];

// ---------------------------------------------------------------------------
// TC-09-01: Fixture inventory check
// ---------------------------------------------------------------------------

describe("TASK-09: Fixture Inventory", () => {
  it("TC-09-01 has minimum single-topic and multi-topic fixture coverage", () => {
    const singleTopic = PIPELINE_FIXTURES.filter((f) => f.scenarioType === "single-topic");
    const multiTopic = PIPELINE_FIXTURES.filter((f) => f.scenarioType === "multi-topic");
    expect(singleTopic.length).toBeGreaterThanOrEqual(5);
    expect(multiTopic.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// TC-09-01 / TC-09-04: Coverage Evaluation Harness
// ---------------------------------------------------------------------------

describe("TASK-09: Coverage Evaluation Harness", () => {
  type HarnessResult = {
    id: string;
    scenarioType: string;
    category: string;
    qualityPassed: boolean;
    failedChecks: string[];
    coverageRate: number;
    sourcesUsedCount: number;
    injectedCount: number;
  };

  const results: HarnessResult[] = [];

  afterAll(() => {
    if (results.length === 0) {
      // TC-09-01: harness must run over populated fixtures
      expect(results.length).toBeGreaterThan(0);
      return;
    }

    const passCount = results.filter((r) => r.qualityPassed).length;
    const passRate = passCount / results.length;
    const avgCoverage =
      results.reduce((sum, r) => sum + r.coverageRate, 0) / results.length;
    const totalInjected = results.reduce((sum, r) => sum + r.injectedCount, 0);

    const byType = new Map<string, { total: number; passed: number }>();
    for (const r of results) {
      const entry = byType.get(r.scenarioType) ?? { total: 0, passed: 0 };
      entry.total++;
      if (r.qualityPassed) entry.passed++;
      byType.set(r.scenarioType, entry);
    }

    // TC-09-01: Emit coverage/escalation metric summary
    console.info("\n=== TASK-09 Pipeline Evaluation Report ===");
    console.info(`Fixtures tested:          ${results.length}`);
    console.info(`Quality pass rate:        ${passCount}/${results.length} (${(passRate * 100).toFixed(0)}%)`);
    console.info(`Avg question coverage:    ${(avgCoverage * 100).toFixed(0)}%`);
    console.info(`Knowledge injections:     ${totalInjected} across all fixtures`);
    console.info("\nBy scenario type:");
    for (const [type, data] of byType) {
      const rate = ((data.passed / data.total) * 100).toFixed(0);
      console.info(`  ${type}: ${data.passed}/${data.total} (${rate}%)`);
    }
    console.info("=== End TASK-09 Report ===\n");

    // TC-09-04: Quality gate enforcement
    expect(passRate).toBeGreaterThanOrEqual(0.9);
  });

  it.each(PIPELINE_FIXTURES.map((f) => [f.id, f.description, f] as const))(
    "%s: %s",
    async (_id, _desc, fixture) => {
      // Stage 1: Interpret
      const interpretResult = await handleDraftInterpretTool("draft_interpret", {
        body: fixture.body,
        subject: fixture.subject,
      });
      const actionPlan = parseResult<InterpretResult>(interpretResult);
      expect(actionPlan.normalized_text).toBeDefined();

      // Stage 2: Generate
      const generateResult = await handleDraftGenerateTool("draft_generate", {
        actionPlan,
        subject: fixture.subject,
        recipientName: fixture.from,
      });
      const generated = parseResult<GenerateResult>(
        generateResult as { content: Array<{ text: string }> }
      );

      // Basic structure assertions
      expect(generated.draft.bodyPlain.length).toBeGreaterThan(0);
      expect(generated.draft.bodyHtml).toContain("<!DOCTYPE html>");
      expect(Array.isArray(generated.sources_used)).toBe(true);

      // Coverage metric (reported only, not gated per-fixture)
      const coverage = evaluateQuestionCoverage(
        generated.draft.bodyPlain,
        actionPlan.intents.questions,
      );
      const coveredCount = coverage.filter(
        (c) => c.status === "covered" || c.status === "partial",
      ).length;
      const coverageRate =
        coverage.length === 0 ? 1 : coveredCount / coverage.length;

      const injectedCount = (generated.sources_used ?? []).filter(
        (s) => s.injected,
      ).length;

      results.push({
        id: fixture.id,
        scenarioType: fixture.scenarioType,
        category: actionPlan.scenario.category,
        qualityPassed: generated.quality.passed,
        failedChecks: generated.quality.failed_checks,
        coverageRate,
        sourcesUsedCount: (generated.sources_used ?? []).length,
        injectedCount,
      });
    },
  );
});

// ---------------------------------------------------------------------------
// TC-09-02: Known Regression Detection
// ---------------------------------------------------------------------------

describe("TASK-09: Known Regression Detection", () => {
  it("TC-09-02 quality check produces actionable named failure diagnostics", async () => {
    // Adversarial draft containing a prohibited claim ("availability confirmed")
    const prohibitedBody =
      "Availability confirmed for your dates. We look forward to hosting you. Best regards, Hostel Brikette";

    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN",
        intents: { questions: [] },
        workflow_triggers: { booking_monitor: false },
        scenario: { category: "faq" },
        thread_summary: { prior_commitments: [] },
      },
      draft: {
        bodyPlain: prohibitedBody,
        bodyHtml: `<!DOCTYPE html><html><body><p>${prohibitedBody}</p></body></html>`,
      },
    });

    const payload = parseResult<QualityResult>(result);

    // TC-09-02: pipeline correctly rejects the regression draft
    expect(payload.passed).toBe(false);

    // Diagnostics are actionable — each check is a named snake_case identifier
    expect(payload.failed_checks.length).toBeGreaterThan(0);
    for (const check of payload.failed_checks) {
      expect(check).toMatch(/^[a-z][a-z_]+$/);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-09-03: Command Contract Documentation
// ---------------------------------------------------------------------------

describe("TASK-09: Command Contract Documentation", () => {
  it("TC-09-03 governed runner command is present in docs/testing-policy.md", () => {
    const policy = readFileSync("docs/testing-policy.md", "utf-8");
    expect(policy).toContain("draft-pipeline.integration");
  });
});
