import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  buildCooldownPlan,
  computeRecheckAfter,
  isCooldownActive,
} from "../cooldown";
import type { TriageResult } from "../triage";

function makeTriageResult(overrides: Partial<TriageResult> = {}): TriageResult {
  return {
    score: 50,
    band: "medium",
    reasons: [],
    action: "HOLD_FOR_MANUAL_REVIEW",
    hardReject: false,
    ...overrides,
  };
}

describe("cooldown policy", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null recheck for permanent severity", () => {
    expect(computeRecheckAfter("permanent")).toBeNull();
  });

  it("uses days override for non-permanent severities", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

    expect(computeRecheckAfter("short_cooldown", 10)).toBe(
      "2026-02-11T00:00:00.000Z",
    );
  });

  it("builds permanent cooldown plan for hazmat triage rejects", () => {
    const plan = buildCooldownPlan(
      makeTriageResult({
        reasons: ["hazmat_keyword"],
        action: "REJECT_WITH_COOLDOWN",
        hardReject: true,
      }),
    );

    expect(plan.reasonCode).toBe("hazmat_keyword");
    expect(plan.severity).toBe("permanent");
    expect(plan.recheckAfter).toBeNull();
  });

  it("falls back to low_signal policy for non-hard-reject triage", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

    const plan = buildCooldownPlan(
      makeTriageResult({
        reasons: ["unknown_reason"],
        action: "REJECT_WITH_COOLDOWN",
        hardReject: false,
      }),
    );

    expect(plan.reasonCode).toBe("low_signal");
    expect(plan.severity).toBe("short_cooldown");
    expect(plan.recheckAfter).toBe("2026-02-22T00:00:00.000Z");
  });

  it("evaluates cooldown activity for permanent, invalid, past, and future windows", () => {
    const now = new Date("2026-02-15T00:00:00.000Z");

    expect(isCooldownActive("permanent", null, now)).toBe(true);
    expect(isCooldownActive("short_cooldown", "not-a-date", now)).toBe(true);
    expect(isCooldownActive("short_cooldown", "2026-02-14T23:59:59.000Z", now)).toBe(false);
    expect(isCooldownActive("short_cooldown", "2026-02-15T00:00:01.000Z", now)).toBe(true);
  });
});
