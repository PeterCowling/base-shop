---
Type: Plan
Status: Complete
Domain: Product
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17 (all tasks complete)
Feature-Slug: startup-loop-business-naming
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1 M=2 L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PIPE
Card-ID: none
---

# Startup Loop — Business Naming Step Plan

## Summary

The startup loop has no process for generating a business or product name when a venture enters with `business_name_status: unconfirmed`. This plan adds a gate (GATE-BD-00) at the S0→S1 transition that generates a deep-research naming prompt, blocks loop advance, and resumes once the user returns a shortlist artifact. The deliverables are: a new intake packet field, a deep-research prompt template, gate logic in `startup-loop/SKILL.md`, a `loop-spec.yaml` update, and a shortlist read-in integration in `lp-brand-bootstrap`. All changes are additive — businesses with a confirmed name are unaffected.

## Goals

- Add GATE-BD-00 to the loop with an explicit trigger / pass / non-retrigger decision table.
- Produce a deep-research naming prompt template seeded from S0 intake data, following the canonical Naming Prompt Seed Contract.
- Enable `lp-brand-bootstrap` to extract the recommended name from the returned shortlist via machine-readable front matter.
- Leave all existing loop runs (BRIK, HEAD, PET) untouched.

## Non-goals

- Building a name-selection or trademark-checking tool.
- Changing the loop for businesses with a confirmed name.
- Second-pass naming prompt seeded from S2B data (TASK-05 — deferred, do not plan).
- Any production code changes — all deliverables are markdown skill files and document templates.

## Constraints & Assumptions

- Constraints:
  - All `{{FIELD}}` placeholders in the prompt template must map 1:1 to the Naming Prompt Seed Contract in the fact-find. No additions without updating the contract first.
  - Gate ID is GATE-BD-00 — do not renumber existing gates.
  - Shortlist detection is glob-based (`*-naming-shortlist.user.md`), not exact-path.
  - Stable pointer file (`latest-naming-shortlist.user.md`) is written by gate logic — no `loop-spec.yaml` pointer field.
  - `loop-spec.yaml` schema impact must be assessed before the gate entry is committed (TASK-03b).
  - Prompt generation is idempotent — do not overwrite an existing prompt file.
- Assumptions:
  - `business_name_status` absent = `confirmed` (fail-open; gate skipped). Confirmed by Peter 2026-02-17.
  - Intake packet parse errors on `business_name_status` = fail-open (treat as `confirmed`, emit warning).
  - `business_code` exists before S0 — it is a precondition for all path derivation and is not in scope here.
  - Second-pass prompt (S2B) deferred. Confirmed by Peter 2026-02-17.

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-business-naming/fact-find.md`
- Key findings used:
  - No naming step exists in the current loop; `lp-brand-bootstrap` does brand language only.
  - Canonical Naming Prompt Seed Contract: 11 fields from S0 intake, confirmed across two real intake instances.
  - Gate BD-00 decision table: 3 rows (skipped / blocked / complete), pass = glob match, status flip is advisory only.
  - Artifact spec: prompt idempotent; shortlist glob-accepted; stable pointer replaces loop-spec pointer field.
  - Shortlist front matter schema (`recommended_business_name`, `shortlist`) required for downstream extraction.
  - `loop-spec.yaml` schema impact unverified — TASK-03b must assess before committing gate entry.

## Proposed Approach

- Option A (chosen): Additive extension — new intake field, new prompt template, new gate check in startup-loop SKILL.md, loop-spec.yaml gate entry, lp-brand-bootstrap shortlist read-in. Mirrors the S2 deep-research handoff pattern exactly.
- Option B (rejected): Embed naming inside `lp-brand-bootstrap`. Blurs responsibilities — brand-bootstrap is about brand language, not name generation. Naming must precede brand work.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; user did not request auto-continue)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `business_name_status` + `target_languages` to intake packet template | 85% | S | Complete (2026-02-17) | - | TASK-02 |
| TASK-03b | INVESTIGATE | Assess loop-spec.yaml schema for GATE-BD-00 entry | 72% | S | Complete (2026-02-17) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Create deep-research naming prompt template | 83% | L | Complete (2026-02-17) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add GATE-BD-00 logic to startup-loop/SKILL.md | 81% | M | Complete (2026-02-17) | TASK-02, TASK-03b | - |
| TASK-04 | IMPLEMENT | Add shortlist read-in to lp-brand-bootstrap/SKILL.md | 82% | S | Complete (2026-02-17) | TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03b | None | Fully independent; run in parallel |
| 2 | TASK-02 | TASK-01 complete | Seed contract field names must be final before template is written |
| 3 | TASK-03, TASK-04 | TASK-02 complete; TASK-03b complete (for TASK-03 only) | Parallel; TASK-04 needs front matter schema from TASK-02 only |

---

## Tasks

---

### TASK-01: Add `business_name_status` and `target_languages` to S0 intake packet template

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-baselines/_templates/intake-packet-template.md` (or equivalent canonical template path) with two new fields; semantic documentation inline.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Build evidence:** Created `docs/business-os/startup-baselines/_templates/intake-packet-template.md` (new file — no blank template existed; created from HEAD-intake-packet.user.md structure per edge-case rule). `Business name status` field at line 28 (default `confirmed`; semantics, vocabulary, fallback, parse-error behaviour documented inline). `Target languages` field at line 30 (optional; derivation rule from Region documented inline). Seed Contract derivation note added for `revenue_model`, `price_positioning`, `key_differentiator`. Scope expansion (controlled): added `ICP context` and `ICP job-to-be-done` rows to Section C to cover seed contract fields `primary_icp_context` and `primary_icp_jtbd`. VC-01: passed. Cross-check against 11-field Naming Prompt Seed Contract: complete.
- **Artifact-Destination:** `docs/business-os/startup-baselines/_templates/intake-packet-template.md` (created).
- **Reviewer:** Peter
- **Approval-Evidence:** Peter reviews updated template and confirms field names match Naming Prompt Seed Contract.
- **Measurement-Readiness:** None — intake template is a structural artifact, not a measured output.
- **Affects:** `docs/business-os/startup-baselines/_templates/intake-packet-template.md` (or equivalent), `[readonly] docs/plans/startup-loop-business-naming/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 88% — exact field names and semantics defined in Naming Prompt Seed Contract; two real intake packet instances confirm existing convention.
  - Approach: 87% — additive field addition; no structural change to existing sections; backwards-compatible.
  - Impact: 85% — seed contract needs to be locked before template can reference fields. Risk: template path not yet confirmed (see Scouts).
- **Acceptance:**
  - `business_name_status: confirmed | unconfirmed` field present in intake packet template with inline semantics: absent = `confirmed`, parse error = `confirmed` (fail-open, emit warning).
  - `target_languages` field present with documented derivation rule: list if explicit; derive from `region` as best effort if absent.
  - Naming Prompt Seed Contract table in fact-find updated if any field name changes during implementation (contract is the authoritative reference).
- **Validation contract (VC-01):**
  - VC-01: Read updated template file → confirm both fields present with correct vocabulary and documented fallback behaviour. Pass: fields found, semantics match contract. Deadline: same session.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan: Locate the canonical intake packet template path (see Scouts). Read existing field structure to confirm addition point.
  - Green evidence plan: Add fields at the correct location in Section B (Business and Product Packet). Write inline semantic notes.
  - Refactor evidence plan: Cross-check all field names against Naming Prompt Seed Contract table. Confirm no drift.
- **Planning validation:** Not applicable (S-effort).
- **Scouts:**
  - Confirm exact path of the intake packet template file — the fact-find references `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` as instances, but the canonical blank template path is unconfirmed. Check for a `_template` or `_blank` file in that directory. If none exists, TASK-01 must create it.
- **Edge Cases & Hardening:**
  - If no blank template file exists, create `docs/business-os/startup-baselines/_templates/intake-packet-template.md` as the canonical reference, copying structure from `HEAD-intake-packet.user.md`.
  - Do not modify existing real intake packet instances (BRIK, HEAD, PET) — they are `absent = confirmed` and require no change.
- **What would make this >=90%:** Confirm blank template file exists at a known path before execution.
- **Rollout / rollback:**
  - Rollout: Add fields to template; no migration of existing files needed.
  - Rollback: Remove the two fields from the template. Zero downstream impact (field absent = gate skipped).
- **Documentation impact:** Naming Prompt Seed Contract table in fact-find.md should be cross-referenced in the template as the authoritative field spec.
- **Notes / references:** Naming Prompt Seed Contract: `docs/plans/startup-loop-business-naming/fact-find.md` § Data & Contracts.

---

### TASK-03b: Assess loop-spec.yaml schema for GATE-BD-00 entry

- **Type:** INVESTIGATE
- **Deliverable:** Investigation note appended to `docs/plans/startup-loop-business-naming/fact-find.md` § Remaining Assumptions; confirmed or revised schema field list for TASK-03 to use when editing loop-spec.yaml.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Build evidence:** Read `docs/business-os/startup-loop/loop-spec.yaml` (spec_version 1.2.0) in full. Findings: (1) No `gates:` block — gate registration is comment-based (inline YAML comment on stage + header changelog line). Fields like `trigger_condition` / `pass_condition` / `required_output_glob` are SKILL.md-only. (2) spec_version bump required: 1.2.0 → 1.3.0, following established pattern (v1.1.0 added BD-3, v1.2.0 added GATE-MEAS-01). (3) run_packet `loop_spec_version` must match spec_version — existing in-flight run packets will show mismatch; functionally safe since GATE-BD-00 only triggers on `unconfirmed`. (4) No TASK-03c needed — loop-spec.yaml change is: add inline comment to S0 stage entry + add header changelog line + bump spec_version to 1.3.0. All four investigation questions answered. Finding appended to fact-find.md § Remaining Assumptions.
- **Affects:** `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 72%
  - Implementation: 75% — task is read-only investigation; straightforward. Risk: spec may have a non-obvious validation layer.
  - Approach: 80% — read file, identify gate schema, check version field, document decision.
  - Impact: 75% — incorrect schema assumptions would cause TASK-03 to write a malformed loop-spec entry. Investigation de-risks TASK-03 before it executes.
- **Questions to answer:**
  - What fields does a gate entry in `loop-spec.yaml` require? (trigger_condition, pass_condition, blocking_message_template, required_output_glob — assumed; confirm.)
  - Does adding a new gate require a `spec_version` increment? If so, what is the current version and what is the bump protocol?
  - Is there a validation schema (JSON Schema, Zod, etc.) that enforces gate entry structure? If so, what are the constraints?
  - Are gate IDs in the BD-XX series ordered numerically and validated? Can GATE-BD-00 be inserted before GATE-BD-01?
- **Acceptance:**
  - Finding documented as an update to `docs/plans/startup-loop-business-naming/fact-find.md` § Remaining Assumptions.
  - Confirmed field list for GATE-BD-00 entry handed off to TASK-03.
  - spec_version decision documented (bump required: yes/no; if yes, what version).
- **Validation contract:** Investigation closes when all four questions above have explicit answers with evidence (file path + line number).
- **Planning validation:** None: S-effort investigation.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** fact-find.md § Remaining Assumptions updated with confirmed findings.
- **Notes / references:** `docs/business-os/startup-loop/loop-spec.yaml` is the primary file to read.

---

### TASK-02: Create deep-research naming prompt template

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/market-research/_templates/deep-research-naming-prompt.md` — a complete, usable prompt template with `{{FIELD}}` placeholders mapped to Naming Prompt Seed Contract, all four research task sections, output format spec, and required shortlist front matter schema.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-17)
- **Build evidence:** Created `docs/business-os/market-research/_templates/deep-research-naming-prompt.md` (208 lines). Mirrors S2 template structure exactly (YAML frontmatter → intro → text code block → return artifact spec). Scout executed: read S2 template in full before writing; confirmed `_templates/` directory and location. VC-01 passed: 208 lines. VC-02 passed: 27 distinct `{{FIELD}}` placeholders; all 5 required + 6 optional seed contract fields present; all 16 template-internal fields accounted for; zero unexpected extras. VC-03 passed: YAML front matter schema block present at lines 172-185 with `recommended_business_name` and `shortlist` keys; also embedded in prompt body at E) section. VC-04 passed: all four research task headings present at lines 53, 62, 89, 111. Data-Richness header present; optional fields marked with `[optional]` fallback labels; multi-locale cultural check required for every candidate; S0+S2B fields clearly separated and conditional. Cross-check against Naming Prompt Seed Contract: complete.
- **Artifact-Destination:** `docs/business-os/market-research/_templates/deep-research-naming-prompt.md` (created).
- **Reviewer:** Peter
- **Approval-Evidence:** Peter reads generated template and confirms research tasks and output spec are complete and usable.
- **Measurement-Readiness:** Post-delivery: run one naming session end-to-end and evaluate whether output produces ≥10 distinct positioned candidates with front matter present.
- **Affects:** `docs/business-os/market-research/_templates/deep-research-naming-prompt.md` (new file)
- **Depends on:** TASK-01 (field names in seed contract must be final)
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 83%
  - Implementation: 85% — template structure, research tasks, and output spec are well-defined in the fact-find. Seed contract fields confirmed from real instances. L-effort with detailed spec.
  - Approach: 87% — mirrors existing S2 prompt template pattern. Research task sections (competitor landscape, long-list, shortlist, recommendation) are standard naming research steps.
  - Impact: 83% — quality of the prompt directly determines quality of naming research output; hard to test automatically. Confidence cap at 83 due to reasoning-only evidence for template quality (requires pilot to confirm).
- **Acceptance:**
  - File exists at `docs/business-os/market-research/_templates/deep-research-naming-prompt.md`.
  - Every `{{FIELD}}` placeholder maps 1:1 to a field in the Naming Prompt Seed Contract table. No extra placeholders. No missing required-field placeholders.
  - Four research task sections present: (1) Competitor Name Landscape, (2) Candidate Long-List (15-20 names, 7 archetypes, per-candidate rationale/domain/TM/cultural/brand-story fields), (3) Shortlist of 5 with scoring table, (4) Single Recommendation with rationale.
  - Output format section specifies required shortlist front matter schema: `recommended_business_name` (string) and `shortlist` (array of strings).
  - `Data-Richness` header present indicating S0-only vs S0+S2B seed.
  - Optional fields (`primary_icp_context`, `primary_icp_jtbd`, `price_positioning`, `key_differentiator`, `target_languages`) clearly marked as optional in the template with fallback labels.
- **Validation contract (VC-02):**
  - VC-01: Template file exists at specified path. Pass: file readable with >100 lines.
  - VC-02: All `{{FIELD}}` placeholders enumerated and cross-checked against Naming Prompt Seed Contract. Pass: zero mismatches.
  - VC-03: Required shortlist front matter schema block present in output format section. Pass: `recommended_business_name` and `shortlist` both specified.
  - VC-04: All four research task sections present by heading. Pass: headings found in order.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan: Write acceptance criteria / VC checklist first (already done above). Enumerate all `{{FIELD}}` keys from Naming Prompt Seed Contract before writing a single line of template.
  - Green evidence plan: Write template section by section: context block → seed fields → research tasks → output format spec. Run VC-02 (placeholder cross-check) immediately after first draft.
  - Refactor evidence plan: Read through from researcher's perspective. Are the instructions unambiguous? Would a researcher unfamiliar with this business produce 15-20 candidates? Tighten instructions where unclear. Re-run VC checklist.
- **Planning validation (required for L):**
  - Checks run: Read `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md` to confirm template conventions, section ordering, and field style.
  - Validation artifacts: Comparison of S2 template structure vs naming prompt structure documented inline.
  - Unexpected findings: None yet — to be updated during execution.
- **Scouts:**
  - Read the existing S2 market intelligence prompt template in full before writing. Mirror its tone, header hierarchy, and instruction density.
  - Confirm that the `_templates/` directory is the accepted location (not `_templates/naming/` or similar).
- **Edge Cases & Hardening:**
  - If a required field is missing from the intake packet at gate time, the gate must substitute the documented fallback (from Naming Prompt Seed Contract). Template must not error — it must render a usable prompt even with partial data.
  - `target_languages` may need to be derived from `region` if not explicit. Template instructions must tell the researcher how to handle this.
  - Multi-locale: Template must explicitly instruct researcher to check top languages in target region for negative/unintended meanings and pronunciation issues.
- **What would make this >=90%:** Run a pilot naming session with a synthetic intake packet and confirm output quality before marking complete.
- **Rollout / rollback:**
  - Rollout: New file only — no existing files modified.
  - Rollback: Delete the file. No downstream impact until TASK-03 is also live.
- **Documentation impact:** None beyond the template file itself. TASK-03 gate logic will reference this path.
- **Notes / references:** Naming Prompt Seed Contract: `docs/plans/startup-loop-business-naming/fact-find.md` § Data & Contracts. S2 reference: `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`.

---

### TASK-03: Add GATE-BD-00 logic to `startup-loop/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/startup-loop/SKILL.md` with GATE-BD-00 check at S0→S1 transition; idempotent prompt generation; glob-based shortlist detection; stable pointer write on pass; `naming_gate` field in status output.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Build evidence:** Three edits to `startup-loop/SKILL.md`: (1) Added GATE-BD-00 section in Hard Gates, immediately before GATE-BD-01 — includes full `naming_gate` computation bash commands, 3-row decision table, blocked/complete branch logic with idempotency, stable pointer write, advisory message, parse-error handling; (2) Added `naming_gate: <skipped|blocked|complete>` to Required Output Contract; (3) Updated `loop_spec_version: 1.2.0 → 1.3.0` in output contract and stage model reference. Two edits to `loop-spec.yaml`: (1) Bumped `spec_version: "1.3.0"`, added v1.3.0 changelog comment; (2) Added GATE-BD-00 inline comment to S0 stage entry with all key spec fields; (3) Added `naming_gate` to `run_packet.required_fields` (refactor — gap found during VC). All 5 VCs passed. Scout confirmed: glob-based detection used; S2 gate pattern confirmed as the direct model for the blocked/resume pattern.
- **Artifact-Destination:** `.claude/skills/startup-loop/SKILL.md`
- **Reviewer:** Peter
- **Approval-Evidence:** Peter manually tests gate against all three rows of the decision table using synthetic intake packets.
- **Measurement-Readiness:** None — gate behaviour is pass/fail per decision table row.
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml` (read for gate context; mutations in TASK-03b)
- **Depends on:** TASK-02 (template path must exist), TASK-03b (loop-spec.yaml schema confirmed)
- **Blocks:** -
- **Confidence:** 81%
  - Implementation: 82% — gate decision table is fully specified; three behavioural branches are explicit. Key risk: glob-based file detection may require confirming the exact mechanism used by the startup-loop skill for other file checks.
  - Approach: 87% — mirrors S2 Market Intelligence gate pattern directly. Stable pointer pattern confirmed from market intelligence `latest.user.md` precedent.
  - Impact: 83% — gate is the central enforcement mechanism; correctness is critical. Idempotency and glob rules reduce the main failure modes.
- **Acceptance:**
  - Gate check present at S0→S1 transition, positioned before GATE-BD-01.
  - Decision table fully implemented:
    - `business_name_status` absent or `confirmed` → skip (no file read, no prompt write).
    - `business_name_status: unconfirmed`, no glob match → prompt generated (idempotent: skip if file already exists); blocking message emitted with verbatim resume instruction.
    - `business_name_status: unconfirmed`, glob match found → stable pointer `latest-naming-shortlist.user.md` written; gate passes; advisory emitted (update `business_name` and optionally flip status to `confirmed`).
  - Prompt generation is idempotent: if `docs/business-os/strategy/<BIZ>/*-naming-prompt.md` exists (any glob match), skip generation.
  - `naming_gate` field present in `/startup-loop status` output, computed from filesystem state: `skipped | blocked | complete`.
  - Verbatim resume instruction: "Place shortlist at `docs/business-os/strategy/<BIZ>/*-naming-shortlist.user.md` with required front matter (`recommended_business_name`, `shortlist`), then run `/startup-loop advance`."
- **Validation contract (VC-03):**
  - VC-01: Test row 1 (absent/confirmed): gate check does not generate any files; advance proceeds to GATE-BD-01. Pass: no new files created in strategy/<BIZ>/.
  - VC-02: Test row 2 (unconfirmed, no shortlist): prompt file generated at dated path; blocking message printed; advance blocked. Pass: prompt file exists, advance returns blocking status.
  - VC-03: Test row 2b (unconfirmed, no shortlist, re-run): second `/startup-loop advance` call does not overwrite prompt file. Pass: prompt file mtime unchanged.
  - VC-04: Test row 3 (unconfirmed, shortlist present): `latest-naming-shortlist.user.md` written; gate passes; advisory printed. Pass: stable pointer file exists, advance continues to GATE-BD-01.
  - VC-05: `naming_gate` field appears in status output with correct value for each row. Pass: status output parseable; field present.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan: Write the VC cases above before editing the skill file. Identify exact insertion point in `startup-loop/SKILL.md` (read the S0→S1 transition section).
  - Green evidence plan: Add gate check. Implement all three decision branches. Implement idempotent prompt generation. Implement stable pointer write. Add `naming_gate` to status computation.
  - Refactor evidence plan: Run all five VC checks using synthetic intake packets. Verify glob patterns match the spec. Confirm status output formatting is consistent with other gate fields.
- **Planning validation (required for M):**
  - Checks run: Read `.claude/skills/startup-loop/SKILL.md` S0→S1 section in full to confirm exact insertion point and confirm glob-based file detection is used for other gates.
  - Validation artifacts: Finding documented inline as scout note in execution.
  - Unexpected findings: If glob-based detection is not used elsewhere, escalate to `/lp-do-replan` before implementing.
- **Scouts:**
  - Read the S2 gate logic in `startup-loop/SKILL.md` end-to-end to confirm: (a) file-existence check mechanism, (b) blocking message format, (c) resume instruction format, (d) `latest.user.md` write pattern.
  - Confirm whether `startup-loop/SKILL.md` or `loop-spec.yaml` is the authoritative source for gate logic. (Gate logic may be in prose in SKILL.md but registered in spec. TASK-03b resolves this.)
- **Edge Cases & Hardening:**
  - Parse error on `business_name_status` (malformed YAML): fail-open — treat as `confirmed`, emit warning. Do not block advance.
  - Multiple shortlist files (glob returns >1 match): accept any match; pick `max(date)` deterministically; write stable pointer to that file.
  - `business_code` missing from intake packet: this is a precondition violation. Emit a hard error — do not attempt to derive a path. (Out of scope for this gate, but must not silently corrupt the path.)
- **What would make this >=90%:** Confirm glob-based file detection is used in existing S2 gate logic before implementing, reducing implementation uncertainty below 10%.
- **Rollout / rollback:**
  - Rollout: Additive edit to SKILL.md. No migration. Existing runs unaffected (absent = skipped).
  - Rollback: Remove GATE-BD-00 block from SKILL.md. Zero impact on existing businesses.
- **Documentation impact:** None beyond the SKILL.md edit itself and TASK-03b's loop-spec.yaml update.
- **Notes / references:** Gate BD-00 decision table: `docs/plans/startup-loop-business-naming/fact-find.md` § Scope. Artifact spec: fact-find.md § Data & Contracts.

---

### TASK-03b (INVESTIGATE → feeds TASK-03): Assess loop-spec.yaml schema for GATE-BD-00

_See task definition above — reproduced here for sequencing clarity._

This task runs in Wave 1 (parallel with TASK-01) and must complete before TASK-03 edits `loop-spec.yaml`. Its output is a documented finding in `fact-find.md` § Remaining Assumptions confirming: exact gate entry field list, spec_version decision, and any validation schema constraints. TASK-03 must not edit `loop-spec.yaml` without this finding.

Note: depending on the schema assessment finding, TASK-03 may include the `loop-spec.yaml` edit or it may require a separate TASK-03c. Assess at TASK-03b completion.

---

### TASK-04: Add shortlist read-in to `lp-brand-bootstrap/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-brand-bootstrap/SKILL.md` — reads `docs/business-os/strategy/<BIZ>/latest-naming-shortlist.user.md` front matter if present; extracts `recommended_business_name` to pre-fill brand dossier name field; skips gracefully with advisory if file absent or front matter malformed.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Build evidence:** Two targeted edits to `lp-brand-bootstrap/SKILL.md`. (1) Inputs table: new row for `latest-naming-shortlist.user.md` (No — optional; provides `recommended_business_name` via YAML front matter). (2) Step 1 expanded: new step 4 reads naming shortlist if present, extracts `recommended_business_name` and `shortlist` array from front matter, uses recommended name as primary name input in brand dossier, skips gracefully when file absent (no message), emits advisory when front matter malformed. VC-01 passed: pre-fill logic present. VC-02 passed: silent skip when file absent confirmed. VC-03 passed: advisory on malformed front matter present, execution continues.
- **Artifact-Destination:** `.claude/skills/lp-brand-bootstrap/SKILL.md`
- **Reviewer:** Peter
- **Approval-Evidence:** Peter confirms brand-bootstrap pre-fills name correctly when shortlist present; skips cleanly when absent.
- **Measurement-Readiness:** None — correctness check, not a measured metric.
- **Affects:** `.claude/skills/lp-brand-bootstrap/SKILL.md`, `[readonly] docs/plans/startup-loop-business-naming/fact-find.md`
- **Depends on:** TASK-02 (shortlist front matter schema must be final before brand-bootstrap can reference it)
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 83% — addition is small and well-bounded. Main risk: exact read-in mechanism in lp-brand-bootstrap depends on how it currently handles pre-existing strategy docs (not verified — see Scouts).
  - Approach: 87% — soft integration (graceful fallback) is the correct pattern; front matter schema is explicit and machine-readable.
  - Impact: 82% — if absent, brand-bootstrap simply doesn't pre-fill the name. Risk of degradation is low. Risk of brittle extraction is mitigated by requiring explicit front matter.
- **Acceptance:**
  - If `latest-naming-shortlist.user.md` exists and has valid `recommended_business_name` front matter: brand-bootstrap pre-fills the name field in the brand dossier template with that value.
  - If file absent: brand-bootstrap continues normally without the pre-fill; no error raised.
  - If front matter malformed or `recommended_business_name` key missing: brand-bootstrap skips pre-fill, emits a non-blocking advisory ("Naming shortlist found but front matter could not be parsed — fill business name manually").
  - `shortlist` array from front matter optionally available as context in brand-bootstrap output (informational only — not required).
- **Validation contract (VC-04):**
  - VC-01: With `latest-naming-shortlist.user.md` present and valid front matter: confirm brand dossier name field is pre-filled. Pass: name appears in dossier output.
  - VC-02: With file absent: confirm brand-bootstrap runs to completion without error. Pass: no exception, no blocking message.
  - VC-03: With front matter malformed: confirm advisory is emitted and brand-bootstrap continues. Pass: advisory message present; execution not blocked.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan: Read `lp-brand-bootstrap/SKILL.md` end-to-end. Identify the section where strategy/<BIZ>/ docs are currently read. Identify where the brand dossier name field is populated.
  - Green evidence plan: Add a conditional read block before the name field population: check for `latest-naming-shortlist.user.md`, attempt front matter parse, extract `recommended_business_name`, apply to name field. Add graceful-skip branches.
  - Refactor evidence plan: Run all three VCs. Confirm advisory wording is consistent with other brand-bootstrap advisories. Confirm the read block does not alter any other brand-bootstrap behaviour.
- **Planning validation:** None: S-effort.
- **Scouts:**
  - Read `lp-brand-bootstrap/SKILL.md` in full before implementation. Identify: (a) exactly where strategy/<BIZ>/ docs are read, (b) how the brand dossier template is populated (fill-by-reference vs fill-by-extraction), (c) whether there is an existing "pre-fill" or "context" mechanism.
- **Edge Cases & Hardening:**
  - `recommended_business_name` is an empty string: treat as malformed; emit advisory.
  - Multiple entries matching the stable pointer path: the pointer (`latest-naming-shortlist.user.md`) is a single stable file by design. If missing, fall back to glob (`*-naming-shortlist.user.md`) and pick `max(date)`. If still nothing, skip gracefully.
- **What would make this >=90%:** Read `lp-brand-bootstrap/SKILL.md` in full during planning and confirm exact insertion point — this is currently unverified (H4, Medium confidence in fact-find).
- **Rollout / rollback:**
  - Rollout: Additive edit to SKILL.md. Existing brand-bootstrap runs unaffected when file absent.
  - Rollback: Remove the read block from lp-brand-bootstrap/SKILL.md.
- **Documentation impact:** None beyond the SKILL.md edit.
- **Notes / references:** Shortlist front matter schema: `docs/plans/startup-loop-business-naming/fact-find.md` § Artifact Spec.

---

## Risks & Mitigations

- Glob-based shortlist detection not supported by existing startup-loop gate infrastructure → TASK-03 scout must confirm before implementation; escalate to `/lp-do-replan` if not supported.
- `loop-spec.yaml` requires `spec_version` bump → TASK-03b resolves; if required, communicate to any consumers of the spec before merging.
- lp-brand-bootstrap front matter extraction is more complex than anticipated (e.g. custom YAML parser needed) → TASK-04 scout confirms before implementation; if complex, reduce to a note in the brand dossier template rather than automated extraction.
- Intake packet blank template does not exist → TASK-01 creates it from HEAD-intake-packet.user.md. Non-blocking; accepted scope expansion.
- Prompt template quality insufficient for useful naming research → post-delivery pilot session with synthetic intake packet. Adjust template based on researcher feedback.

## Observability

- `naming_gate: skipped | blocked | complete` — computed from filesystem state; appears in `/startup-loop status` output (TASK-03).
- Idempotency log: gate should log "prompt already exists, skipping generation" when re-run blocked (TASK-03).
- Advisory messages: TASK-03 (name not yet confirmed) and TASK-04 (front matter parse issue) emit non-blocking console advisories.

## Acceptance Criteria (overall)

- [ ] TASK-01: Two new fields in intake packet template with documented semantics and fallback rules.
- [ ] TASK-02: Prompt template at `docs/business-os/market-research/_templates/deep-research-naming-prompt.md`; all placeholders mapped to Naming Prompt Seed Contract; front matter schema specified; four research task sections present.
- [ ] TASK-03: Gate decision table (3 rows) fully implemented in startup-loop/SKILL.md; idempotent; `naming_gate` in status output; verbatim resume instruction in blocking message.
- [ ] TASK-03b: loop-spec.yaml schema assessment documented in fact-find; spec_version decision recorded; GATE-BD-00 entry schema confirmed.
- [ ] TASK-04: lp-brand-bootstrap reads `latest-naming-shortlist.user.md` front matter gracefully; pre-fills name if present; skips with advisory if absent/malformed.
- [ ] End-to-end: One manual pilot session using a synthetic intake packet produces a naming shortlist that passes through the full gate cycle (blocked → shortlist returned → complete → brand-bootstrap pre-fills name).

## Decision Log

- 2026-02-17: `business_name_status` absent = `confirmed` (safe default; confirmed by Peter).
- 2026-02-17: Second-pass S2B naming prompt deferred (TASK-05 non-binding; confirmed by Peter).
- 2026-02-17: Stable `latest-naming-shortlist.user.md` file preferred over `loop-spec.yaml` pointer field (avoids schema creep; mirrors market intelligence `latest.user.md` pattern).
- 2026-02-17: Glob-based shortlist detection committed (not exact-path; avoids date-mismatch footgun).
- 2026-02-17: Naming step inserted at S0→S1 transition as GATE-BD-00 (before GATE-BD-01 brand-bootstrap).

## Overall-confidence Calculation

| Task | Effort (weight) | Confidence | Weighted |
|---|---:|---:|---:|
| TASK-01 | S = 1 | 85% | 85 |
| TASK-03b | S = 1 | 72% | 72 |
| TASK-02 | L = 3 | 83% | 249 |
| TASK-03 | M = 2 | 81% | 162 |
| TASK-04 | S = 1 | 82% | 82 |
| **Total** | **8** | — | **650** |

**Overall-confidence = 650 / 8 = 81%**
