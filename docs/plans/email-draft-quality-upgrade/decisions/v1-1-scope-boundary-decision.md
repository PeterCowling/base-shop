---
Type: Reference
Status: Active
---
# v1.1 Scope Boundary Decision

**Plan:** `docs/plans/email-draft-quality-upgrade/plan.md`
**Task:** TASK-00 (DECISION)
**Decided:** 2026-02-18
**Decided by:** Operator (Peter Cowling)
**Status:** Closed

---

## Decision Summary

| Question | Default | **Selected** | Notes |
|---|---|---|---|
| Include LLM refinement tool in this wave? | defer | **now** | Must be implemented via AI agent (Claude CLI or Codex) per operator constraint |
| `actionPlanVersion` format | integer | **semver** | Best long-term bet: minor bumps for additive changes, major for breaking |
| Locale policy for new templates | english-only | **english-only** | Confirmed default |

---

## Decision 1: LLM Refinement Tool — Include in This Wave (Option B)

**Selected:** Include `draft_refine` LLM stage in v1.1 wave.

**Operator constraint:** Implementation must be executed via AI coding agent (Claude CLI or Codex) following a planned task — not manual authoring.

**Rationale:** Operator wants semantic gap-filling in this wave, not deferred. The deterministic-first track (TASK-02..TASK-08) still proceeds first to establish the coverage baseline and regression harness (TASK-09). The LLM stage builds on top of that foundation.

**What this means for the plan:**
- Wave 7 (TASK-10) transitions from "optional LLM horizon checkpoint" to "LLM implementation readiness gate + kick-off."
- A new task `TASK-11` must be added (via `/lp-do-replan`) after TASK-10 to implement the `draft_refine` MCP tool.
- TASK-11 execution skill: `lp-do-build` + AI agent CLI execution constraint.
- TASK-10 acceptance must now include: explicit confirmation that TASK-09 regression harness covers LLM output assertions, and TASK-11 scope is defined with confidence ≥ 80%.

**Compatibility constraint introduced:**
- `draft_refine` must be an **additive** MCP tool — not a replacement for the deterministic pipeline.
- Output must carry a `refinement_applied: boolean` flag and `refinement_source: 'claude-cli' | 'codex' | 'none'` metadata.
- Fallback: if LLM call fails or latency exceeds threshold, pipeline must gracefully return the deterministic draft unchanged.

**Out of scope (still):**
- Replacing `draft_generate` or `draft_quality_check` with LLM-only logic.
- Gmail inbox orchestration changes.
- LLM-generated templates (templates remain static JSON).

---

## Decision 2: `actionPlanVersion` — Semver

**Selected:** `semver` string format (e.g., `"1.0.0"`, `"1.1.0"`, `"2.0.0"`).

**Rationale:** Semver communicates intent that static analysis tools and compatibility checks can reason about:
- **Minor bump** (1.0.0 → 1.1.0): additive change (e.g., `scenarios[]` addition) — consumers can safely ignore unknown fields.
- **Major bump** (1.x.x → 2.0.0): breaking change — consumers must update or reject.
- Aligns with npm/OpenAPI ecosystem expectations if the MCP schema is ever published externally.

**Compatibility contract for `scenario` + `scenarios[]`:**
- `actionPlanVersion: "1.0.0"` — legacy single `scenario` field; no `scenarios[]`.
- `actionPlanVersion: "1.1.0"` — additive: `scenarios[]` present; legacy `scenario` aliased to `scenarios[0]` for backwards compatibility.
- Any consumer checking `actionPlanVersion` must use semver `satisfies` semantics, not strict equality.
- The `scenario` field MUST remain populated while `actionPlanVersion` starts with `"1."`.

**Schema evolution policy:**
```
"1.1.0": scenarios[] added, scenario alias preserved
"1.2.0": (future) per-question ranking metadata added
"2.0.0": (future) scenario alias removed; scenarios[] is the only field
```

**Validation rule added to TASK-04:**
- `draft-interpret.ts` must set `actionPlanVersion: "1.1.0"` when `scenarios[]` is populated.
- `draft-generate.ts` and `draft-quality-check.ts` must handle both `"1.0.0"` and `"1.1.0"` payloads.

---

## Decision 3: Locale Policy — English Only

**Selected:** `english-only` — new templates added in TASK-03 are English only.

**Rationale:** Confirmed default. IT/ES locale template forks are explicitly out of scope for v1.1.

**What this means:**
- `email-templates.json` additions in TASK-03 have no locale field requirement beyond what currently exists.
- Template lint gate (TASK-03) does not need to enforce locale completeness.
- TASK-09 fixtures may include multilingual interpret tests but do not require multilingual template output.

---

## Downstream Compatibility Check

| Downstream task | Conflict with decisions? | Resolution |
|---|---|---|
| TASK-02: ops-inbox patch | None | Unblocked |
| TASK-03: templates + lint | None — english-only confirmed | Unblocked |
| TASK-04: `scenarios[]` model | Must use `actionPlanVersion: "1.1.0"` semver string | Updated in task scope below |
| TASK-05: shared coverage module | None | Unblocked |
| TASK-06: per-question ranking | None | Unblocked after TASK-03+04 |
| TASK-07: knowledge injection | None | Unblocked after TASK-05+06 |
| TASK-08: implicit request extraction | None | Unblocked after TASK-04 |
| TASK-09: evaluation harness | Must add LLM output assertion placeholders (stub) for TASK-11 | Noted in scope |
| TASK-10: checkpoint | Must now include TASK-11 scope definition as acceptance criterion | Updated |

**No conflicting interpretations remain.** Decision closes.

---

## Rollout Trigger Criteria for LLM Wave (TASK-11)

TASK-11 (`draft_refine` implementation) may proceed when ALL of:
1. TASK-09 regression harness is stable (≥ 2 consecutive CI runs with zero flaky failures).
2. TASK-09 `question_coverage_rate` baseline is measured and locked.
3. TASK-10 checkpoint is complete and TASK-11 scope document is approved.
4. A Claude model is available via CLI with tool-use support for the MCP context window.

---

## Explicit Out-of-Scope List (v1.1)

- Replacing deterministic pipeline tools with LLM-only generators.
- Gmail inbox orchestration redesign.
- Locale-specific template forks (IT/ES).
- Async/streaming draft generation.
- User-facing UI changes.
- Any changes to prepayment or cancellation hard-rule logic beyond what is required for `scenarios[]` dominant/exclusive semantics.
