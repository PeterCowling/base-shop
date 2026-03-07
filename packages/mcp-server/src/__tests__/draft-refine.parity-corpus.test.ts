/** @jest-environment node */

import { handleDraftRefineTool } from "../tools/draft-refine";

jest.mock("../utils/signal-events.js", () => ({
  ...jest.requireActual("../utils/signal-events.js"),
  appendJsonlEvent: jest.fn(() => Promise.resolve()),
}));

type RefinePayload = {
  quality: {
    passed: boolean;
    failed_checks: string[];
    warnings: string[];
  };
};

function parsePayload(result: { content: Array<{ text: string }> }): RefinePayload {
  return JSON.parse(result.content[0].text) as RefinePayload;
}

const ACTION_PLAN = {
  language: "EN" as const,
  intents: {
    questions: [],
    requests: [],
  },
  scenario: { category: "faq" },
  workflow_triggers: {
    booking_action_required: false,
    booking_context: false,
  },
};

const CORPUS: string[] = [
  "Check-in is from 2:30pm.",
  "Hello guest, breakfast is served from 8 to 10.",
  "Please see our policy details before arrival.",
  "WiFi is available in all rooms.",
  "Luggage storage is possible after checkout.",
  "Thank you for contacting us regarding late arrival.",
  "Our team can help with transportation options.",
  "You can access the building using the code we provide on arrival.",
  "Best regards, Hostel Brikette",
  "Availability confirmed for your dates.",
];

describe("draft_refine deterministic parity corpus", () => {
  it.each(CORPUS.map((body, idx) => [idx + 1, body]))(
    "fixture %i: deterministic quality is never worse than baseline",
    async (_idx, originalBodyPlain) => {
      const baselineResult = await handleDraftRefineTool("draft_refine", {
        actionPlan: ACTION_PLAN,
        draft_id: `parity-baseline-${_idx}`,
        refinement_mode: "external",
        originalBodyPlain,
        refinedBodyPlain: originalBodyPlain,
      });

      const deterministicResult = await handleDraftRefineTool("draft_refine", {
        actionPlan: ACTION_PLAN,
        draft_id: `parity-deterministic-${_idx}`,
        refinement_mode: "deterministic_only",
        originalBodyPlain,
      });

      const baseline = parsePayload(
        baselineResult as { content: Array<{ text: string }> },
      );
      const deterministic = parsePayload(
        deterministicResult as { content: Array<{ text: string }> },
      );

      if (baseline.quality.passed) {
        expect(deterministic.quality.passed).toBe(true);
      }

      expect(deterministic.quality.failed_checks.length).toBeLessThanOrEqual(
        baseline.quality.failed_checks.length,
      );
    },
  );
});
