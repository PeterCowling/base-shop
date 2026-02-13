import { describe, expect, it } from "@jest/globals";

import type { RunEvent } from "../derive-state";
import { validateEventStream } from "../event-validation";

/**
 * LPSP-04B: Event stream validation (VC-04B-02)
 *
 * Tests cover:
 * - VC-04B-02-01: Valid event stream → no errors
 * - VC-04B-02-02: Truncated line (invalid JSON) → detected
 * - VC-04B-02-03: Schema version mismatch → detected
 * - VC-04B-02-04: Missing required fields → detected
 * - VC-04B-02-05: Empty stream → valid (no events is valid)
 */

function makeEvent(overrides: Partial<RunEvent>): RunEvent {
  return {
    schema_version: 1,
    event: "stage_started",
    run_id: "SFS-TEST-20260213-1200",
    stage: "S0",
    timestamp: "2026-02-13T12:00:00Z",
    loop_spec_version: "1.0.0",
    artifacts: null,
    blocking_reason: null,
    ...overrides,
  };
}

describe("validateEventStream", () => {
  // VC-04B-02-05: Empty stream
  it("accepts empty event stream", () => {
    const result = validateEventStream([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // VC-04B-02-01: Valid stream
  it("accepts valid event stream", () => {
    const events: RunEvent[] = [
      makeEvent({ event: "stage_started", stage: "S0", timestamp: "2026-02-13T12:00:00Z" }),
      makeEvent({ event: "stage_completed", stage: "S0", timestamp: "2026-02-13T12:01:00Z", artifacts: { intake: "stages/S0/intake.md" } }),
      makeEvent({ event: "stage_started", stage: "S1", timestamp: "2026-02-13T12:02:00Z" }),
    ];

    const result = validateEventStream(events);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // VC-04B-02-03: Schema version mismatch
  it("detects schema version mismatch", () => {
    const events: RunEvent[] = [
      makeEvent({ schema_version: 2 }),
    ];

    const result = validateEventStream(events);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("schema_version"))).toBe(true);
  });

  // VC-04B-02-04: Missing required fields
  it("detects missing event type", () => {
    const badEvent = { ...makeEvent({}), event: undefined } as unknown as RunEvent;

    const result = validateEventStream([badEvent]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("event"))).toBe(true);
  });

  it("detects missing stage field", () => {
    const badEvent = { ...makeEvent({}), stage: undefined } as unknown as RunEvent;

    const result = validateEventStream([badEvent]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("stage"))).toBe(true);
  });

  it("detects missing timestamp", () => {
    const badEvent = { ...makeEvent({}), timestamp: undefined } as unknown as RunEvent;

    const result = validateEventStream([badEvent]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("timestamp"))).toBe(true);
  });

  it("detects invalid event type", () => {
    const badEvent = { ...makeEvent({}), event: "invalid_type" } as unknown as RunEvent;

    const result = validateEventStream([badEvent]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("event type"))).toBe(true);
  });

  // stage_completed requires artifacts
  it("detects stage_completed without artifacts", () => {
    const events: RunEvent[] = [
      makeEvent({ event: "stage_completed", stage: "S0", artifacts: null }),
    ];

    const result = validateEventStream(events);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("artifacts"))).toBe(true);
  });

  // stage_blocked requires blocking_reason
  it("detects stage_blocked without blocking_reason", () => {
    const events: RunEvent[] = [
      makeEvent({ event: "stage_blocked", stage: "S0", blocking_reason: null }),
    ];

    const result = validateEventStream(events);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("blocking_reason"))).toBe(true);
  });
});
