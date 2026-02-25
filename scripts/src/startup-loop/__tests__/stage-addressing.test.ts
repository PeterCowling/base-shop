/**
 * Stage Addressing Resolver — Tests
 *
 * Covers VC-18 validation contracts:
 *   VC-01: Valid alias resolves to expected stage ID.
 *   VC-02: Unknown alias returns non-success result with deterministic suggestion list.
 *   VC-03: Near-match label does not resolve; exact canonical label resolves.
 *   VC-04: Canonical ID path behavior remains unchanged.
 */

import {
  resolveByAlias,
  resolveById,
  resolveByLabel,
  resolveStageId,
} from "../stage-addressing.js";
import stageOperatorMap from "../../../../docs/business-os/startup-loop/_generated/stage-operator-map.json";

// ── VC-04: Canonical ID path ────────────────────────────────────────────────

describe("resolveById (--stage <ID>)", () => {
  it("VC-04: resolves known canonical stage IDs", () => {
    const ids = stageOperatorMap.stages.map((stage) => stage.id);
    for (const id of ids) {
      const result = resolveById(id);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.stageId).toBe(id);
        expect(result.mode).toBe("id");
      }
    }
  });

  it("VC-04: ID resolution is case-insensitive", () => {
    const result = resolveById("sell-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SELL-01");
    }
  });

  it("VC-04: whitespace-padded ID resolves correctly", () => {
    const result = resolveById("  S3  ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SIGNALS-01");
    }
  });

  it("VC-04: legacy S10 ID resolves to map-canonical SIGNALS", () => {
    const result = resolveById("S10");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SIGNALS");
    }
  });

  it("returns fail for unknown ID with suggestions", () => {
    const result = resolveById("S99");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe("id");
      expect(result.reason).toContain("S99");
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
  });

  it("suggests alias path when input matches an alias", () => {
    // "intake" is an alias for ASSESSMENT-09
    const result = resolveById("intake");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Should suggest --stage ASSESSMENT-09 or --stage-alias intake
      const suggestionText = result.suggestions.join(" ");
      expect(suggestionText).toContain("ASSESSMENT-09");
    }
  });
});

// ── VC-01 + VC-02: Alias resolution (--stage-alias <slug>) ──────────────────

describe("resolveByAlias (--stage-alias <slug>)", () => {
  it("VC-01: valid alias 'intake' resolves to ASSESSMENT-09", () => {
    const result = resolveByAlias("intake");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("ASSESSMENT-09");
      expect(result.mode).toBe("alias");
    }
  });

  it("VC-01: valid alias 'offer' resolves to MARKET-06", () => {
    const result = resolveByAlias("offer");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("MARKET-06");
    }
  });

  it("VC-01: valid alias 'channels' resolves to SELL-01", () => {
    const result = resolveByAlias("channels");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SELL-01");
    }
  });

  it("VC-01: valid alias 'weekly-decision' resolves to SIGNALS", () => {
    const result = resolveByAlias("weekly-decision");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SIGNALS");
    }
  });

  it("VC-01: valid alias 'gtm' resolves to SELL-01", () => {
    const result = resolveByAlias("gtm");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SELL-01");
    }
  });

  it("VC-01: alias resolution is case-insensitive (normalised to lowercase)", () => {
    const result = resolveByAlias("OFFER-DESIGN");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("MARKET-06");
    }
  });

  it("VC-02: unknown alias returns non-success with deterministic suggestions", () => {
    const result = resolveByAlias("xyz-unknown-alias");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe("alias");
      expect(result.reason).toContain("xyz-unknown-alias");
      expect(Array.isArray(result.suggestions)).toBe(true);
    }
  });

  it("VC-02: near-miss alias 'channel' (not canonical) returns fail with suggestions", () => {
    // "channel" is not in alias_index; "channels" is
    const result = resolveByAlias("channel");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.ok).toBe(false);
      // suggestions should be deterministic (same output on repeated calls)
      const result2 = resolveByAlias("channel");
      expect(result.suggestions).toEqual(result2.suggestions);
    }
  });

  it("VC-02: suggestion list is deterministic (same input → same output)", () => {
    const r1 = resolveByAlias("forecas");
    const r2 = resolveByAlias("forecas");
    expect(r1.ok).toBe(r2.ok);
    if (!r1.ok && !r2.ok) {
      expect(r1.suggestions).toEqual(r2.suggestions);
    }
  });
});

// ── VC-03: Label resolution (--stage-label <text>) ──────────────────────────

describe("resolveByLabel (--stage-label <text>)", () => {
  it("VC-03: exact label_operator_short resolves correctly", () => {
    const result = resolveByLabel("Forecast");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SIGNALS-01");
      expect(result.mode).toBe("label");
    }
  });

  it("VC-03: exact label_operator_long resolves correctly", () => {
    const result = resolveByLabel("SIGNALS-01 — Forecast");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SIGNALS-01");
    }
  });

  it("VC-03: near-match label does NOT resolve (fail-closed)", () => {
    // "Forecast" resolves but "forecast" (lowercase) must not
    const result = resolveByLabel("forecast");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe("label");
      expect(result.reason).toContain("forecast");
    }
  });

  it("VC-03: label with extra space does NOT resolve (fail-closed)", () => {
    const result = resolveByLabel("Forecast ");
    expect(result.ok).toBe(false);
  });

  it("VC-03: truncated label does NOT resolve (fail-closed)", () => {
    // "Foreca" is not a canonical label
    const result = resolveByLabel("Foreca");
    expect(result.ok).toBe(false);
  });

  it("VC-03: fail result includes canonical label suggestions", () => {
    const result = resolveByLabel("unknown label text");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.suggestions.length).toBeGreaterThan(0);
      // At least one suggestion should be a known canonical label
      expect(result.suggestions.some((s) => s.includes("Intake") || s.includes("stage"))).toBe(true);
    }
  });

  it("resolves 'Channel strategy + GTM' (SELL-01 short label)", () => {
    const result = resolveByLabel("Channel strategy + GTM");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SELL-01");
    }
  });

  it("resolves 'Intake' (ASSESSMENT-09 short label)", () => {
    const result = resolveByLabel("Intake");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("ASSESSMENT-09");
    }
  });

  it("resolves 'Signals' (SIGNALS short label)", () => {
    const result = resolveByLabel("Signals");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SIGNALS");
    }
  });
});

// ── resolveStageId (entry point) ────────────────────────────────────────────

describe("resolveStageId (entry point)", () => {
  it("dispatches id mode correctly", () => {
    expect(resolveStageId("DO", "id")).toEqual({ ok: true, stageId: "DO", mode: "id" });
  });

  it("dispatches alias mode correctly", () => {
    const r = resolveStageId("weekly", "alias");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stageId).toBe("SIGNALS");
    }
  });

  it("dispatches label mode correctly", () => {
    const r = resolveStageId("Agent-Setup", "label");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stageId).toBe("MEASURE-01");
    }
  });

  it("fail result from resolveStageId includes mode and input", () => {
    const r = resolveStageId("bad-alias", "alias");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.mode).toBe("alias");
      expect(r.input).toBe("bad-alias");
    }
  });
});
