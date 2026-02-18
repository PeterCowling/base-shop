/**
 * Stage Label Rename — TASK-09 SPIKE Stability + Guard Tests
 *
 * SPIKE FINDING (2026-02-18): Option B label rename scope = ZERO.
 * All 17 stage labels are build-sequence node names (Intake, Readiness, Forecast, …).
 * None contain deprecated v1 workstream long-form names. No label strings need to
 * change in stage-operator-dictionary.yaml as a result of the v2 workstream rename.
 *
 * This file therefore contains:
 *   (A) STABILITY tests — all 17 short + long labels resolve correctly today.
 *       These act as a regression guard: if any label is inadvertently renamed they fail.
 *   (B) DEPRECATION GUARD tests — deprecated workstream names are not resolvable as labels.
 *   (C) ALIAS MECHANISM tests — all 44 canonical aliases round-trip via resolveByAlias.
 *   (D) RED GATE SHAPES — it.todo() stubs showing the TDD pattern that WOULD be used
 *       if Option B had required new aliases. Kept as documentation; not implemented.
 */

import { resolveByAlias, resolveByLabel } from "../stage-addressing.js";

// ── (A) STABILITY: All label_operator_short strings resolve ─────────────────

describe("Label stability — label_operator_short", () => {
  const SHORT_LABELS: [string, string][] = [
    ["Intake", "S0"],
    ["Readiness check", "S1"],
    ["Measurement setup", "S1B"],
    ["Historical baseline", "S2A"],
    ["Market intelligence", "S2"],
    ["Offer design", "S2B"],
    ["Forecast", "S3"],
    ["Channel strategy + GTM", "S6B"],
    ["Baseline merge", "S4"],
    ["Prioritize", "S5A"],
    ["BOS sync", "S5B"],
    ["Site-upgrade synthesis", "S6"],
    ["Fact-find", "S7"],
    ["Plan", "S8"],
    ["Build", "S9"],
    ["QA gates", "S9B"],
    ["Weekly decision", "S10"],
  ];

  it.each(SHORT_LABELS)(
    "label_operator_short %s resolves to %s",
    (label, expectedId) => {
      const result = resolveByLabel(label);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.stageId).toBe(expectedId);
      }
    }
  );
});

// ── (A) STABILITY: All label_operator_long strings resolve ──────────────────

describe("Label stability — label_operator_long", () => {
  const LONG_LABELS: [string, string][] = [
    ["S0 — Intake", "S0"],
    ["S1 — Readiness", "S1"],
    ["S1B — Measurement bootstrap (pre-website)", "S1B"],
    ["S2A — Historical baseline (website-live)", "S2A"],
    ["S2 — Market intelligence", "S2"],
    ["S2B — Offer design", "S2B"],
    ["S3 — Forecast", "S3"],
    ["S6B — Channel strategy + GTM", "S6B"],
    ["S4 — Baseline merge", "S4"],
    ["S5A — Prioritize", "S5A"],
    ["S5B — BOS sync", "S5B"],
    ["S6 — Site-upgrade synthesis", "S6"],
    ["S7 — Fact-find", "S7"],
    ["S8 — Plan", "S8"],
    ["S9 — Build", "S9"],
    ["S9B — QA gates", "S9B"],
    ["S10 — Weekly readout + experiments", "S10"],
  ];

  it.each(LONG_LABELS)(
    "label_operator_long %s resolves to %s",
    (label, expectedId) => {
      const result = resolveByLabel(label);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.stageId).toBe(expectedId);
      }
    }
  );
});

// ── (B) DEPRECATION GUARD: Deprecated v1 workstream names are not labels ────
//
// These strings appear in workstream-workflow-taxonomy-v2.md §5 as deprecated terms.
// They must never accidentally become resolvable stage labels.

describe("Deprecation guard — v1 workstream names are not stage labels", () => {
  const DEPRECATED_WORKSTREAM_NAMES = [
    "Go-to-Market and Distribution",      // v1 GTM long-form
    "Delivery Operations",                // v1 OPS long-form
    "Customer / Guest Experience and Support", // v1 CX long-form
    "Finance and Risk / Compliance",      // v1 FIN long-form
    "Data and Measurement",               // v1 DATA long-form
    "Domain: Customer Discovery",         // v1 section heading pattern
    "Domain: Go-to-Market",               // v1 section heading pattern
  ];

  it.each(DEPRECATED_WORKSTREAM_NAMES)(
    "deprecated term %s does not resolve as a label",
    (term) => {
      const result = resolveByLabel(term);
      expect(result.ok).toBe(false);
    }
  );
});

// ── (C) ALIAS MECHANISM: All 44 canonical aliases round-trip ────────────────

describe("Alias mechanism — all canonical aliases resolve", () => {
  const ALL_ALIASES: [string, string][] = [
    // S0
    ["intake", "S0"],
    ["s0", "S0"],
    // S1
    ["readiness", "S1"],
    ["s1", "S1"],
    // S1B
    ["measurement-bootstrap", "S1B"],
    ["measurement-setup", "S1B"],
    ["s1b", "S1B"],
    // S2A
    ["historical-baseline", "S2A"],
    ["baseline-history", "S2A"],
    ["s2a", "S2A"],
    // S2
    ["market-intelligence", "S2"],
    ["market-intel", "S2"],
    ["s2", "S2"],
    // S2B
    ["offer-design", "S2B"],
    ["offer", "S2B"],
    ["s2b", "S2B"],
    // S3
    ["forecast", "S3"],
    ["s3", "S3"],
    // S6B
    ["channel-strategy", "S6B"],
    ["channels", "S6B"],
    ["gtm", "S6B"],
    ["s6b", "S6B"],
    // S4
    ["baseline-merge", "S4"],
    ["s4", "S4"],
    // S5A
    ["prioritize", "S5A"],
    ["s5a", "S5A"],
    // S5B
    ["bos-sync", "S5B"],
    ["s5b", "S5B"],
    // S6
    ["site-upgrade", "S6"],
    ["site-upgrade-synthesis", "S6"],
    ["s6", "S6"],
    // S7
    ["fact-find", "S7"],
    ["s7", "S7"],
    // S8
    ["plan", "S8"],
    ["s8", "S8"],
    // S9
    ["build", "S9"],
    ["s9", "S9"],
    // S9B
    ["qa-gates", "S9B"],
    ["qa", "S9B"],
    ["s9b", "S9B"],
    // S10
    ["weekly-readout", "S10"],
    ["weekly-decision", "S10"],
    ["weekly", "S10"],
    ["s10", "S10"],
  ];

  it.each(ALL_ALIASES)(
    "alias %s resolves to %s",
    (alias, expectedId) => {
      const result = resolveByAlias(alias);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.stageId).toBe(expectedId);
      }
    }
  );

  it("alias lookup is case-insensitive", () => {
    const result = resolveByAlias("GTM");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("S6B");
    }
  });

  it("unknown alias returns ok:false", () => {
    const result = resolveByAlias("nonexistent-stage-xyz");
    expect(result.ok).toBe(false);
  });
});

// ── (D) RED GATE SHAPES (it.todo) ───────────────────────────────────────────
//
// SPIKE FINDING: Option B rename scope = ZERO. No new aliases are required.
// These stubs show what TDD-gated tests would look like if Option B DID require
// new alias strings. They are intentionally not implemented.

describe("RED gate shapes — hypothetical new-alias tests (scope=zero, not implemented)", () => {
  // Pattern: if S6B gained a "gtm-strategy" alias as part of a label rename,
  // you would write:
  it.todo(
    "resolveByAlias('gtm-strategy') resolves to S6B [WOULD BE RED until alias added]"
  );

  // Pattern: if an analytics-setup stage were added, you would write:
  it.todo(
    "resolveByAlias('analytics-setup') resolves to S1B or S1 [WOULD BE RED until alias added]"
  );
});
