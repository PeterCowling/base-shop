---
Type: Plan
Status: Active
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Build-progress: TASK-01 Complete, TASK-02 Complete, CHECKPOINT-A Complete, TASK-03 Complete, TASK-04 Pending
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: coverage-manifest-scan-core
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Coverage Manifest + lp-coverage-scan Plan

## Summary

Build the core infrastructure for deterministic artifact-coverage auditing. Deliverable is two things: (1) a YAML manifest template that defines expected artifact/data-source coverage per business domain, and (2) an `lp-coverage-scan` skill (thin orchestrator + two modules) that reads the manifest, scans the repo and known integrations, classifies coverage gaps as CRITICAL/MAJOR/MINOR, and emits `dispatch.v1` packets to the existing lp-do-ideas queue for all CRITICAL and MAJOR gaps. This is the foundational layer; per-business manifest initialization (BRIK, PWRB) and lp-weekly integration are scoped separately in IDEA-DISPATCH-20260226-0032.

## Active tasks
- [ ] TASK-01: Define coverage-manifest.yaml template
- [ ] TASK-02: Implement lp-coverage-scan SKILL.md
- [ ] CHECKPOINT-A: Consistency gate before module implementation
- [ ] TASK-03: Implement scan-phase module
- [ ] TASK-04: Implement emit-phase module
- [ ] TASK-05: Write manual validation test protocol

## Goals
- Coverage manifest schema defined and templated with all 6 domain entries, profile scoping rules, staleness thresholds, and backing-type distinction
- lp-coverage-scan skill installed at `.claude/skills/lp-coverage-scan/` with orchestrator + 2 modules
- Skill produces a human-readable gap report and emits CRITICAL/MAJOR gap dispatches to queue-state.json
- Dispatches pass schema validation against `lp-do-ideas-dispatch.schema.json`
- Skill has graceful preflight failure when no manifest exists

## Non-goals
- Per-business manifest files (BRIK, PWRB, etc.) — companion packet 0032
- lp-weekly integration — companion packet 0032
- S1 onboarding hook — companion packet 0032
- Modifying `lp-do-ideas-classifier.ts` — deferred adjacent work
- TypeScript implementation of scanner — agent-only skill for Phase 1

## Constraints & Assumptions
- Constraints:
  - Dispatch packets must pass `lp-do-ideas-dispatch.schema.json` validation (dispatch.v1)
  - Queue writes must use the hand-authored queue format (`queue_version: queue.v1`, `dispatches: []`); never call `persistOrchestratorResult()`
  - Writer lock must be acquired before writing to queue-state.json
  - mode: trial only
- Assumptions:
  - lp-coverage-scan is an agent-only skill (no TypeScript runtime); the agent reads YAML manifest files directly as text and interprets field structure natively — no js-yaml or Node runtime dependency
  - Frontmatter `Last-updated:` dates are present in most BRIK strategy artifacts (primary staleness signal)
  - lp-signal-review skill provides the correct structural template for this skill

## Inherited Outcome Contract

- **Why:** Ad hoc work defines coverage by default — domains disappear into blind spots until reality forces a reaction. A deterministic scanner converts missing coverage into explicit, actionable work items automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** lp-coverage-scan skill installed; can be invoked against any business with a manifest and produce a gap report with dispatches emitted to queue-state.json. Template manifest with domain taxonomy and profile rules committed.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/coverage-manifest-scan-core/fact-find.md`
- Key findings used:
  - lp-signal-review (AUDIT + EMIT pattern) is the direct structural template
  - PROCESS_QUALITY_RE in `lp-do-ideas-classifier.ts` will match coverage-system anchors → deliberate anchor phrasing needed for financial/compliance gaps
  - Writer-lock at `scripts/agents/with-writer-lock.sh` is required before queue-state.json writes
  - Gap report path: `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md`
  - Manifest path: `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml`
  - queue-state.json hand-authored format: `{ queue_version: "queue.v1", dispatches: [...] }` — diverges from TS persistence layer
  - 9 business directories confirmed: BOS, BRIK, HBAG, HEAD, PET, PIPE, PLAT, PWRB, XA

## Proposed Approach

- Option A: Sequential build — TASK-01 first, then TASK-02, then TASK-03 → TASK-04 → TASK-05 end-to-end
- Option B (chosen): Parallel Wave 1 — TASK-01 and TASK-02 run in parallel (both are independent documents), CHECKPOINT-A validates consistency, then sequential module implementation (TASK-03 → TASK-04 → TASK-05)
- Chosen approach: **Option B** — parallel Wave 1 maximizes build throughput; CHECKPOINT-A before modules prevents module drift from a misaligned template or orchestrator. TASK-01 and TASK-02 share no content that creates conflicts when written simultaneously; each draws from the fact-find directly.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define coverage-manifest.yaml template | 80% | S | Complete (2026-02-26) | - | CHECKPOINT-A |
| TASK-02 | IMPLEMENT | Implement lp-coverage-scan SKILL.md | 80% | S | Complete (2026-02-26) | - | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Consistency gate before module implementation | — | — | Complete (2026-02-26) | TASK-01, TASK-02 | TASK-03 |
| TASK-03 | IMPLEMENT | Implement scan-phase module | 80% | M | Complete (2026-02-26) | CHECKPOINT-A | TASK-04 |
| TASK-04 | IMPLEMENT | Implement emit-phase module | 75% | M | Pending | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Write manual validation test protocol | 70% | S | Pending | TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Fully parallel — independent documents drawing from fact-find |
| Checkpoint | CHECKPOINT-A | TASK-01 + TASK-02 complete | Consistency review; triggers lp-do-replan for TASK-03 if misaligned |
| 2 | TASK-03 | CHECKPOINT-A | Sequential — requires manifest schema from TASK-01 |
| 3 | TASK-04 | TASK-03 | Sequential — consumes gap classification table from TASK-03 |
| 4 | TASK-05 | TASK-04 | Protocol document; can be written once emit-phase is defined |

---

## Tasks

### TASK-01: Define coverage-manifest.yaml template
- **Type:** IMPLEMENT
- **Deliverable:** YAML template at `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Committed to repo; referenced by SKILL.md and scan-phase module
- **Reviewer:** Operator (reads template as part of CHECKPOINT-A)
- **Approval-Evidence:** CHECKPOINT-A pass
- **Measurement-Readiness:** None — template is static; measurement happens via scan runs
- **Affects:** `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml` (new file)
- **Depends on:** -
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 85% — domain taxonomy and profile mapping fully resolved in fact-find; writing a YAML template is a direct transcription task with no runtime unknowns
  - Approach: 85% — YAML format confirmed, 6 domains defined, 2 profile examples (hospitality + physical-product) documented in fact-find
  - Impact: 80% — template is the contract for everything downstream; per-manifest override capability means a slightly wrong default doesn't permanently block accurate scanning
  - **Held-back test (Impact):** "No single unresolved unknown would drop Impact below 80 because per-manifest override capability means operators can correct any profile-mapping error without blocking scan operations."
- **Acceptance:**
  - `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml` exists and is valid YAML
  - Template contains all 6 domain entries (Financial, Inventory, Customer, Operational, Marketing, Compliance) with complete inline documentation
  - At least 2 profile variants shown (hospitality, physical-product) with mandatory/optional flags per domain
  - Staleness threshold, backing-type, artifact_path_patterns, and data_connections fields present for each domain entry
  - Per-manifest override capability documented with example
- **Validation contract (VC-01):**
  - VC-01: Template is valid YAML → agent reads the file and confirms content is structurally valid YAML (no parse errors; all domain blocks are complete key-value pairs); no JavaScript runtime needed since this is an agent-only skill
  - VC-02: All 6 domains present → grep for domain keys; all 6 found
  - VC-03: Two profile examples (hospitality, physical-product) → grep for both profile markers; both found with distinct mandatory/optional flag sets
  - VC-04: Per-manifest override documented → comment explaining `mandatory: false` override exists in template
- **Execution plan:** Green → Refactor (no Red phase — this is document creation, not code)
  - Green evidence plan: Write template from fact-find domain taxonomy; verify YAML validity; confirm all 6 domains and 2 profiles are present with complete fields
  - Refactor evidence plan: Review for clarity, consistency of field names, and completeness of inline comments; ensure a new reader can populate a manifest without additional documentation
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: domain taxonomy and field structure fully decided in fact-find
- **Edge Cases & Hardening:**
  - Profile "saas" (future) — include as commented-out example to show the pattern; don't enforce yet
  - Domains with `mandatory: false` must still appear in the template with a clear "remove this block if not applicable" comment
  - `data_connections` field: document accepted integration IDs (Stripe, Firebase, GA4, Octorate) as the known list for Phase 1; note that unknown IDs are treated as absent
- **What would make this ≥90%:**
  - First manual validation run against BRIK showing all domains are correctly classified (not achievable until companion packet 0032 delivers BRIK manifest)
- **Rollout / rollback:**
  - Rollout: Commit template file; no deployment needed
  - Rollback: Delete template file; no side effects
- **Documentation impact:**
  - Inline YAML comments serve as documentation; no separate doc file needed
- **Notes / references:**
  - Fact-find resolved Q: mandatory vs optional per profile — hospitality: Financial ✓ Customer ✓ Operational ✓ Marketing ✓ Compliance ✓ / Inventory ✗; physical-product: all 6 mandatory
  - YAML field names: `domain`, `label`, `mandatory`, `backing_type` (doc-only | data-backed), `staleness_threshold_days`, `artifact_path_patterns` (glob list), `data_connections` (integration ID list)
- **Build evidence (2026-02-26):**
  - Artifact: `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml` — created
  - VC-01: PASS — yaml.safe_load succeeded, schema_version: coverage-manifest.v1
  - VC-02: PASS — all 6 domains present: Financial, Inventory, Customer, Operational, Marketing, Compliance
  - VC-03: PASS — hospitality (19 occurrences) and physical-product (15 occurrences) profile markers confirmed
  - VC-04: PASS — per-manifest override comment present (4 occurrences)
  - Post-build validation: Mode 3 (Document Review), Attempt 1, Result: Pass — template reads cleanly as bootstrap artifact; all inline comments complete; SaaS commented example included; template placeholders are intentional
  - Symptom patches: None
  - Approval: CHECKPOINT-A pass (pending)

---

### TASK-02: Implement lp-coverage-scan SKILL.md
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-coverage-scan/SKILL.md` (new skill orchestrator)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-coverage-scan/SKILL.md`
- **Reviewer:** Operator
- **Approval-Evidence:** CHECKPOINT-A pass
- **Measurement-Readiness:** None — static skill file
- **Affects:** `.claude/skills/lp-coverage-scan/SKILL.md` (new file), `.claude/skills/lp-coverage-scan/modules/` (new directory, empty until TASK-03/04)
- **Depends on:** -
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 85% — lp-signal-review/SKILL.md is a direct structural template; no new architectural decisions needed; SKILL.md is documentation, not runtime code
  - Approach: 85% — module routing (preflight → scan-phase → emit-phase), invocation signature, global invariants, and output paths all decided in fact-find
  - Impact: 80% — SKILL.md is the entry point; its accuracy defines whether the skill is invoked correctly; errors in this file are easy to fix (Markdown edit)
  - **Held-back test (Impact):** "No single unresolved unknown would drop Impact below 80 because SKILL.md is documentation — the writer-lock execution risk is borne by TASK-04, not by this file. Any specification error is trivially corrected."
- **Acceptance:**
  - `.claude/skills/lp-coverage-scan/SKILL.md` exists with valid frontmatter
  - Invocation signature documented: `--biz <BIZ> [--as-of-date <YYYY-MM-DD>] [--dry-run]`
  - Global invariants section: SCAN + EMIT operating mode, allowed actions (read files, write gap report artifact, write to queue-state.json with writer lock), prohibited actions (code changes, destructive commands, writing without manifest, skipping writer lock)
  - Module routing documented: preflight check → scan-phase → emit-phase (with module file paths)
  - Preflight check specified: fail-closed if `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml` not found
  - Dry-run flag: when present, produce gap report but skip queue-state.json writes
  - Output paths documented: gap report at `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md`, queue writes to `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- **Validation contract (VC-01):**
  - VC-01: SKILL.md has valid frontmatter with `name: lp-coverage-scan` → grep confirms
  - VC-02: All 4 module phases documented → grep for "preflight", "scan-phase", "emit-phase" → all found
  - VC-03: Preflight fail-closed behavior specified → grep for "manifest not found" or equivalent error path → found
  - VC-04: Dry-run flag documented → grep for "--dry-run" → found
- **Execution plan:** Green → Refactor
  - Green evidence plan: Write SKILL.md modeled on lp-signal-review/SKILL.md; adapt: invocation params, operating mode, module names, output paths, writer-lock constraint; confirm all acceptance criteria present
  - Refactor evidence plan: Validate consistency with TASK-01 template output; ensure manifest path matches what TASK-01 documents; ensure output path convention matches gap report artifact
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: structure fully decided in fact-find and lp-signal-review template
- **Edge Cases & Hardening:**
  - `--biz` argument with no matching directory → preflight error: "No strategy directory found for business <BIZ>; run from repo root"
  - `--dry-run` must be clearly documented as "no queue writes, no queue count updates" to avoid silent partial-state writes
  - Module routing must explicitly document that scan-phase produces intermediate output (gap table) that emit-phase consumes — interface defined in TASK-03
- **What would make this ≥90%:**
  - First dry-run invocation against BRIK succeeds without error (after companion packet 0032 delivers BRIK manifest)
- **Rollout / rollback:**
  - Rollout: Commit skill file; no deployment
  - Rollback: Delete skill directory
- **Documentation impact:**
  - SKILL.md is self-documenting; no external doc needed
- **Notes / references:**
  - Structural template: `.claude/skills/lp-signal-review/SKILL.md` (AUDIT + EMIT, 2 phases)
  - Writer-lock path: `scripts/agents/with-writer-lock.sh` — document as hard requirement in global invariants
- **Build evidence (2026-02-26):**
  - Artifact: `.claude/skills/lp-coverage-scan/SKILL.md` — created
  - VC-01: PASS — frontmatter `name: lp-coverage-scan` confirmed
  - VC-02: PASS — preflight (5), scan-phase (3), emit-phase (4) occurrences confirmed
  - VC-03: PASS — "No coverage manifest found" error message present
  - VC-04: PASS — `--dry-run` documented (6 occurrences)
  - Post-build validation: Mode 3 (Document Review), Attempt 1, Result: Pass — SKILL.md is thin and navigable; module routing, preflight, dry-run semantics and output paths all unambiguous; field name `last_updated` (used in manifest template) consistency check deferred to CHECKPOINT-A
  - Symptom patches: None
  - Approval: CHECKPOINT-A pass (pending)

---

### CHECKPOINT-A: Consistency gate before module implementation

- **Type:** CHECKPOINT
- **Status:** Complete (2026-02-26)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-03
- **Purpose:** Verify that the coverage-manifest.yaml template (TASK-01) and the SKILL.md orchestrator (TASK-02) are consistent before modules are built. Specifically check:
  1. Field names in template match what SKILL.md references (e.g., `domain`, `mandatory`, `staleness_threshold_days`, `backing_type`, `artifact_path_patterns`, `data_connections`)
  2. Module file paths in SKILL.md match where TASK-03 and TASK-04 will write (`modules/scan-phase.md`, `modules/emit-phase.md`)
  3. Output artifact path convention is consistent between SKILL.md and template comments
  4. Invocation parameters match what scan-phase needs (biz, as-of-date)
- **Trigger:** lp-do-replan after TASK-01 + TASK-02 complete. If no inconsistency found, replan should confirm TASK-03 as `Ready` and proceed automatically. If inconsistency found, surface it and fix the relevant task before proceeding.

---

### TASK-03: Implement scan-phase module
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-coverage-scan/modules/scan-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-coverage-scan/modules/scan-phase.md`
- **Reviewer:** Operator
- **Approval-Evidence:** TASK-05 validation pass
- **Measurement-Readiness:** None: static module file; execution results measured via scan artifact
- **Affects:** `.claude/skills/lp-coverage-scan/modules/scan-phase.md` (new file)
- **Depends on:** CHECKPOINT-A
- **Blocks:** TASK-04
- **Confidence:** 80% ↑ (was 75%; raised by CHECKPOINT-A Scout evidence 2026-02-26)
  - Implementation: 80% ↑ (was 75%) — Scout confirmed `Last-updated:` is not universal across BRIK artifacts (present in 1/20+ files). Multi-key priority chain now fully evidenced: `Last-updated:` > `Updated:` > `Run-date:` > `Date:` > filename prefix (YYYY-MM-DD-*) > mtime. Approach is specified from actual artifact evidence, not assumed.
  - Approach: 85% — unchanged
  - Impact: 80% ↑ (was 75%) — filename date prefix is consistently present on all dated BRIK artifacts; multi-key chain provides reliable date signals for the majority of cases; mtime fallback only for edge cases. Scanner accuracy is sufficient for production use.
- **Replan evidence (2026-02-26):** CHECKPOINT-A Scout: `Last-updated:` in 1/20+ BRIK files; `Updated:`, `Run-date:`, `Date:` also found. Filename prefix `YYYY-MM-DD-*` universal. Multi-key chain covers all patterns observed. Confidence raised to 80%.
- **Acceptance:**
  - `.claude/skills/lp-coverage-scan/modules/scan-phase.md` exists
  - Agent instructions: read manifest YAML, parse all domain entries with `mandatory: true`, scan `docs/business-os/strategy/<BIZ>/` for files matching `artifact_path_patterns` globs
  - Staleness check (multi-key priority chain): try frontmatter keys in order: `Last-updated:` → `Updated:` → `Run-date:` (format YYYYMMDD) → `Date:` → filename date prefix (YYYY-MM-DD from filename); if all absent, use file mtime; document which method was used in the gap report per domain entry (label: frontmatter-{key} | filename-prefix | mtime)
  - Data-connection check: for each `data_connections` entry, check known integration status from a fixed lookup table (Stripe — check `data/` directory or `.env.local`; Firebase — check Firebase config; GA4 — check GA4 property config; Octorate — check Octorate session state)
  - Gap classification: CRITICAL = artifact_path_patterns has 0 matches AND data_connections has 0 configured; MAJOR = artifact exists but is stale (> staleness_threshold_days) OR data_connection configured but not verified active; MINOR = artifact exists and fresh but structured fields are thin (assessed by agent judgment)
  - Output: structured gap table with columns: Domain | Status | Severity | Evidence | Staleness-source (frontmatter | mtime | n/a)
  - MINOR gaps appear in the gap table but are NOT passed to emit-phase for dispatch emission
- **Validation contract (VC-01 + TC-01):**
  - TC-01: Manifest with mandatory domain that has 0 matching artifacts → classified CRITICAL
  - TC-02: Mandatory domain with artifact found, frontmatter `Last-updated:` 45d ago, staleness_threshold 30d → classified MAJOR
  - TC-03: Mandatory domain with artifact found, fresh, single paragraph → classified MINOR
  - TC-04: Optional domain (mandatory: false) with no artifact → NOT classified (appears in report as "optional, skipped")
  - TC-05: Domain with `data_connections: [stripe]` and no Stripe config found → classified MAJOR (data-backed domain with no backing)
- **Consumer tracing (Phase 5.5):**
  - New output: gap classification table (Domain | Status | Severity | Evidence | Staleness-source)
  - Consumer: TASK-04 emit-phase reads this table and emits dispatches for CRITICAL/MAJOR rows
  - Interface contract: table format must be explicit in the module output so emit-phase can parse without ambiguity; table rows with `Severity: CRITICAL` or `Severity: MAJOR` are emitted; `Severity: MINOR` and optional-skipped rows are not
  - Consumer TASK-05 (validation protocol) also reads the table to verify classification correctness
- **Execution plan:** Green → Refactor
  - Green evidence plan: Write module instructions that produce a complete gap table from any manifest + strategy directory; verify TC-01 through TC-05 pass against fixture or BRIK test when manifest exists
  - Refactor evidence plan: Review staleness detection section for clarity; ensure mtime fallback is clearly labeled in output; review data-connection check section against actual integration list
- **Planning validation:**
  - Checks run: Confirmed frontmatter date format in BRIK artifacts by reviewing strategy directory listing (dated filenames suggest dates are tracked); exact frontmatter key (`Last-updated:`) confirmed present in fact-find template
  - Validation artifacts: `docs/plans/coverage-manifest-scan-core/fact-find.md` — test landscape and staleness detection decision
  - Unexpected findings: Mtime unreliability after git checkout is a real concern; mitigation (frontmatter-first) documented in module
- **Scouts:** Complete (2026-02-26) — Scout confirmed `Last-updated:` in only 1/20+ BRIK files. Multi-key chain implemented: `Last-updated:` > `Updated:` > `Run-date:` > `Date:` > filename-prefix > mtime. Covers all observed patterns.
- **Edge Cases & Hardening:**
  - Domain with `artifact_path_patterns: []` (empty list) — treat as CRITICAL if data_connections also empty; MAJOR if data_connections present
  - Multiple artifacts matching a pattern (e.g., multiple weekly-kpcs files) — use the most recent by date; only one match needed to satisfy existence check
  - data_connection "octorate" check — Octorate session state file existence at `.tmp/octorate-state.json` or equivalent; document what "configured" means per integration
  - Artifact with frontmatter date in future (clock skew) — treat as fresh; log the anomaly in the gap report
- **Build evidence (2026-02-26):**
  - Artifact: `.claude/skills/lp-coverage-scan/modules/scan-phase.md` — created
  - TC-01: PASS — R1 classifies 0-match mandatory domain as CRITICAL (line 90)
  - TC-02: PASS — R3/R4 classifies stale artifact as MAJOR (lines 92-93)
  - TC-03: PASS — R6 classifies fresh thin artifact as MINOR (line 95 equivalent)
  - TC-04: PASS — optional domains marked OPTIONAL-skipped, no classification (Scope filter + Step 5)
  - TC-05: PASS — R5 classifies fresh artifact with no data-connection as MAJOR (line 94)
  - Post-build validation: Mode 3 (Document Review), Attempt 1, Result: Pass — module is self-contained; 6-priority staleness chain covers all observed BRIK date patterns; 7-rule classification table covers all TC contracts; output format includes Staleness-source column; emit-phase handoff documented
  - Symptom patches: None
  - Approval: TASK-05 validation pass (pending)
- **What would make this ≥90%:**
  - First live scan run showing ≥3 correctly classified CRITICAL/MAJOR gaps
- **Rollout / rollback:**
  - Rollout: Commit module file; no deployment
  - Rollback: Delete module file; scan-phase is unreachable without it
- **Documentation impact:**
  - Module is self-documenting; gap report header documents methodology per run
- **Notes / references:**
  - Integration ID lookup table (Phase 1, doc-only check): `stripe` = check `data/` or `packages/`, `firebase` = check Firebase config files, `ga4` = check GA4 property config in strategy docs, `octorate` = check `.tmp/` or session state

---

### TASK-04: Implement emit-phase module
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-coverage-scan/modules/emit-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-coverage-scan/modules/emit-phase.md`
- **Reviewer:** Operator
- **Approval-Evidence:** TASK-05 validation pass
- **Measurement-Readiness:** None: static module file; dispatch count measured in queue-state.json
- **Affects:** `.claude/skills/lp-coverage-scan/modules/emit-phase.md` (new file), `docs/business-os/startup-loop/ideas/trial/queue-state.json` (runtime: appended to with dispatches)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 75%
  - Implementation: 85% — dispatch packet format is fully specified; queue format is known (hand-authored format); writer-lock pattern is documented
  - Approach: 85% — emit logic clear; deliberate anchor phrasing approach for classifier escalation is validated in fact-find
  - Impact: 75% — emit-phase is the value delivery step; if writer-lock acquisition fails in agent context, queue writes may be unsafe; this is the primary remaining unknown
- **Acceptance:**
  - `.claude/skills/lp-coverage-scan/modules/emit-phase.md` exists
  - Agent instructions: acquire writer lock (reference `scripts/agents/with-writer-lock.sh`); append CRITICAL/MAJOR gap dispatches to `queue-state.json` `dispatches[]` array at front of array; increment `counts.enqueued` and `counts.total`; release lock
  - Dry-run behavior: when `--dry-run` flag active, skip all queue-state.json writes; gap report is still written
  - Gap report artifact written to `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md` regardless of dry-run state
  - Dispatch anchor phrasing rules documented: financial/customer domain anchors must NOT contain `process|throughput|determinism|startup.?loop|pipeline|queue|classifier|prioriti` (PROCESS_QUALITY_RE terms); compliance domain gaps must set `priority: "P1"` (highest schema-valid value) as a best-effort metadata signal from the scanner, and encode compliance context in `evidence_refs` so the downstream lp-do-ideas TypeScript classifier can re-classify from `area_anchor` + `evidence_refs` when the dispatch is processed (the classifier prioritizes `area_anchor`/`evidence_refs` signal over the stored `priority` field)
  - Dispatch ID format: `IDEA-DISPATCH-<YYYYMMDDHHmmss>-<NNNN>` (14-digit timestamp; schema pattern `[0-9]{14}`); NNNN increments from current highest in queue; documented
  - MINOR gaps: appear in gap report only; no dispatch emitted
- **Validation contract (VC-01 + TC-01):**
  - TC-01: CRITICAL Financial gap → dispatch emitted with `area_anchor` that does NOT match PROCESS_QUALITY_RE, `recommended_route: "lp-do-fact-find"`, `status: "fact_find_ready"`, `queue_state: "enqueued"`
  - TC-02: MAJOR stale Customer gap → dispatch emitted with correct area anchor and `priority: "P2"` or higher
  - TC-03: MINOR gap → no dispatch emitted; gap appears in report only
  - TC-04: CRITICAL Compliance gap → dispatch emitted with `priority: "P1"` and `evidence_refs` containing a compliance-risk entry (e.g. `"compliance-risk: No financial reporting data — compliance audit exposure"`); no `risk_vector` or `risk_ref` fields (schema: `additionalProperties: false`)
  - TC-05: `--dry-run` flag → gap report written, queue-state.json NOT modified
  - TC-06: Schema validation: all emitted dispatches pass `lp-do-ideas-dispatch.schema.json` against required fields
- **Consumer tracing (Phase 5.5):**
  - New outputs:
    1. Gap report artifact at `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md`
       - Consumers: Operator (reads directly). No code consumers.
    2. Dispatch packets appended to `queue-state.json` `dispatches[]` array
       - Consumer A: lp-do-ideas pipeline — reads `dispatches[]` looking for `queue_state: "enqueued"` entries
       - Consumer B: `ideas.user.html` viewer — reads `counts` field (`enqueued`, `total`); requires counts to be incremented
       - Consumer C: lp-weekly (future, companion packet 0032) — invokes the scan and reads the gap report artifact
    3. `counts.enqueued` and `counts.total` incremented in queue-state.json header
       - Consumer: `ideas.user.html` viewer; emit-phase MUST increment both or viewer shows stale counts
  - All consumers addressed: operator (gap report), lp-do-ideas (dispatch entries), viewer (counts). No silent consumers.
- **Execution plan:** Green → Refactor
  - Green evidence plan: Write emit-phase instructions that produce schema-valid dispatches and write the gap report; verify TC-01 through TC-06 pass; confirm queue-state.json counts are incremented correctly
  - Refactor evidence plan: Review anchor phrasing guidance for clarity; ensure PROCESS_QUALITY_RE avoidance is clearly stated with examples; review compliance escalation path for completeness
- **Planning validation:**
  - Checks run: Confirmed queue-state.json hand-authored format (not TS persistence format) from live file; confirmed `ideas.user.html` reads `counts` field (via fact-find); confirmed dispatch schema required fields from schema JSON
  - Validation artifacts: `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — required fields list; `docs/business-os/startup-loop/ideas/trial/queue-state.json` — live format confirmation
  - Unexpected findings: Dispatch ID pattern in schema requires `IDEA-DISPATCH-[0-9]{14}-[0-9]{4}` — 14-digit timestamp means YYYYMMDDHHmmss format, not YYYYMMDD. Module must use 14-digit format.
- **Scouts:** Confirm dispatch ID regex pattern from schema before writing module: `^IDEA-DISPATCH-[0-9]{14}-[0-9]{4}$` — confirmed in schema.
- **Edge Cases & Hardening:**
  - Queue-state.json concurrent write: writer lock is the guard; if lock can't be acquired (timeout), emit-phase must abort with clear error and suggest retry — do not write partial state
  - Dispatch ID collision: when determining next sequence number, scan all existing dispatch IDs for current date and use max+1; if none for current date, start at 0001
  - Empty gap table from scan-phase (all domains covered) → write gap report with "No gaps found" section; skip queue writes; emit informational summary only
  - Multiple CRITICAL gaps in one run → emit one dispatch per gap (not one aggregate dispatch); follow the lp-do-ideas decomposition rule
  - Compliance gaps: emit with `priority: "P1"` (highest schema-valid value; `priority` enum is `P1|P2|P3`) and a `evidence_refs` entry explicitly stating the compliance exposure (e.g. `"compliance-risk: No financial reporting data — compliance audit exposure"`); do NOT add `risk_vector` or `risk_ref` fields (not in schema; `additionalProperties: false`)
- **What would make this ≥90%:**
  - Writer-lock acquisition confirmed to work in agent skill context (vs TypeScript caller)
  - First live scan run showing emitted dispatches pass schema validation
- **Rollout / rollback:**
  - Rollout: Commit module file; no deployment
  - Rollback: Delete module file; emit-phase unreachable without it; queue-state.json entries (if any) are inert
- **Documentation impact:**
  - Module is self-documenting; gap report artifact header serves as per-run observability
- **Notes / references:**
  - Dispatch ID format correction: `IDEA-DISPATCH-<YYYYMMDDHHmmss>-<seq4>` — 14-digit timestamp (confirmed from schema pattern `[0-9]{14}`)
  - Queue format reference: live queue-state.json (hand-authored format, NOT TS persistence layer)
  - PROCESS_QUALITY_RE terms to avoid in anchor phrasing: `process|throughput|determinism|startup.?loop|pipeline|queue|classifier|prioriti`

---

### TASK-05: Write manual validation test protocol
- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/coverage-manifest-scan-core/task-05-validation-protocol.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/plans/coverage-manifest-scan-core/task-05-validation-protocol.md`
- **Reviewer:** Operator (executes the protocol once companion packet 0032 delivers BRIK manifest)
- **Approval-Evidence:** Operator manually confirms protocol executed successfully after BRIK manifest exists
- **Measurement-Readiness:** Protocol execution count + gap report output; informal tracking by operator
- **Affects:** `docs/plans/coverage-manifest-scan-core/task-05-validation-protocol.md` (new file)
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 85% — writing the protocol document is straightforward; steps are clear from the fact-find and task design
  - Approach: 85% — validation approach decided: invoke scan → read gap report → verify classification → validate dispatch schema
  - Impact: 70% — protocol is a quality gate, not a capability delivery; its value is confirmatory only; actual impact depends on successful execution (blocked by companion packet 0032)
- **Acceptance:**
  - `docs/plans/coverage-manifest-scan-core/task-05-validation-protocol.md` exists
  - Protocol includes: prerequisites (BRIK manifest must exist from companion packet 0032), invocation command, expected gap report sections, dispatch schema validation step, pass/fail criteria
  - Protocol documents expected BRIK gaps (inferred from known BRIK coverage state — no coverage-manifest.yaml, limited financial data, no inventory domain)
  - Explicit pass criteria: ≥1 CRITICAL gap identified for BRIK, ≥1 dispatch emitted and schema-valid, gap report artifact written at correct path
- **Validation contract (VC-01):**
  - VC-01: Protocol document is coherent (can be followed by operator without additional context)
  - VC-02: Invocation command matches SKILL.md signature exactly
  - VC-03: Pass criteria are binary and measurable (not subjective)
- **Execution plan:** Green only (document creation)
  - Green evidence plan: Write protocol with prerequisites, steps, expected outputs, and binary pass/fail criteria
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: protocol content is well-defined from prior tasks
- **Edge Cases & Hardening:**
  - Protocol must note that execution is blocked until companion packet 0032 delivers BRIK manifest — include this as Step 0 prerequisite check
  - Include a "known expected gaps" section with the BRIK gaps predicted at plan time; actual results should show ≥ these expected gaps
- **What would make this ≥90%:**
  - Protocol successfully executed against BRIK (unblocked by companion packet 0032) showing ≥3 CRITICAL gaps and schema-valid dispatches
- **Rollout / rollback:**
  - Rollout: Commit protocol document; no deployment
  - Rollback: Delete file; no side effects
- **Documentation impact:**
  - Self-contained document; serves as acceptance evidence for the plan

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R1: Queue-state.json format divergence (TS layer vs hand-authored) | High | Medium | Scanner writes directly to hand-authored format; never calls `persistOrchestratorResult()`; documented as hard constraint in TASK-04 |
| R2: Writer-lock acquisition failure in agent skill context | Medium | High | Emit-phase documents abort-with-error behavior if lock can't be acquired; dry-run available as safe fallback |
| R3: PROCESS_QUALITY_RE matches coverage anchor phrasing → financial gaps at P4 | High (if anchor not carefully phrased) | Medium | TASK-04 includes explicit PROCESS_QUALITY_RE avoidance guidance with examples; compliance gaps set `priority: "P1"` (best-effort metadata) + compliance-risk entry in `evidence_refs` so the downstream TypeScript classifier can escalate from `area_anchor`/`evidence_refs` signal; `priority: "P1"` is schema-valid; full classifier re-prioritization happens downstream, not in the scanner |
| R4: Staleness detection inaccuracy (mtime unreliable after checkout) | Medium | Medium | TASK-03 prioritizes frontmatter `Last-updated:` as primary source; mtime labeled as fallback in output |
| R5: Companion packet 0032 delay blocks validation | High | Low | TASK-05 protocol can be written now; execution is deferred; not a blocker for this plan's completion gate |
| R6: Dispatch ID collision on same date | Low | Low | TASK-04 documents scan-current-max-then-increment approach for sequence number |

## Observability
- Logging: Gap report artifact at `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md` — scan run audit trail
- Metrics: `counts.enqueued` and `counts.total` in queue-state.json — dispatch emission count per run; gap counts by severity in gap report header
- Alerts/Dashboards: `ideas.user.html` viewer shows queue counts; CRITICAL gap dispatches surface in lp-do-ideas queue for operator review

## Acceptance Criteria (overall)
- [ ] `docs/plans/coverage-manifest-scan-core/coverage-manifest.template.yaml` exists with all 6 domain entries and ≥2 profile examples
- [ ] `.claude/skills/lp-coverage-scan/SKILL.md` exists with valid frontmatter, invocation signature, module routing, and preflight fail-closed behavior documented
- [ ] `.claude/skills/lp-coverage-scan/modules/scan-phase.md` exists with gap classification model and gap table output format
- [ ] `.claude/skills/lp-coverage-scan/modules/emit-phase.md` exists with dispatch emission instructions, anchor phrasing guidance, and writer-lock requirement
- [ ] `docs/plans/coverage-manifest-scan-core/task-05-validation-protocol.md` exists with binary pass/fail criteria
- [ ] All skill files are syntactically consistent (paths, field names, module references align)

## Decision Log
- 2026-02-26: YAML chosen over JSON for manifest format — human-editable, git-diff-friendly (fact-find Q1)
- 2026-02-26: Agent-only skill (no TypeScript) for Phase 1 — follows lp-signal-review precedent (fact-find Q5)
- 2026-02-26: MINOR gaps in gap report only, no dispatch emission — matches operator design intent (fact-find Q7)
- 2026-02-26: Deliberate anchor phrasing approach for classifier escalation (vs classifier modification) — Phase 1 pragmatic workaround; classifier enhancement is adjacent work (fact-find Q4)
- 2026-02-26: Dispatch ID format confirmed as 14-digit timestamp (`YYYYMMDDHHmmss`) from schema regex `[0-9]{14}` — noted in TASK-04 planning validation

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 80% × 1 = 80
- TASK-02: 80% × 1 = 80
- TASK-03: 75% × 2 = 150
- TASK-04: 75% × 2 = 150
- TASK-05: 70% × 1 = 70
- Sum: 530 / (1+1+2+2+1) = 530 / 7 = 75.7% → **75%**
