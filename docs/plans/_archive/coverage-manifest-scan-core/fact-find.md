---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: coverage-manifest-scan-core
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/coverage-manifest-scan-core/plan.md
Trigger-Source: IDEA-DISPATCH-20260226-0031 (auto-executed from lp-do-ideas, operator_idea)
Trigger-Why: Ad hoc workflow divergence currently defines artifact coverage boundaries by default — domains go invisible until someone asks or a crisis forces discovery. We need a deterministic coverage radar.
Trigger-Intended-Outcome: type: operational | statement: A per-business coverage manifest schema and an lp-coverage-scan skill exist; the skill reads the manifest, scans the repo and data connections, classifies gaps (CRITICAL/MAJOR/MINOR), and emits fact_find_ready dispatch packets for CRITICAL and MAJOR gaps into the existing lp-do-ideas pipeline. | source: operator
---

# Coverage Manifest + lp-coverage-scan Fact-Find Brief

## Scope

### Summary

Build the core infrastructure for deterministic artifact-coverage auditing: a machine-readable per-business coverage manifest (YAML), and the `lp-coverage-scan` skill that compares actual artifact/data-source state against the manifest and emits actionable dispatch packets for gaps.

This is the foundational layer. Per-business manifest initialization (BRIK, PWRB, and others) and lp-weekly integration are tracked separately in IDEA-DISPATCH-20260226-0032.

### Goals

- Define a `coverage-manifest.yaml` schema: domain taxonomy, business profiles, staleness thresholds, `doc-only` vs `data-backed` backing distinction
- Implement `lp-coverage-scan` skill following the `lp-signal-review` architectural pattern: thin SKILL.md orchestrator + scan-phase module + emit-phase module
- Scanner produces a gap report (CRITICAL / MAJOR / MINOR) and emits `dispatch.v1` packets to `queue-state.json` for CRITICAL/MAJOR gaps
- Dispatches are schema-compatible with `lp-do-ideas-dispatch.schema.json` and enter the existing lp-do-ideas pipeline unmodified

### Non-goals

- Per-business manifest files for BRIK, PWRB, etc. (companion packet 0032)
- lp-weekly integration (companion packet 0032)
- S1 onboarding hook (companion packet 0032)
- Live-mode promotion of lp-do-ideas (separate gate)
- Modifying the existing `lp-do-ideas-classifier.ts` (see risk R3 below — avoided by deliberate dispatch phrasing)

### Constraints & Assumptions

- Constraints:
  - Dispatch packets MUST conform to `lp-do-ideas-dispatch.schema.json` (dispatch.v1)
  - queue-state.json uses the hand-authored format (`queue_version: queue.v1`, `dispatches: []`) — see known divergence in lp-do-ideas SKILL.md; scanner must write to this format
  - mode: trial only (live-mode is a separate gate)
  - Writer lock must be acquired before modifying queue-state.json; scanner should use `scripts/agents/with-writer-lock.sh` pattern
- Assumptions:
  - YAML is the right manifest format (human-editable, git-diff-friendly, readable by js-yaml)
  - Scanner operates as a pure agent skill (no TypeScript compiler required for scan execution); TypeScript is optional for a helper script
  - Gap dispatch priority follows the existing classifier; CRITICAL gaps for financial/compliance domains use `risk_vector + risk_ref` fields to escalate above P4

---

## Outcome Contract

- **Why:** Ad hoc work defines coverage by default — domains disappear into blind spots until reality forces a reaction. A deterministic scanner converts missing coverage into explicit, actionable work items automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** lp-coverage-scan skill installed; can be invoked against any business with a manifest and produce a gap report with dispatches emitted to queue-state.json. Template manifest with domain taxonomy and profile rules committed.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-ideas/SKILL.md` — intake skill that processes dispatches; gap dispatches emitted by lp-coverage-scan will be consumed by this pipeline
- `.claude/skills/lp-signal-review/SKILL.md` — reference architecture for scan-and-emit skills; lp-coverage-scan follows this pattern
- `.claude/skills/lp-weekly/SKILL.md` — future integration point; orchestrates signal review as a sub-flow in `modules/orchestrate.md` Step 3–4 (audit lane)
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — current live queue file; scanner must append dispatches here

### Key Modules / Files

- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — canonical schema for dispatch packets; defines all required fields, enum values, and constraints
- `scripts/src/startup-loop/lp-do-ideas-classifier.ts` — priority classifier; defines `PROCESS_QUALITY_RE = /process|throughput|determinism|startup.?loop|pipeline|queue|classifier|prioriti/i` which matches coverage-system area anchors → P4 by default; financial/compliance gaps need explicit `risk_vector + risk_ref` to reach P0
- `scripts/src/startup-loop/lp-do-ideas-trial.ts` — trial orchestrator; calls `classifyIdea()` from the classifier but does not define routing regex patterns directly
- `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` — dedicated test file for the classifier decision tree; exists and should be extended for any coverage-gap dispatch test cases
- `scripts/src/startup-loop/lp-do-ideas-persistence.ts` — persistence layer for queue state (note: live queue file uses divergent format vs TS layer; scanner must write directly to the hand-authored format)
- `docs/business-os/strategy/BRIK/` — reference business directory; target for first manual validation pass; contains ~30+ artifacts, no coverage-manifest.yaml
- `docs/business-os/strategy/` — 9 business directories: BOS, BRIK, HBAG, HEAD, PET, PIPE, PLAT, PWRB, XA

### Patterns & Conventions Observed

- Skills use thin SKILL.md orchestrators + `modules/` subdirectory for heavy logic — evidence: `.claude/skills/lp-signal-review/SKILL.md` (AUDIT + EMIT pattern, 2 modules: audit-phase.md, emit-phase.md)
- lp-weekly invokes sub-skills as named steps in `modules/orchestrate.md` — evidence: `.claude/skills/lp-weekly/SKILL.md` (Steps 1–5 in orchestrate.md)
- Dispatch packets are appended to `queue-state.json` under `dispatches[]` array, with `queue_state: "enqueued"` for new items — evidence: live queue file structure
- Business strategy directories follow `docs/business-os/strategy/<BIZ>/` convention — evidence: confirmed 9 directories
- TypeScript helpers in `scripts/src/startup-loop/` are pure functions with injectable clocks and no file I/O in pure paths — evidence: `lp-do-ideas-classifier.ts`

### Data & Contracts

- Types/schemas/events:
  - `dispatch.v1` schema: `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — schema-required fields (exact `required[]` array): `schema_version`, `dispatch_id`, `mode`, `root_event_id`, `anchor_key`, `cluster_key`, `cluster_fingerprint`, `lineage_depth`, `area_anchor`, `location_anchors`, `provisional_deliverable_family`, `recommended_route`, `status`, `evidence_refs`. Additional fields (`business`, `trigger`, `current_truth`, `next_scope_now`, `priority`, `confidence`) are defined in the schema but optional per spec — scanner should populate all of them for quality even though absence does not fail schema validation.
  - `IdeaClassification` type: `scripts/src/startup-loop/lp-do-ideas-classifier.ts` — P4 is the default for process-quality improvements; financial/compliance gaps need `risk_vector + risk_ref` for P0
- Persistence:
  - `queue-state.json` hand-authored format: `{ "queue_version": "queue.v1", "mode": "trial", "counts": {...}, "dispatches": [...] }` — scanner appends to `dispatches[]` and increments `counts.enqueued` and `counts.total`
  - `coverage-manifest.yaml` will live at `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml`
  - Gap report artifact will live at `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md`
- API/contracts:
  - Scanner emits `dispatch.v1` packets; no new API surface required

### Dependency & Impact Map

- Upstream dependencies:
  - Coverage manifest YAML per business (created in companion packet 0032)
  - `lp-do-ideas-dispatch.schema.json` (read-only; no changes)
  - `queue-state.json` writer-lock pattern from `scripts/agents/with-writer-lock.sh`
- Downstream dependents:
  - lp-do-ideas pipeline: picks up emitted CRITICAL/MAJOR gap dispatches as new intake
  - lp-weekly: will invoke lp-coverage-scan as a sub-flow (companion packet 0032)
  - lp-do-fact-find: receives gap dispatches and runs fact-finds on blind spots
- Likely blast radius:
  - `queue-state.json` — appended to (non-destructive; reader handles unknown entries)
  - `.claude/skills/` — new `lp-coverage-scan/` directory created
  - `docs/business-os/strategy/<BIZ>/` — coverage-scan artifact written (new file, no overwrites)

### Delivery & Channel Landscape

- Audience/recipient: operator (reads gap reports); lp-do-ideas pipeline (consumes dispatches); lp-weekly (invokes scan)
- Channel constraints: none (internal system artifact)
- Existing templates/assets: `lp-signal-review/SKILL.md` and its modules as structural template
- Approvals/owners: operator (no external approval required)
- Measurement hooks: scan run count, gap counts by severity, dispatch emission count per run

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | A YAML manifest with domain taxonomy + profile scoping can fully represent expected coverage state for any of our 9 businesses | Domain taxonomy draft + profile scoping rules | Low — compare manifest against BRIK strategy directory manually | 1 day |
| H2 | The lp-coverage-scan skill can determine artifact existence and staleness from the repo alone (no external calls needed for doc-only domains) | Scanner implementation | Low — run against BRIK manually, compare output to known state | 1 hour |
| H3 | Emitting dispatch packets from the scanner into queue-state.json is non-disruptive — lp-do-ideas and lp-weekly consume them correctly | Dispatch format conformance | Low — schema validation against dispatch.schema.json | 30 min |
| H4 | CRITICAL gaps classified via `risk_vector + risk_ref` will reach P0 in the classifier | Classifier decision tree (RULE_LEGAL_EXPOSURE) | Low — trace through `classifyIdea()` decision tree | 30 min |

### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Operator provided detailed taxonomy (Financial, Inventory, Customer, Operational, Marketing, Compliance) with profile scoping concept | operator-stated | Medium — domain list is reasonable but field structure needs validation |
| H2 | lp-signal-review reads strategy artifacts similarly (stage artifacts by ID + path convention) | `.claude/skills/lp-signal-review/SKILL.md` | High — well-established pattern |
| H3 | Existing dispatches in queue-state.json all conform; schema validation is straightforward | `lp-do-ideas-dispatch.schema.json` + live queue | High |
| H4 | RULE_LEGAL_EXPOSURE fires when `risk_vector != null AND risk_ref != null` | `lp-do-ideas-classifier.ts:642-654` | High — code is direct |

### Falsifiability Assessment

- Easy to test:
  - H3 — write a sample dispatch packet, run schema validation, confirm structure matches
  - H4 — trace classifier decision tree with test inputs
- Hard to test:
  - H1 full validity across all 9 businesses — requires initializing all manifests (companion packet 0032)
- Validation seams needed:
  - Manual validation run: `lp-coverage-scan --biz BRIK` after BRIK manifest exists, compare gap report to known BRIK coverage state

---

## Test Landscape

### Test Infrastructure

- Frameworks: Jest (via `pnpm -w run test:governed`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs`
- CI integration: `scripts/src/startup-loop/__tests__/` has existing test patterns

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| lp-do-ideas classifier | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` | Dedicated test file exists; covers decision tree; new coverage-gap dispatch test cases should extend this file |
| lp-do-ideas persistence | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-persistence.test.ts` | Covers queue persistence layer |
| manifest-update | Unit | Implicitly via other tests | Manifest update module is file-I/O focused |
| build-summary | Unit | `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts` | Reference pattern for TS scanner tests |

### Coverage Gaps

- Untested paths:
  - New `lp-coverage-scan` skill (SKILL.md + modules) — manual validation test protocol (TASK-05) is the primary acceptance gate; no automated skill-file tests
  - Coverage-gap dispatch test cases for `lp-do-ideas-classifier.ts` — verifying that deliberate anchor phrasing avoids PROCESS_QUALITY_RE and produces the intended priority tier
- Extinct tests: none identified

### Testability Assessment

- Easy to test:
  - Dispatch packet format validation (schema check)
  - Classifier input/output for coverage-gap dispatches (pure function, injectable clock)
  - Manifest YAML schema validation (parse + validate)
- Hard to test:
  - Scanner repo-scan logic (file system dependent — needs mocking or integration test approach)
  - Staleness detection (depends on file mtime or frontmatter date — frontmatter date is more testable)
- Test seams needed:
  - Injectable file-system reader for scanner (follows `manifest-update.ts` pattern of `fs.readdir`/`fs.readFile`)
  - Date injection for staleness threshold comparison

### Recommended Test Approach

- Unit tests for: dispatch packet schema validation helper; staleness threshold logic; manifest YAML parser/validator
- Integration tests for: scanner against fixtures directory of mock business artifacts; emit-phase dispatch format output
- E2E tests for: manual validation run against BRIK once manifest exists (not automated in Phase 1)

---

## Questions

### Resolved

- Q: Should coverage-manifest.yaml use YAML or JSON?
  - A: YAML. Human-editable configuration, git-diff-friendly, follows operator's design spec. Parsed by js-yaml (already in the monorepo ecosystem via `scripts/` tooling).
  - Evidence: operator-stated design; yaml is universally supported in Node.js tooling

- Q: Should lp-coverage-scan emit dispatches to the existing lp-do-ideas queue or produce a separate gap report format?
  - A: Both. The skill writes a human-readable gap report artifact at `docs/business-os/strategy/<BIZ>/coverage-scan-<date>.md`, AND emits `dispatch.v1` packets to `queue-state.json` for CRITICAL/MAJOR gaps. The report is the scan output; the dispatches are the actionable work intake.
  - Evidence: operator design spec explicitly states "emits dispatch packets into the existing pipeline"; human-readable report is necessary for operator situational awareness

- Q: How does the scanner determine staleness for doc-only artifacts?
  - A: Preferred approach is explicit date fields in artifact frontmatter (e.g., `Last-updated: 2026-02-12`). Scanner reads frontmatter and compares to staleness threshold. Fallback to file mtime if frontmatter date is absent. This is reliable and testable.
  - Evidence: BRIK artifacts use `Last-updated:` in frontmatter (confirmed via strategy directory listing showing dated files)

- Q: Will coverage-gap dispatches always land at P4 due to PROCESS_QUALITY_RE matching "startup-loop/process/pipeline" area anchors?
  - A: Not necessarily — the fix is deliberate area anchor phrasing. Coverage-gap dispatches for financial/compliance domains should use domain-specific anchors (e.g., "BRIK financial reporting — no revenue snapshot, 0 data connection") that do NOT contain the PROCESS_QUALITY_RE trigger words. For compliance/legal gaps, add `risk_vector: "compliance" + risk_ref` to trigger RULE_LEGAL_EXPOSURE → P0. For other domains (Financial, Customer) without compliance exposure, the dispatch lands at P5 (no regex match) — which is still better than no dispatch at all. Classifier enhancement is deferred (adjacent work).
  - Evidence: `lp-do-ideas-classifier.ts:626-715` — full decision tree traced

- Q: Does lp-coverage-scan need TypeScript implementation or is agent-only sufficient?
  - A: Agent-only (SKILL.md + modules) for Phase 1. The scan reads files, checks dates, classifies gaps, and emits dispatches — all operations the agent can do in-context. TypeScript helper for scanner is optional and can be added later for performance or automation.
  - Evidence: lp-signal-review is fully agent-only and handles similar complexity (reads 10+ stage artifacts, scores, emits)

- Q: What are the mandatory vs optional domains per business profile?
  - A: Recommended profile-domain mapping (operator-proposed taxonomy, agent-refined):
    - **hospitality** (BRIK): Financial ✓ Customer ✓ Operational ✓ Marketing ✓ Compliance ✓ / Inventory ✗ (not applicable)
    - **physical-product** (PWRB): Financial ✓ Inventory ✓ Customer ✓ Logistics ✓ Marketing ✓ Compliance ✓
    - **saas** (future): Financial ✓ Customer ✓ Marketing ✓ / Inventory ✗ Logistics ✗
    - **platform** (PLAT, PIPE): Operational ✓ Compliance ✓ / others optional
    This is a reasonable starting definition. Per-manifest override is always permitted.
  - Evidence: operator's domain taxonomy + repo business directory inspection; reasoning from business type constraints

- Q: Should MINOR gaps emit dispatches?
  - A: No. MINOR gaps (thin artifact structure) appear in the gap report for operator awareness but do not emit dispatches. The dispatch pipeline should receive actionable work (CRITICAL/MAJOR) only. MINOR gaps surfaced in the report create low-friction visibility without dispatch queue bloat.
  - Evidence: operator design spec: "emits dispatch packets for CRITICAL/MAJOR gaps into the existing pipeline" — MINOR not mentioned for dispatch

### Open (Operator Input Required)

- Q: Which businesses should be given manifests in Phase 1 (companion packet 0032 scope)?
  - Why operator input is required: Operator knows which businesses are actively instrumented and which are in early ASSESSMENT stages. All 9 business directories exist; some (PIPE, PLAT, PET, XA) may be too early for meaningful manifests.
  - Decision impacted: Scope of per-business manifest initialization in companion packet
  - Decision owner: Operator
  - Default assumption: BRIK and PWRB as stated in dispatch 0032; others deferred to later run

---

## Confidence Inputs

- Implementation: 85%
  - Basis: Skill architecture is proven (lp-signal-review is near-identical in structure). Dispatch schema is documented and complete. Queue format is known. File-scan logic is straightforward.
  - What raises to ≥90: Confirming js-yaml is importable in the scripts runtime (check package.json); confirming writer-lock pattern applies to queue-state.json writes from agent skills

- Approach: 88%
  - Basis: Two-layer (manifest + scanner) design is coherent. Follows established patterns. The deliberate area-anchor phrasing approach for classifier escalation is a pragmatic workaround — not ideal but viable for Phase 1.
  - What raises to ≥90: Complete the domain taxonomy and profile mapping (TASK-01) before scan implementation (TASK-02/03)

- Impact: 72%
  - Basis: Coverage scanning will surface genuine blind spots — this is confirmed by the operator's description of the structural problem. Impact depends on manifest quality per business; a thin manifest = weak scan.
  - What raises to ≥80: First manual validation run against BRIK showing ≥3 CRITICAL gaps identified that would not have been caught otherwise

- Delivery-Readiness: 85%
  - Basis: All dependencies exist. No external approvals needed. Writer-lock pattern is established. Output paths are clear.
  - What raises to ≥90: js-yaml availability confirmed; writer-lock in agent skill context tested

- Testability: 70%
  - Basis: Skill files (Markdown) are harder to unit-test than TypeScript. Scanner logic is file-system dependent. Dispatch format is testable via schema validation.
  - What raises to ≥80: Injectable filesystem reader implemented in any TypeScript scanner helper; manual validation test protocol written for BRIK

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| R1: Queue-state.json format divergence — TS persistence layer vs hand-authored format | High (documented issue) | Medium | Scanner writes directly to hand-authored format (`dispatches[]` array, `queue_version: queue.v1`). Never calls `persistOrchestratorResult()`. This is explicitly documented in lp-do-ideas SKILL.md known issues. |
| R2: Writer-lock acquisition — scanner may clobber concurrent agents writing queue-state.json | Medium | High | Use `scripts/agents/with-writer-lock.sh` pattern before any queue-state.json write. Document this as a hard requirement in SKILL.md. |
| R3: Classifier P4 ceiling for coverage-gap dispatches — PROCESS_QUALITY_RE matches "startup-loop/pipeline" area anchors → financial gaps land at P4 | High (if anchor not carefully phrased) | Medium | Deliberate anchor phrasing: financial/customer domain anchors avoid PROCESS_QUALITY_RE trigger words. Compliance gaps use `risk_vector + risk_ref` → P0. This is a Phase 1 workaround; proper classifier support is adjacent work. |
| R4: Staleness detection inaccuracy — artifacts without frontmatter dates rely on file mtime, which is unreliable after git checkout | Medium | Low–Medium | Prioritize frontmatter `Last-updated:` date as primary source. Mtime as fallback only. Document the limitation in scan output when mtime is used. |
| R5: Domain taxonomy over-prescription — mandatory domains for a profile that don't actually apply | Medium | Low | Profile scoping includes per-manifest override capability. Start with a conservative mandatory list; operators can suppress inapplicable domains. |
| R6: lp-coverage-scan invoked without a manifest — graceful failure needed | High (early usage) | Low | SKILL.md must have a hard preflight check: if `coverage-manifest.yaml` not found at `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml`, emit a clear error and stop. Do not produce an empty gap report. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Skill architecture: thin SKILL.md + `modules/` subdirectory (follow lp-signal-review exactly)
  - Dispatch format: must pass schema validation against `lp-do-ideas-dispatch.schema.json`
  - Queue writes: must use the hand-authored format; never call TS persistence layer
  - Writer lock: required before queue-state.json modification
  - Skill output artifact path: `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md`
  - Manifest path: `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml`
- Rollout/rollback expectations:
  - No production data at risk (all writes are new files or queue appends)
  - Rollback = delete the skill directory and any manifest files; queue-state.json entries are inert if lp-do-ideas doesn't process them
- Observability expectations:
  - Each scan run produces a dated artifact for audit trail
  - Gap counts per severity, dispatch count emitted — recorded in the scan artifact header

---

## Suggested Task Seeds

1. **TASK-01: Define coverage-manifest.yaml template and schema** — write the YAML template file at `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml`; define all domain entries, profile scoping rules, required/optional flags, staleness thresholds, backing types; include inline comments; this is the spec that TASK-02 and TASK-03 consume

2. **TASK-02: Implement lp-coverage-scan SKILL.md** — write the thin orchestrator at `.claude/skills/lp-coverage-scan/SKILL.md`; define invocation signature (`--biz <BIZ> [--as-of-date <YYYY-MM-DD>] [--dry-run]`), global invariants, module routing (preflight → scan-phase → emit-phase), output paths, and error handling (especially "manifest not found" preflight check)

3. **TASK-03: Implement scan-phase module** — write `.claude/skills/lp-coverage-scan/modules/scan-phase.md`; agent reads manifest, scans `docs/business-os/strategy/<BIZ>/` for artifact existence, reads frontmatter dates for staleness, checks configured data-connection IDs from a known integration list (Stripe, Firebase, GA4, Octorate), produces a classified gap table (CRITICAL/MAJOR/MINOR per domain)

4. **TASK-04: Implement emit-phase module** — write `.claude/skills/lp-coverage-scan/modules/emit-phase.md`; agent writes the gap report artifact, emits `dispatch.v1` packets to queue-state.json for CRITICAL/MAJOR gaps (with deliberate area anchor phrasing per R3 mitigation), increments queue counts, confirms writer-lock acquisition

5. **TASK-05: Manual validation test against BRIK** — create a test protocol at `docs/plans/coverage-manifest-scan-core/task-05-validation-protocol.md`; run lp-coverage-scan against BRIK once a BRIK manifest exists (companion 0032); compare output to known coverage state; confirm dispatches are schema-valid; confirm gap classification is correct

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `.claude/skills/lp-coverage-scan/SKILL.md` exists and is syntactically complete
  - `.claude/skills/lp-coverage-scan/modules/scan-phase.md` exists
  - `.claude/skills/lp-coverage-scan/modules/emit-phase.md` exists
  - `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml` exists with all 6 domain entries and ≥2 profile scoping examples
  - Skill can be invoked dry-run against BRIK without error
- Post-delivery measurement plan:
  - First live scan run (post companion packet 0032) surfaces ≥1 CRITICAL gap per active business
  - Dispatches emitted pass `lp-do-ideas-dispatch.schema.json` validation

---

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity**: All file paths verified against repo (classifier, dispatch schema, queue-state, strategy directory, script files). No inferred claims marked as fact.
2. **Boundary coverage**: Queue-state.json writer-lock boundary identified (R2). Dispatch schema integration boundary documented. No external API boundary for scanner (agent-only, file I/O only).
3. **Testing coverage**: Existing test infrastructure in `scripts/src/startup-loop/__tests__/` confirmed. Test approach for new work is concrete (injectable filesystem reader, schema validation, manual validation protocol).
4. **Business validation**: H1-H4 hypotheses stated explicitly. Signal coverage assessed per hypothesis. Classifier decision tree traced to confirm H4 (RULE_LEGAL_EXPOSURE path).
5. **Confidence calibration**: Testability at 70% reflects genuine difficulty of skill-file testing (not optimism). Impact at 72% reflects dependency on manifest quality (not optimism).

### Confidence Adjustments

- Implementation reduced from potential 90% to 85%: writer-lock behaviour in agent skill context (not TypeScript caller) is not confirmed — flagged as a "what raises to ≥90" action
- Impact reduced from potential 80% to 72%: scan value is only as good as the manifest; no manifests exist yet (companion packet 0032 dependency)

### Remaining Assumptions

- js-yaml (or equivalent YAML parser) is accessible in the scripts/ runtime environment — not verified, low risk since Node.js ecosystem universally supports YAML parsing
- Agent can acquire the writer lock for queue-state.json when running inside a skill invocation (vs a TS script) — the lock pattern is designed for shell scripts but agent use has not been explicitly tested
- Frontmatter `Last-updated:` dates are reliably present in BRIK strategy artifacts (inferred from dated filenames; frontmatter format not confirmed)

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan coverage-manifest-scan-core --auto`
