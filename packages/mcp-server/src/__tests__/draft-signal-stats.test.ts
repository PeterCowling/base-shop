/** @jest-environment node */

import { handleDraftSignalStatsTool } from "../tools/draft-signal-stats";
import { countSignalEvents } from "../utils/signal-events";

jest.mock("../utils/signal-events", () => ({
  countSignalEvents: jest.fn(),
}));

const countSignalEventsMock = countSignalEvents as jest.Mock;

function parsePayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    deterministic_health: {
      status: "insufficient_data" | "healthy" | "watch";
      reason: string;
    };
    deterministic_refinement: {
      total: number;
      quality_pass_rate: number | null;
    };
  };
}

describe("draft_signal_stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns insufficient_data when deterministic sample size is below threshold", async () => {
    countSignalEventsMock.mockResolvedValue({
      selection_count: 1,
      refinement_count: 1,
      joined_count: 1,
      events_since_last_calibration: 1,
      deterministic_refinement: {
        total: 4,
        applied: 2,
        selected: 2,
        fallback: 1,
        quality_observed: 4,
        quality_passed: 4,
        quality_pass_rate: 1,
      },
    });

    const result = await handleDraftSignalStatsTool("draft_signal_stats", {});
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.deterministic_health.status).toBe("insufficient_data");
  });

  it("returns healthy when deterministic pass rate meets target", async () => {
    countSignalEventsMock.mockResolvedValue({
      selection_count: 20,
      refinement_count: 20,
      joined_count: 20,
      events_since_last_calibration: 20,
      deterministic_refinement: {
        total: 12,
        applied: 9,
        selected: 9,
        fallback: 3,
        quality_observed: 12,
        quality_passed: 12,
        quality_pass_rate: 1,
      },
    });

    const result = await handleDraftSignalStatsTool("draft_signal_stats", {});
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.deterministic_health.status).toBe("healthy");
  });

  it("returns watch when deterministic pass rate is below target", async () => {
    countSignalEventsMock.mockResolvedValue({
      selection_count: 20,
      refinement_count: 20,
      joined_count: 20,
      events_since_last_calibration: 20,
      deterministic_refinement: {
        total: 15,
        applied: 10,
        selected: 10,
        fallback: 5,
        quality_observed: 15,
        quality_passed: 12,
        quality_pass_rate: 0.8,
      },
    });

    const result = await handleDraftSignalStatsTool("draft_signal_stats", {});
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.deterministic_health.status).toBe("watch");
  });

  it("returns error for unknown tool name", async () => {
    const result = await handleDraftSignalStatsTool("unknown", {});
    expect((result as { isError?: boolean }).isError).toBe(true);
  });

  it("returns watch when fallback rate is above threshold even if pass rate is high", async () => {
    countSignalEventsMock.mockResolvedValue({
      selection_count: 30,
      refinement_count: 30,
      joined_count: 30,
      events_since_last_calibration: 30,
      deterministic_refinement: {
        total: 20,
        applied: 8,
        selected: 8,
        fallback: 12,
        quality_observed: 20,
        quality_passed: 20,
        quality_pass_rate: 1,
      },
    });

    const result = await handleDraftSignalStatsTool("draft_signal_stats", {});
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.deterministic_health.status).toBe("watch");
  });
});
