/**
 * Stage Label Rename — TASK-09 SPIKE Stability + Guard Tests
 *
 * SPIKE FINDING (2026-02-18): Option B label rename scope = ZERO.
 * All 27 stage labels are build-sequence node names (Intake, Readiness, Forecast, …).
 * None contain deprecated v1 workstream long-form names. No label strings need to
 * change in stage-operator-dictionary.yaml as a result of the v2 workstream rename.
 *
 * Updated v1.9.0: DISCOVERY/DISCOVERY-01..05 stages added (was S0/S0A-S0E).
 * Updated v2.0.0: DISCOVERY expanded to 7 sub-stages (DISCOVERY-01..07). Added DISCOVERY-05
 *                 (Channel Plan), DISCOVERY-06 (Measure Plan). Former DISCOVERY-05 renamed DISCOVERY-07.
 * Updated v2.1.0: Added BRAND-01 (Brand strategy), BRAND-02 (Brand identity), BRAND (container) between DISCOVERY and S1.
 *
 * This file therefore contains:
 *   (A) STABILITY tests — all 27 short + long labels resolve correctly today.
 *       These act as a regression guard: if any label is inadvertently renamed they fail.
 *   (B) DEPRECATION GUARD tests — deprecated workstream names are not resolvable as labels.
 *   (C) ALIAS MECHANISM tests — all canonical aliases round-trip via resolveByAlias.
 *   (D) RED GATE SHAPES — it.todo() stubs showing the TDD pattern that WOULD be used
 *       if Option B had required new aliases. Kept as documentation; not implemented.
 */

import { resolveByAlias, resolveByLabel } from "../stage-addressing.js";

// ── (A) STABILITY: All label_operator_short strings resolve ─────────────────

describe("Label stability — label_operator_short", () => {
  const SHORT_LABELS: [string, string][] = [
    ["Problem framing", "DISCOVERY-01"],
    ["Solution-space scan", "DISCOVERY-02"],
    ["Option selection", "DISCOVERY-03"],
    ["Naming handoff", "DISCOVERY-04"],
    ["Channel Plan", "DISCOVERY-05"],
    ["Measure Plan", "DISCOVERY-06"],
    ["Operator evidence", "DISCOVERY-07"],
    ["Intake", "DISCOVERY"],
    ["Brand-01", "BRAND-01"],
    ["Brand-02", "BRAND-02"],
    ["Brand", "BRAND"],
    ["Readiness check", "S1"],
    ["Measure", "S1B"],
    ["Results", "S2A"],
    ["Market intelligence", "S2"],
    ["Offer design", "S2B"],
    ["Forecast", "S3"],
    ["Channel strategy + GTM", "S6B"],
    ["Baseline merge", "S4"],
    ["Prioritize", "S5A"],
    ["BOS sync", "S5B"],
    ["Site-upgrade synthesis", "S6"],
    ["Do", "DO"],
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
    ["DISCOVERY-01 — Problem framing", "DISCOVERY-01"],
    ["DISCOVERY-02 — Solution-space scan", "DISCOVERY-02"],
    ["DISCOVERY-03 — Option selection", "DISCOVERY-03"],
    ["DISCOVERY-04 — Naming handoff", "DISCOVERY-04"],
    ["DISCOVERY-05 — Channel Plan", "DISCOVERY-05"],
    ["DISCOVERY-06 — Measure Plan", "DISCOVERY-06"],
    ["DISCOVERY-07 — Operator evidence", "DISCOVERY-07"],
    ["DISCOVERY — Intake", "DISCOVERY"],
    ["BRAND-01 — Brand strategy", "BRAND-01"],
    ["BRAND-02 — Brand identity", "BRAND-02"],
    ["BRAND — Brand", "BRAND"],
    ["S1 — Readiness", "S1"],
    ["S1B — Measure (pre-website)", "S1B"],
    ["S2A — Results (website-live)", "S2A"],
    ["S2 — Market intelligence", "S2"],
    ["S2B — Offer design", "S2B"],
    ["S3 — Forecast", "S3"],
    ["S6B — Channel strategy + GTM", "S6B"],
    ["S4 — Baseline merge", "S4"],
    ["S5A — Prioritize", "S5A"],
    ["S5B — BOS sync", "S5B"],
    ["S6 — Site-upgrade synthesis", "S6"],
    ["DO — Do (/lp-do-fact-find / /lp-do-plan / /lp-do-build)", "DO"],
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

// ── (C) ALIAS MECHANISM: All 50 canonical aliases round-trip ────────────────

describe("Alias mechanism — all canonical aliases resolve", () => {
  const ALL_ALIASES: [string, string][] = [
    // DISCOVERY-01..07
    ["problem-framing", "DISCOVERY-01"],
    ["discovery-01", "DISCOVERY-01"],
    ["solution-space", "DISCOVERY-02"],
    ["discovery-02", "DISCOVERY-02"],
    ["option-selection", "DISCOVERY-03"],
    ["discovery-03", "DISCOVERY-03"],
    ["naming-handoff", "DISCOVERY-04"],
    ["discovery-04", "DISCOVERY-04"],
    ["distribution-planning", "DISCOVERY-05"],
    ["discovery-05", "DISCOVERY-05"],
    ["channel-plan", "DISCOVERY-05"],
    ["measurement-plan", "DISCOVERY-06"],
    ["discovery-06", "DISCOVERY-06"],
    ["measure-plan", "DISCOVERY-06"],
    ["operator-evidence", "DISCOVERY-07"],
    ["our-stance", "DISCOVERY-07"],
    ["discovery-07", "DISCOVERY-07"],
    // DISCOVERY
    ["intake", "DISCOVERY"],
    ["discovery", "DISCOVERY"],
    // BRAND-01
    ["brand-strategy", "BRAND-01"],
    ["brand-01", "BRAND-01"],
    // BRAND-02
    ["brand-identity", "BRAND-02"],
    ["brand-02", "BRAND-02"],
    ["brand-dossier", "BRAND-02"],
    // BRAND
    ["brand", "BRAND"],
    ["brand-intake", "BRAND"],
    // S1
    ["readiness", "S1"],
    ["s1", "S1"],
    // S1B
    ["measure", "S1B"],
    ["measurement-bootstrap", "S1B"],
    ["measurement-setup", "S1B"],
    ["s1b", "S1B"],
    // S2A
    ["results", "S2A"],
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
    // DO (consolidated S7/S8/S9)
    ["fact-find", "DO"],
    ["s7", "DO"],
    ["plan", "DO"],
    ["s8", "DO"],
    ["build", "DO"],
    ["s9", "DO"],
    ["do", "DO"],
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
