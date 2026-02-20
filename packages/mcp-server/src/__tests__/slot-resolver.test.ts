/** @jest-environment node */

/**
 * TASK-03: Tests for the SlotResolver utility.
 *
 * TC-01: resolveSlots fills a GREETING slot
 * TC-02: resolveSlots fills a KNOWLEDGE_INJECTION slot mid-body
 * TC-03: resolveSlots silently removes an unresolved CTA slot
 * TC-04: resolveSlots passes through a body with no slots unchanged
 * TC-05: resolveSlots is idempotent (same result on second call)
 * TC-06: Lowercase slot names do NOT match (convention enforcement)
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="slot-resolver" --no-coverage
 */

import { resolveSlots } from "../utils/slot-resolver";

// ---------------------------------------------------------------------------
// TC-01: Fill a GREETING slot
// ---------------------------------------------------------------------------

describe("TASK-03: TC-01 resolveSlots fills GREETING slot", () => {
  it("replaces {{SLOT:GREETING}} with the provided greeting", () => {
    const result = resolveSlots("{{SLOT:GREETING}}\nBody.", { GREETING: "Dear Maria," });
    expect(result).toBe("Dear Maria,\nBody.");
  });
});

// ---------------------------------------------------------------------------
// TC-02: Fill KNOWLEDGE_INJECTION slot mid-body
// ---------------------------------------------------------------------------

describe("TASK-03: TC-02 resolveSlots fills KNOWLEDGE_INJECTION slot", () => {
  it("replaces {{SLOT:KNOWLEDGE_INJECTION}} in the middle of a body", () => {
    const result = resolveSlots(
      "Body. {{SLOT:KNOWLEDGE_INJECTION}} More.",
      { KNOWLEDGE_INJECTION: "Snippet here." },
    );
    expect(result).toBe("Body. Snippet here. More.");
  });
});

// ---------------------------------------------------------------------------
// TC-03: Silently remove an unresolved slot
// ---------------------------------------------------------------------------

describe("TASK-03: TC-03 resolveSlots removes unresolved slots", () => {
  it("removes {{SLOT:CTA}} when key is absent from slots map", () => {
    const result = resolveSlots("Body. {{SLOT:CTA}}", {});
    // The slot should be removed; trailing space/artifact is acceptable
    expect(result).not.toContain("{{SLOT:CTA}}");
  });

  it("removes {{SLOT:CTA}} when value is null", () => {
    const result = resolveSlots("Body. {{SLOT:CTA}}", { CTA: null });
    expect(result).not.toContain("{{SLOT:CTA}}");
  });

  it("removes {{SLOT:CTA}} when value is undefined", () => {
    const result = resolveSlots("Body. {{SLOT:CTA}}", { CTA: undefined });
    expect(result).not.toContain("{{SLOT:CTA}}");
  });
});

// ---------------------------------------------------------------------------
// TC-04: Passthrough — no slots in body
// ---------------------------------------------------------------------------

describe("TASK-03: TC-04 resolveSlots passthrough when no slots in body", () => {
  it("returns body unchanged when it contains no slot markers", () => {
    const body = "No slots here.";
    const result = resolveSlots(body, { GREETING: "Dear X," });
    expect(result).toBe(body);
  });

  it("returns empty string unchanged", () => {
    expect(resolveSlots("", { GREETING: "Dear X," })).toBe("");
  });
});

// ---------------------------------------------------------------------------
// TC-05: Idempotent — same result on second call
// ---------------------------------------------------------------------------

describe("TASK-03: TC-05 resolveSlots is idempotent", () => {
  it("produces the same output when called twice with the same args", () => {
    const body = "{{SLOT:GREETING}}\nBody. {{SLOT:KNOWLEDGE_INJECTION}}";
    const slots = { GREETING: "Dear guest,", KNOWLEDGE_INJECTION: "Check-in is at 2:30pm." };

    const first = resolveSlots(body, slots);
    const second = resolveSlots(first, slots);
    expect(first).toBe(second);
  });
});

// ---------------------------------------------------------------------------
// TC-06: Lowercase slot names do NOT match
// ---------------------------------------------------------------------------

describe("TASK-03: TC-06 lowercase slot names do not match", () => {
  it("does not replace {{SLOT:greeting}} (lowercase slot name)", () => {
    const body = "{{SLOT:greeting}} some text";
    const result = resolveSlots(body, { greeting: "Dear X," });
    // lowercase slot name should remain literally in output (slot removed as unresolved)
    // The convention says uppercase only; lowercase should not match the regex
    expect(result).not.toContain("Dear X,");
  });

  it("does not replace {{SLOT:mixedCase}} (mixed case slot name)", () => {
    const body = "{{SLOT:mixedCase}} text";
    const result = resolveSlots(body, { mixedCase: "value" });
    expect(result).not.toContain("value");
  });
});
