---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-security-audit
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: weighted average(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/startup-loop-security-audit/analysis.md
---

# Startup Loop: Security Audit Integration — Plan

## Summary

The startup loop has no security audit gate: sites progress to launch without any check for OWASP runtime controls, dependency CVEs, secrets exposure, auth hardening, or HTTP headers. This plan adds a security domain to the S9B launch QA gate (`/lp-launch-qa`), enforces it via a new `cmd-advance/s9b-gates.md` module, registers the `GATE-LAUNCH-SEC` annotation in `loop-spec.yaml`, and adds `pnpm audit` + TruffleHog to the brikette and shared CI pipelines that currently bypass `ci.yml`'s security jobs.

The chosen approach (Option D — extend `lp-launch-qa`, defer self-evolving) is architecturally consistent with 6 existing domain modules, produces a unified QA report with a hard S9B→SIGNALS block, and is loop-wide (applies to all businesses). Self-evolving prescription registration is deferred pending confirmation of the prescription registry schema.

## Active tasks
- [ ] TASK-01: Create `lp-launch-qa/modules/domain-security.md`
- [ ] TASK-02: Update `lp-launch-qa/SKILL.md` to register security domain
- [ ] TASK-03: Add `GATE-LAUNCH-SEC` to `loop-spec.yaml` (version 3.14.0 → 3.15.0)
- [ ] TASK-04: Create `cmd-advance/s9b-gates.md` + 2 edits to `cmd-advance.md` + sync `startup-loop/SKILL.md`
- [ ] TASK-05: Add `pnpm audit` + TruffleHog to `brikette.yml` and `reusable-app.yml`

## Goals
- Add `domain-security.md` as the 7th domain in `lp-launch-qa` with 8 OWASP-focused checks as hard blockers.
- Add `GATE-LAUNCH-SEC` to the S9B stage in `loop-spec.yaml` (version bump 3.14.0 → 3.15.0).
- Create `cmd-advance/s9b-gates.md` + update `cmd-advance.md` Module Loading Order and Gate and Dispatch Map so GATE-LAUNCH-SEC is enforced (not just annotated) during S9B→SIGNALS advance.
- Add `pnpm audit --audit-level=high` and TruffleHog to `brikette.yml`; add both to `reusable-app.yml` (shared pipeline for caryina + future apps).
- Apply loop-wide: security gate is unconditional (`conditional: false` on S9B) — all businesses subject to it.

## Non-goals
- Penetration testing or manual red-team exercises.
- Rewriting existing auth infrastructure.
- Changing `ci.yml` core security jobs (they already work for non-brikette packages).
- Self-evolving prescription registration (deferred to gap-fill dispatch after prescription registry schema is confirmed).

## Constraints & Assumptions
- Constraints:
  - S9B is `conditional: false` — security gate must apply to every business.
  - Domain module output schema is fixed: `{ domain, status: pass|fail|warn, checks: [{ id, status, evidence }] }`.
  - `modules/cmd-advance.md` is the authoritative advance loader; both Module Loading Order and Gate and Dispatch Map must be updated for a gate to be enforced.
  - `startup-loop/SKILL.md` has hardcoded `loop_spec_version: 3.14.0` at two locations (lines 66 and 98) — both must be bumped to `3.15.0` in TASK-04.
  - Pre-existing high/critical CVEs in brikette dependencies will block TASK-05 CI until remediated. TASK-05 includes a pre-check.
- Assumptions:
  - Runtime HTTP header checks use `curl` against the deployed site URL (available from `latest.user.md`). Curl is standard in GitHub Actions and QA subagent contexts.
  - `stage-operator-map.json` is generated from `stage-operator-dictionary.yaml` (NOT `loop-spec.yaml`). No new stage is added by this plan, so regeneration is NOT automatically required. TASK-03 includes a parity check.
  - The QA report age window of 30 days (consistent with GATE-SELL-ACT-01 precedent) is appropriate for the security check freshness requirement.

## Inherited Outcome Contract

- **Why:** Security audits are required before any site goes live. There is currently no security-audit domain in the S9B launch QA gate, no structured runtime/site-level security checklist in the startup loop, and the CI-level checks that exist are absent from app-specific deploy workflows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every site progressing through the startup loop to launch is checked against a structured security baseline (OWASP top 10 runtime/headers, dependency CVEs, secrets, auth hardening, cookie security) before it goes live, with a hard gate preventing S9B→SIGNALS advance when critical security failures are present.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/startup-loop-security-audit/analysis.md`
- Selected approach inherited:
  - Option D: Extend `lp-launch-qa` with a 7th security domain; add cmd-advance enforcement; extend CI for brikette and shared pipelines; defer self-evolving.
- Key reasoning used:
  - Option A (and D as preferred variant) is the only architecturally consistent choice given 6 existing domain reference implementations.
  - CI-only (Option C) is structurally invalid for runtime HTTP header/CSP/cookie checks which require a live deployed site.
  - Standalone skill (Option B) fragments the unified domain model and breaks cross-domain synthesis in `lp-launch-qa`.
  - Self-evolving deferral is correct: shadow mode, no live impact, schema not confirmed.

## Selected Approach Summary
- What was chosen:
  - Extend `lp-launch-qa` with `domain-security.md` (8 OWASP checks, hard-fail on critical failures).
  - Enforce via `cmd-advance/s9b-gates.md` (new) + `cmd-advance.md` (updated Module Loading Order and Gate and Dispatch Map).
  - Sync `startup-loop/SKILL.md` internal modules table and spec_version references.
  - Add `pnpm audit --audit-level=high` + TruffleHog to `brikette.yml` and `reusable-app.yml`.
  - Bump `loop-spec.yaml` to version 3.15.0 with GATE-LAUNCH-SEC annotation.
- Why planning is not reopening option selection:
  - All three alternatives were eliminated in analysis with documented rationale.
  - No operator-only questions remain open.
  - The four-file enforcement path for TASK-04 was fully specified in the analysis critique loop.

## Fact-Find Support
- Supporting brief: `docs/plans/startup-loop-security-audit/fact-find.md`
- Evidence carried forward:
  - `lp-launch-qa/SKILL.md` dispatches 6 domains; domain output schema confirmed.
  - `modules/cmd-advance.md` Module Loading Order (lines 22-28) and Gate and Dispatch Map confirmed as authoritative advance loader.
  - `ci.yml` paths-ignore explicitly excludes `apps/brikette/**` — TruffleHog and pnpm audit gap confirmed.
  - `reusable-app.yml` supports `workflow_dispatch` (via caryina.yml line 33) — bypasses `ci.yml` for manual deploys.
  - `startup-loop/SKILL.md` hardcoded `loop_spec_version: 3.14.0` at lines 66 and 98.
  - `loop-spec.yaml` current version 3.14.0; S9B stage at line 1207.
  - `stage-operator-map.json` generated from `stage-operator-dictionary.yaml`, not `loop-spec.yaml`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `lp-launch-qa/modules/domain-security.md` | 89% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update `lp-launch-qa/SKILL.md` to register security domain | 88% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Add `GATE-LAUNCH-SEC` to `loop-spec.yaml` (v3.14.0 → v3.15.0) | 87% | S | Pending | - | TASK-04 |
| TASK-04 | IMPLEMENT | Create `cmd-advance/s9b-gates.md` + 2 edits to `cmd-advance.md` + sync `startup-loop/SKILL.md` | 84% | M | Pending | TASK-03 | - |
| TASK-05 | IMPLEMENT | Add `pnpm audit` + TruffleHog to `brikette.yml` and `reusable-app.yml` | 84% | M | Pending | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — all changes are markdown skill files and YAML/workflow files | - | No UI surface |
| UX / states | N/A — CLI operator surface only; no UI state machine | - | Operator-facing via `/lp-launch-qa` and `/startup-loop advance` |
| Security / privacy | Core deliverable: 8 OWASP runtime checks with hard-fail semantics; CI dependency audit + secret scanning | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | All tasks contribute to the security gate |
| Logging / observability / audit | Security domain check results emitted into unified QA report; loop-state updated with security verdict; CI audit output logged | TASK-01, TASK-02 | Domain schema includes evidence strings per check |
| Testing / validation | Integration-tested via live `/lp-launch-qa --domain security` run on brikette staging; cmd-advance gate tested via `/startup-loop advance` from S9B with no recent QA report | TASK-01, TASK-04 | Follows untested domain module convention — live run is the test |
| Data / contracts | Domain output schema unchanged (additive only); loop-spec version bump to 3.15.0; cmd-advance.md two-entry update; SKILL.md spec_version sync | TASK-02, TASK-03, TASK-04 | Additive; no downstream consumers affected |
| Performance / reliability | N/A — static markdown definitions and YAML; no runtime hot paths | - | Domain modules are read by QA subagent at QA time |
| Rollout / rollback | Additive gate; existing loop state unaffected; rollback is revert of domain-security.md + cmd-advance.md entries | TASK-01, TASK-03, TASK-04, TASK-05 | Gate only fires on new/re-run QA — not retroactive |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-05 | None | All independent; TASK-05 should run CVE pre-check first |
| 2 | TASK-02, TASK-04 | TASK-01 (for TASK-02); TASK-03 (for TASK-04) | TASK-02 needs check IDs from TASK-01; TASK-04 needs gate ID from TASK-03 |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| **S9B launch QA gate** | Operator runs `/lp-launch-qa --business <BIZ>` after DO completes | 1. Skill dispatches 7 domain subagents in parallel (security added as 7th). 2. Security subagent runs 8 checks: HTTPS enforcement, HTTP security headers, CSP, cookie security flags, repository secrets exposure, auth hardening, CORS policy, dependency CVE audit. 3. If site URL unreachable → `status: fail` (hard). 4. Results merged into unified QA report. 5. GATE-LAUNCH-SEC failure → NO-GO verdict. | TASK-01, TASK-02 | Site unreachability must fail closed — `status: fail` not `status: warn`. |
| **S9B→SIGNALS advance gate** | Operator runs `/startup-loop advance --business <BIZ>` from S9B | 1. `cmd-advance.md` Module Loading Order rule 6 routes to `s9b-gates.md` for S9B→SIGNALS transition. 2. `s9b-gates.md` globs `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-*.md`, parses YYYY-MM-DD from filename to determine age. 3. If no report or age >30 days → hard block. 4. If recent report has security domain `status: fail` → hard block with GATE-LAUNCH-SEC message. 5. If gate passes → advance proceeds normally. Consumer coupling: `s9b-gates.md` reads the QA report artifact written by `lp-launch-qa` (TASK-01/TASK-02); any schema change to the QA report requires updating `s9b-gates.md` read logic. | TASK-03, TASK-04 | 30-day window uses filename date (not mtime); filesystem-only check (no HTTP call at advance time). |
| **CI: brikette deploy pipeline** | Push to `dev`, `staging`, or `main` with brikette-scoped changes | 1. `brikette.yml` runs `pnpm audit --audit-level=high --filter brikette` (hard fail). 2. Runs TruffleHog `--only-verified` on git history. 3. Only if both pass → existing build/deploy/test jobs proceed. | TASK-05 | Pre-existing high/critical CVEs will block CI until remediated. TASK-05 must pre-check. |
| **CI: shared app pipeline** | Push or `workflow_dispatch` triggering caryina (or future app) deploys | 1. `reusable-app.yml` runs `pnpm audit --audit-level=high --filter <app-filter>` (hard fail). 2. Runs TruffleHog `--only-verified`. 3. Only if both pass → existing build/deploy jobs proceed. | TASK-05 | `app-filter` input from caller determines audit scope. TruffleHog covers full git history. |
| **Loop-spec stage definition** | Loop-spec version bump to 3.15.0 (TASK-03) | 1. `loop-spec.yaml` version bumped from 3.14.0 to 3.15.0. 2. S9B stage definition gains `GATE-LAUNCH-SEC: Hard` gate annotation. 3. Parity check: if `stage-operator-dictionary.yaml` spec_version also needs bumping, run regeneration of `stage-operator-map.json`; otherwise note advisory gap. | TASK-03 | `stage-operator-map.json` is NOT auto-regenerated from loop-spec changes — generator reads `stage-operator-dictionary.yaml`. No new stage added, so regeneration is conditional only. |

## Tasks

---

### TASK-01: Create `lp-launch-qa/modules/domain-security.md`
- **Type:** IMPLEMENT
- **Deliverable:** New file `.claude/skills/lp-launch-qa/modules/domain-security.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/lp-launch-qa/modules/domain-security.md` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 89%
  - Implementation: 90% — proven pattern; 6 reference modules exist (domain-legal.md, domain-conversion.md, etc.); schema is fixed
  - Approach: 90% — 8 OWASP checks documented in fact-find with clear severity rules
  - Impact: 88% — integration-tested via live `/lp-launch-qa --domain security` run; curl-based HTTP checks are standard
- **Acceptance:**
  - File exists at `.claude/skills/lp-launch-qa/modules/domain-security.md`.
  - Frontmatter: `Domain: security`, `Status: Active`.
  - Contains exactly 8 check definitions: SEC-01 through SEC-08 with `id`, `description`, `how_to_check`, `severity`, `fail_condition`, `pass_condition`.
  - Gate rule: any `fail` result on SEC-01–SEC-05, SEC-07 → `status: fail`; high/critical CVEs on SEC-08 → `status: fail`; SEC-06 auth hardening fail → `status: fail`; warnings on SEC-06/SEC-08 subissues → `status: warn`.
  - Site unreachable: domain sets `status: fail` with `evidence: "site unreachable — security baseline unverified"`.
  - Output schema matches existing domains: `{ domain: "security", status: pass|fail|warn, checks: [{ id, status, evidence }] }`.
  - Smoke-test: `/lp-launch-qa --domain security --business brikette` executes against brikette staging and returns a valid domain result object.
- **Engineering Coverage:**
  - UI / visual: N/A — markdown file, no UI
  - UX / states: N/A — CLI operator surface
  - Security / privacy: Required — core deliverable; 8 OWASP checks with hard-fail semantics
  - Logging / observability / audit: Required — `evidence` strings per check included in unified QA report
  - Testing / validation: Required — live `/lp-launch-qa --domain security --business brikette` run is the integration test
  - Data / contracts: Required — output schema must conform to existing domain schema; check IDs (SEC-01–SEC-08) become stable references for TASK-02 and TASK-03
  - Performance / reliability: N/A — static markdown file read by QA subagent
  - Rollout / rollback: Required — additive (new file only); rollback is `git rm` of this file
- **Validation contract (TC-XX):**
  - TC-01: Site reachable, HTTPS enforced, all headers present → `status: pass`, all 8 checks `status: pass`
  - TC-02: Site URL unreachable → `status: fail`, single check `status: fail`, evidence includes "unreachable" message
  - TC-03: Missing `X-Frame-Options` header → SEC-02 `status: fail`, domain `status: fail`
  - TC-04: CSP header absent → SEC-03 `status: fail`, domain `status: fail`
  - TC-05: High CVE in pnpm audit output → SEC-08 `status: fail`, domain `status: fail`
  - TC-06: Auth rate limiting missing (warn-level finding) → SEC-06 `status: warn`, domain `status: warn` (not fail)
- **Execution plan:**
  - Red: No `domain-security.md` file exists; `/lp-launch-qa --domain security` would fail or skip.
  - Green: Create `domain-security.md` following `domain-legal.md` pattern. Define SEC-01–SEC-08 checks. Set gate rules. Set unreachable site = fail. Validate output schema matches existing domains.
  - Refactor: Confirm `how_to_check` instructions use `curl -sI` for header checks (not external services) and `git ls-files | xargs grep -r` for repo secret scanning.
- **Planning validation (required for M/L):**
  - None: S effort — not required
- **Scouts:**
  - Verify curl-based HTTP header check syntax is consistent with how existing lp-launch-qa modules invoke tools (e.g., domain-performance.md).
  - Verify `domain-legal.md` frontmatter fields to confirm all required fields for TASK-01.
- **Edge Cases & Hardening:**
  - Site unreachable: must return `status: fail` (not `warn`) — checked by TC-02.
  - SEC-08 (dep CVE) only fails on `--audit-level=high`; moderate/low CVEs → `status: warn`.
  - SEC-05 (repo secrets) uses `git ls-files` only — does NOT scan build artifacts (CI TruffleHog covers those).
  - CORS check (SEC-07): wildcard `Access-Control-Allow-Origin: *` on `/api/*` endpoints is a fail; on static assets it is a warn.
- **What would make this >=90%:**
  - Confirm that `curl` is explicitly available in the QA subagent's execution environment (currently assumed standard).
  - Add a `domain-security.md` dry-run test against brikette staging before TASK-02 proceeds.
- **Rollout / rollback:**
  - Rollout: New file only; no existing behavior changes. Gate fires only when domain is explicitly invoked.
  - Rollback: `git rm .claude/skills/lp-launch-qa/modules/domain-security.md`
- **Documentation impact:**
  - None beyond the file itself; TASK-02 registers it in SKILL.md.
- **Notes / references:**
  - Reference modules: `.claude/skills/lp-launch-qa/modules/domain-legal.md`, `domain-performance.md`.
  - Output schema: `.claude/skills/lp-launch-qa/SKILL.md` domain dispatch section.

---

### TASK-02: Update `lp-launch-qa/SKILL.md` to register security domain
- **Type:** IMPLEMENT
- **Deliverable:** Modified `.claude/skills/lp-launch-qa/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/lp-launch-qa/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — adding one domain to an existing list; pattern is clear
  - Approach: 90% — straightforward registration; no structural change to SKILL.md
  - Impact: 85% — depends on TASK-01 check IDs being stable (SEC-01–SEC-08)
- **Acceptance:**
  - `domain-security` appears in the domain list alongside the existing 6 domains.
  - `--domain all` dispatch includes `domain-security` as a 7th parallel subagent.
  - `--domain security` invokes `modules/domain-security.md`.
  - Blocker threshold section updated: security domain `status: fail` is a blocker (equivalent to legal domain fail).
  - No other sections of SKILL.md are changed.
- **Engineering Coverage:**
  - UI / visual: N/A — markdown file, no UI
  - UX / states: N/A — CLI operator surface
  - Security / privacy: Required — ensures security is a first-class domain in the gate skill
  - Logging / observability / audit: Required — security domain included in unified QA report output
  - Testing / validation: Required — validate by running `/lp-launch-qa --domain all --business brikette` and confirming 7 domains dispatched
  - Data / contracts: Required — blocker threshold update in SKILL.md must reference correct domain identifier `security`
  - Performance / reliability: N/A — markdown file
  - Rollout / rollback: Required — rollback is revert of SKILL.md change; domain-security.md can remain (harmless without registration)
- **Validation contract (TC-XX):**
  - TC-01: `/lp-launch-qa --domain all` invocation confirms 7 domains dispatched (including `security`)
  - TC-02: `/lp-launch-qa --domain security` invocation loads `domain-security.md` and returns result
  - TC-03: SKILL.md blocker section lists `security` domain fail as a go/no-go blocker
- **Execution plan:**
  - Red: SKILL.md does not reference `domain-security`; `--domain security` is unrecognised.
  - Green: Add `security` to domain list. Add `domain-security` to `--domain all` dispatch array. Add security module routing (`--domain security` → `modules/domain-security.md`). Update blocker threshold section.
  - Refactor: Confirm domain list ordering (alphabetical or by pipeline stage) is consistent with existing pattern.
- **Planning validation (required for M/L):**
  - None: S effort — not required
- **Scouts:**
  - Confirm exact SKILL.md domain list format (array vs inline text) before editing.
- **Edge Cases & Hardening:**
  - Domain identifier must match exactly between SKILL.md dispatch map and `domain-security.md` frontmatter `Domain:` field.
- **What would make this >=90%:**
  - Confirm SKILL.md domain list format before edit; reduces risk of format mismatch.
- **Rollout / rollback:**
  - Rollout: One-line additions to an existing dispatch list; no structural changes.
  - Rollback: `git revert` of SKILL.md change; `domain-security.md` remains but is unreachable.
- **Documentation impact:**
  - None additional.
- **Notes / references:**
  - Read SKILL.md domain list and blocker threshold section before editing.

---

### TASK-03: Add `GATE-LAUNCH-SEC` to `loop-spec.yaml` (v3.14.0 → v3.15.0)
- **Type:** IMPLEMENT
- **Deliverable:** Modified `docs/business-os/startup-loop/specifications/loop-spec.yaml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/specifications/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 87%
  - Implementation: 88% — version bump + gate annotation; S9B stage location confirmed (line 1207)
  - Approach: 90% — GATE pattern established in existing stage annotations
  - Impact: 85% — parity check for stage-operator-map.json adds a small advisory step
- **Acceptance:**
  - `spec_version` bumped from `3.14.0` to `3.15.0`.
  - S9B stage definition contains a `gates:` block with `GATE-LAUNCH-SEC: { severity: Hard, description: "Security QA domain must pass before SIGNALS advance" }` — if no `gates:` key exists in the current S9B stage block, scan the nearest stage in the file that contains a `gates:` key and replicate its exact YAML indentation and key structure. Chosen structure must be defined in the commit message; "equivalent pattern" is not an acceptable substitute for a defined schema.
  - `[DO, S9B]` and `[S9B, SIGNALS]` ordering constraints unchanged.
  - Parity check run: read `docs/business-os/startup-loop/specifications/loop-spec.yaml` and `docs/business-os/startup-loop/_generated/stage-operator-map.json` — confirm whether `stage-operator-dictionary.yaml` spec_version field also needs bumping. If yes: run `pnpm --filter scripts tsx scripts/src/startup-loop/generate-stage-operator-views.ts` (regeneration script: `scripts/src/startup-loop/generate-stage-operator-views.ts`). If no: record advisory note in Decision Log (no new stage added by this plan — regeneration not mandatory).
  - YAML gate annotation structure: scan existing S9B stage block in `loop-spec.yaml` lines 1200-1230 before writing the GATE-LAUNCH-SEC annotation. If no existing gate annotation pattern exists in the file, use the nearest stage block with a `gates:` key as reference; define the structure explicitly in the commit rather than deferring to "equivalent pattern".
  - YAML is valid (no parse errors).
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — gate annotation makes GATE-LAUNCH-SEC a formal loop contract
  - Logging / observability / audit: N/A — YAML definition; no logging
  - Testing / validation: Required — YAML validity check; parity check between loop-spec and stage-operator-map.json
  - Data / contracts: Required — `GATE-LAUNCH-SEC` ID becomes a stable reference for TASK-04 (cmd-advance); must be consistent across both files
  - Performance / reliability: N/A — YAML file; no runtime hot path
  - Rollout / rollback: Required — additive gate annotation; existing loop-state checkpoints unaffected; rollback is revert + version revert
- **Validation contract (TC-XX):**
  - TC-01: YAML parses without error; `spec_version: "3.15.0"` present
  - TC-02: S9B stage block contains `GATE-LAUNCH-SEC` with `severity: Hard`
  - TC-03: `[DO, S9B]` and `[S9B, SIGNALS]` ordering unchanged
  - TC-04: Parity check — `stage-operator-map.json` either updated or advisory note recorded
- **Execution plan:**
  - Red: `loop-spec.yaml` at `3.14.0`, S9B has no gate annotation.
  - Green: Bump `spec_version` to `3.15.0`. Add `GATE-LAUNCH-SEC` gate annotation to S9B stage. Validate YAML. Run parity check.
  - Refactor: Confirm gate annotation YAML structure matches existing gate patterns in `loop-spec.yaml` (if any exist) or follow nearest schema convention.
- **Planning validation (required for M/L):**
  - None: S effort — not required
- **Scouts:**
  - Read `docs/business-os/startup-loop/specifications/loop-spec.yaml` lines 1200–1220 to confirm S9B stage structure and any existing gate annotation format before writing.
  - Check `docs/business-os/startup-loop/_generated/stage-operator-map.json` for `spec_version` field — if present and set to `3.14.0`, note whether `stage-operator-dictionary.yaml` needs updating.
- **Edge Cases & Hardening:**
  - `stage-operator-map.json` is generated from `stage-operator-dictionary.yaml` (not `loop-spec.yaml`) — bumping loop-spec alone does NOT regenerate the map. No new stage is added by this task, so regeneration is conditional: if dictionary spec_version also needs bumping, run it; otherwise leave map as-is and note the parity gap.
  - GATE-LAUNCH-SEC ID must be spelled identically in `loop-spec.yaml` and `cmd-advance/s9b-gates.md` (TASK-04). Agree on casing before committing.
- **What would make this >=90%:**
  - Pre-read the actual YAML gate annotation pattern from an existing gated stage (if any) before writing. Reduces risk of format mismatch with TASK-04.
- **Rollout / rollback:**
  - Rollout: Version bump is additive and non-breaking; existing loop runs at any stage are unaffected.
  - Rollback: Revert `spec_version` to `3.14.0`, remove gate annotation. Any TASK-04 changes must also be reverted.
- **Documentation impact:**
  - None: gate annotation is self-documenting in the spec.
- **Notes / references:**
  - `loop-spec.yaml` S9B stage confirmed at line 1207; version at `3.14.0`.
  - `[DO, S9B]` and `[S9B, SIGNALS]` ordering at lines 1291-1292.

---

### TASK-04: Create `cmd-advance/s9b-gates.md` + 2 edits to `cmd-advance.md` + sync `startup-loop/SKILL.md`
- **Type:** IMPLEMENT
- **Deliverable:** New `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`; modified `.claude/skills/startup-loop/modules/cmd-advance.md` (2 independent section edits: Module Loading Order AND Gate and Dispatch Map); modified `.claude/skills/startup-loop/SKILL.md` (2 independent edits: modules table AND spec_version refs). Scope: 3 files, 4 distinct edits.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md` (new), `.claude/skills/startup-loop/modules/cmd-advance.md` (2 edits), `.claude/skills/startup-loop/SKILL.md` (2 edits)
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 82% — 3-file / 4-edit scope; Module Loading Order insert position confirmed (between current rule 5 and rule 6); Gate and Dispatch Map new section confirmed
  - Approach: 88% — pattern is clear from existing gate module implementations (e.g., `signals-gates.md`); 3-file / 4-edit scope fully specified in analysis critique
  - Impact: 85% — this is the enforcement path; without it GATE-LAUNCH-SEC is documented but not enforced
- **Acceptance:**
  - `s9b-gates.md` exists at `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`.
  - `s9b-gates.md` contains: gate ID `GATE-LAUNCH-SEC`, check logic (QA report artifact ≤30 days old with `security` domain `status: pass`), block message (human-readable), check is filesystem-only (no HTTP call at advance time). QA report glob path used: `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-*.md`. Report age determined by parsing the `YYYY-MM-DD` date in the filename (not file mtime).
  - `cmd-advance.md` Module Loading Order updated: new rule inserted between current rule 5 (sell-gates) and rule 6 (gap-fill-gates, always): `"Load modules/cmd-advance/s9b-gates.md when the current transition touches the S9B launch QA gate or the S9B→SIGNALS advance."` — gap-fill-gates.md becomes the new rule 7.
  - `cmd-advance.md` Gate and Dispatch Map updated: new `QA / Security Family` section added with `GATE-LAUNCH-SEC` → `s9b-gates.md` mapping (mirroring the format of the existing Assessment Family, Sell Family, etc. sections).
  - `startup-loop/SKILL.md` internal modules table (line 52): `s9b-gates.md` added as a registered submodule.
  - `startup-loop/SKILL.md` hardcoded `loop_spec_version` references at lines 66 and 98 both bumped from `3.14.0` to `3.15.0`.
  - Smoke-test: run `/startup-loop advance --business brikette` from S9B with no recent QA report → blocked with GATE-LAUNCH-SEC message. Run again after a passing QA report exists → advances.
- **Engineering Coverage:**
  - UI / visual: N/A — markdown/YAML files
  - UX / states: Required — two states: (1) block with clear GATE-LAUNCH-SEC message when gate fails; (2) pass-through when gate succeeds
  - Security / privacy: Required — this is the enforcement that makes GATE-LAUNCH-SEC binding, not just annotated
  - Logging / observability / audit: Required — s9b-gates.md must log the gate check result with evidence (QA report path + date checked)
  - Testing / validation: Required — integration-tested via `/startup-loop advance` from S9B in both blocked and passing states
  - Data / contracts: Required — `GATE-LAUNCH-SEC` ID must match `loop-spec.yaml` (TASK-03); QA report path convention must match report artifact path from `lp-launch-qa`; spec_version sync at SKILL.md lines 66 and 98
  - Performance / reliability: N/A — filesystem reads only; no external calls
  - Rollout / rollback: Required — rollback is revert of all 4 file changes (s9b-gates.md deleted, cmd-advance.md reverted, SKILL.md reverted)
- **Validation contract (TC-XX):**
  - TC-01: `/startup-loop advance` from S9B with no QA report → blocked; output contains `GATE-LAUNCH-SEC`
  - TC-02: `/startup-loop advance` from S9B with QA report >30 days old (filename date >30 days ago) → blocked with staleness message
  - TC-03: `/startup-loop advance` from S9B with recent QA report + security `status: fail` → blocked with security fail message
  - TC-04: `/startup-loop advance` from S9B with recent QA report + security `status: pass` → advances normally
  - TC-05: `cmd-advance.md` Module Loading Order rule 6 text is "when the current transition touches the S9B launch QA gate or the S9B→SIGNALS advance" (gap-fill-gates.md renumbered to rule 7)
  - TC-06: `cmd-advance.md` Gate and Dispatch Map contains `QA / Security Family` section with GATE-LAUNCH-SEC entry
  - TC-07: `startup-loop/SKILL.md` `loop_spec_version` at lines 66 and 98 both read `3.15.0`
- **Execution plan:**
  - Red: No `s9b-gates.md` exists; S9B→SIGNALS advance has no security gate enforcement despite TASK-03 annotation.
  - Green: (1) Read existing gate module (e.g., `signals-gates.md`) as reference for `s9b-gates.md` structure. (2) Create `s9b-gates.md` with GATE-LAUNCH-SEC check logic (≤30 day QA report with security pass). (3) Update `cmd-advance.md` Module Loading Order with S9B→SIGNALS conditional load rule. (4) Update `cmd-advance.md` Gate and Dispatch Map with QA/Security Family entry. (5) Update `startup-loop/SKILL.md` internal modules table to include `s9b-gates.md`. (6) Update `startup-loop/SKILL.md` `loop_spec_version` at lines 66 and 98 to `3.15.0`.
  - Refactor: Verify `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md` glob matches at least one existing artifact for a business that has completed S9B, confirming the path convention is live in the repo.
- **Planning validation:**
  - Checks run:
    - Read `.claude/skills/startup-loop/modules/cmd-advance.md` lines 22-28 (Module Loading Order) and Gate and Dispatch Map section to confirm insert positions and format.
    - Read an existing gate module (e.g., `.claude/skills/startup-loop/modules/cmd-advance/signals-gates.md`) for `s9b-gates.md` structural reference.
    - Read `.claude/skills/startup-loop/SKILL.md` lines 50-60 (modules table) and lines 62-100 (version refs) to confirm exact line numbers.
  - Validation artifacts: QA report output path confirmed from `lp-launch-qa/SKILL.md` line 42: `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md`. s9b-gates.md must use this exact pattern.
  - Unexpected findings: If `signals-gates.md` does not exist or has a different structure, use the next closest gate module as reference.
- **Scouts:**
  - Consumer tracing — `s9b-gates.md`: consumed by `cmd-advance.md` Module Loading Order (registers it for S9B→SIGNALS). No other consumers.
  - Consumer tracing — `cmd-advance.md` Module Loading Order: consumed by `/startup-loop advance` at runtime. Existing callers unaffected (no new stage; only new S9B-specific branch added).
  - Consumer tracing — `startup-loop/SKILL.md` spec_version refs: consumed by contract validators; bumping from 3.14.0 to 3.15.0 must be consistent with TASK-03 loop-spec.yaml bump.
  - QA report path confirmed in planning: `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md` (from `lp-launch-qa/SKILL.md` line 42). s9b-gates.md must use glob `launch-qa-report-*.md` and parse the YYYY-MM-DD filename date for age calculation.
  - Module Loading Order insert position confirmed: between current rule 5 (sell-gates) and rule 6 (gap-fill-gates). New rule: "Load `modules/cmd-advance/s9b-gates.md` when the current transition touches the S9B launch QA gate or the S9B→SIGNALS advance." Gap-fill-gates.md renumbers to rule 7.
- **Edge Cases & Hardening:**
  - Gate must check QA report age (≤30 days), not just existence — a stale passing report from a previous loop run should not unlock the advance.
  - QA report path must use the business slug consistently with how `lp-launch-qa` writes it; hardcoded path assumptions must be verified.
  - spec_version bump at lines 66 and 98 of `startup-loop/SKILL.md` are independent of the modules table at line 52 — all three must be confirmed in sequence during execution.
- **What would make this >=90%:**
  - Module Loading Order insert position is confirmed: rule 6 (between sell-gates and gap-fill-gates). Gate and Dispatch Map format is confirmed from existing family sections. Exact wording pre-specified in Acceptance and Scouts.
- **Rollout / rollback:**
  - Rollout: Additive to cmd-advance.md; new gate module file; SKILL.md version sync. No existing advance flows change.
  - Rollback: Delete `s9b-gates.md`; revert `cmd-advance.md` Module Loading Order and Gate and Dispatch Map; revert `startup-loop/SKILL.md` modules table and spec_version refs.
- **Documentation impact:**
  - `startup-loop/SKILL.md` internal modules table update is self-documenting.
- **Notes / references:**
  - Analysis critique found that the original TASK-04 incorrectly targeted `SKILL.md` as the advance loader — `cmd-advance.md` is authoritative. This plan correctly targets `cmd-advance.md` with 2 independent section edits (Module Loading Order + Gate and Dispatch Map).
  - Active task header now reads "3-file / 4-edit scope" to prevent a builder from treating the two cmd-advance.md section edits as a single update.
  - QA report age threshold of 30 days is consistent with GATE-SELL-ACT-01 precedent.

---

### TASK-05: Add `pnpm audit` + TruffleHog to `brikette.yml` and `reusable-app.yml`
- **Type:** IMPLEMENT
- **Deliverable:** Modified `.github/workflows/brikette.yml`; modified `.github/workflows/reusable-app.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.github/workflows/brikette.yml`, `.github/workflows/reusable-app.yml`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 82% — CVE pre-check adds uncertainty; pnpm audit filter scoping for reusable-app.yml requires care
  - Approach: 88% — patterns from `ci.yml` security-audit and secret-scanning jobs are direct references
  - Impact: 88% — hard fail CI security gate on every brikette and caryina deploy
- **Acceptance:**
  - **Pre-check (in-task):** Run `pnpm audit --audit-level=high --filter brikette` and `pnpm audit --audit-level=high --filter caryina` locally. If high/critical CVEs found → remediate them first before adding hard-fail CI step. Record findings in Decision Log. **CVE GHSA-p6mc-m468-83gw (ignored in `ci.yml`) must be checked against brikette/caryina dependency trees — if present, add `--ignore GHSA-p6mc-m468-83gw` to match `ci.yml` pattern. This is a blocking check before the hard-fail step lands.**
  - `brikette.yml`: new `security-audit` job added before build/deploy jobs with `pnpm audit --audit-level=high --filter brikette` (hard fail, exit 1 on any high/critical; include `--ignore GHSA-p6mc-m468-83gw` if CVE is present in brikette dependency tree).
  - `brikette.yml`: new `secret-scanning` job added with TruffleHog (`trufflesecurity/trufflehog@v3`, `--only-verified` flag).
  - `reusable-app.yml`: new `security-audit` job added with `pnpm audit --audit-level=high --filter ${{ inputs.app-filter }}` (uses existing `app-filter` input; include `--ignore GHSA-p6mc-m468-83gw` if CVE applicable to callers).
  - `reusable-app.yml`: new `secret-scanning` job added with TruffleHog (`--only-verified`).
  - Both workflow files: build/deploy jobs have `needs: [security-audit, secret-scanning]` dependency.
  - Existing jobs in both workflows are unchanged.
  - CI passes on a push to `dev` after TASK-05 changes are committed (no pre-existing blocking CVEs after pre-check remediation).
- **Engineering Coverage:**
  - UI / visual: N/A — CI workflow YAML; no UI
  - UX / states: N/A
  - Security / privacy: Required — core deliverable; hard-fail dependency audit and secret scanning on every app-specific deploy
  - Logging / observability / audit: Required — CI job output logs audit results; fail messages visible in GitHub Actions UI
  - Testing / validation: Required — validated by CI run passing after commit; pre-check run before adding hard-fail step
  - Data / contracts: Required — `app-filter` input from callers of `reusable-app.yml` must be passed through to `pnpm audit --filter` correctly
  - Performance / reliability: N/A — CI jobs; no production hot path
  - Rollout / rollback: Required — if pre-existing CVEs exist, they block CI until remediated; rollback removes the security jobs from both workflows
- **Validation contract (TC-XX):**
  - TC-01: Push to dev with brikette changes → brikette.yml `security-audit` and `secret-scanning` jobs appear in GitHub Actions and pass
  - TC-02: `pnpm audit --audit-level=high --filter brikette` exits 0 (no high/critical CVEs after pre-check remediation)
  - TC-03: TruffleHog `--only-verified` in brikette.yml exits 0 (no verified secrets)
  - TC-04: reusable-app.yml called by caryina.yml: `security-audit` and `secret-scanning` jobs appear and pass
  - TC-05: Manual `workflow_dispatch` on caryina.yml triggers reusable-app.yml including security jobs
  - TC-06: Build/deploy jobs in both workflows have `needs:` references to security jobs (confirming sequential gate enforcement)
- **Execution plan:**
  - Red: `brikette.yml` and `reusable-app.yml` have no security jobs; brikette deploys and caryina workflow_dispatch deploys run without dependency audit or secret scanning.
  - Green: (1) Run CVE pre-check for brikette and caryina; remediate any high/critical findings. (2) Copy `security-audit` job structure from `ci.yml` (pnpm audit with `--filter` scoping). (3) Copy `secret-scanning` job from `ci.yml` (TruffleHog v3 `--only-verified`). (4) Add both jobs to `brikette.yml` before build job. (5) Add both jobs to `reusable-app.yml` with `app-filter` input threaded through. (6) Add `needs: [security-audit, secret-scanning]` to build/deploy jobs in both files. (7) Push to dev and verify CI passes.
  - Refactor: Confirm TruffleHog action version matches `ci.yml` (avoid version drift).
- **Planning validation:**
  - Checks run:
    - Read `.github/workflows/ci.yml` security-audit and secret-scanning job definitions for reference patterns.
    - Confirm `reusable-app.yml` `inputs:` block to understand how `app-filter` is passed (to ensure `--filter ${{ inputs.app-filter }}` is valid syntax).
    - Run pre-check: `pnpm audit --audit-level=high --filter brikette` and record findings.
  - Validation artifacts: CVE pre-check output to be recorded in Decision Log.
  - Unexpected findings: If high/critical CVEs exist, they must be remediated before CI step is committed. Plan for additional CVE fix commits.
- **Scouts:**
  - Consumer tracing — `reusable-app.yml` security jobs: consumed by all callers (`caryina.yml` + any future app); `app-filter` input must be non-empty for all callers. Verify `caryina.yml` passes `app-filter: caryina`.
  - Confirm `pnpm audit` supports `--filter` scoping within a workspace (not just global audit). If not, scope via working directory change.
- **Edge Cases & Hardening:**
  - TruffleHog `--only-verified`: consistent with `ci.yml` usage; avoids false positives on non-confirmed secrets.
  - pnpm audit `--audit-level=high`: ignores moderate/low CVEs; consistent with `ci.yml` pattern.
  - Known ignored CVE in `ci.yml`: `--ignore GHSA-p6mc-m468-83gw` — check if this CVE is in brikette's dependency tree too; if so, add the same ignore flag.
  - `reusable-app.yml` is `workflow_call`-only (no `workflow_dispatch` itself) — any manual dispatch goes through the caller (e.g., `caryina.yml`). Verify security jobs run on all trigger types by checking caller definitions.
- **What would make this >=90%:**
  - Confirm no high/critical CVEs exist before adding hard-fail step (the pre-check covers this, but uncertainty remains until the check is run).
- **Rollout / rollback:**
  - Rollout: Pre-check CVE remediation before hard-fail step ensures CI is immediately green after merge.
  - Rollback: Remove security-audit and secret-scanning jobs from both workflows; remove `needs:` references from build/deploy jobs.
- **Documentation impact:**
  - None required; workflow comments are self-documenting.
- **Notes / references:**
  - `ci.yml` security-audit and secret-scanning job patterns are the reference; reuse the same TruffleHog action version.
  - Known CVE ignore list from `ci.yml`: `GHSA-p6mc-m468-83gw` — check if applicable to brikette.
  - `caryina.yml` supports `workflow_dispatch` (line 33) — this is the gap that makes TruffleHog in `reusable-app.yml` necessary.

---

## Risks & Mitigations
- **CVE remediation dependency (TASK-05):** Pre-existing high/critical CVEs will block CI until fixed. Mitigation: TASK-05 includes a mandatory pre-check; CVEs must be remediated in the same commit sequence before the hard-fail step lands.
- **cmd-advance.md insert position (TASK-04):** Module Loading Order exact insert position and Gate and Dispatch Map format must match existing patterns. Mitigation: Read `cmd-advance.md` and an existing gate module as reference before writing; confirmed in planning validation.
- **QA report path mismatch (TASK-04):** `s9b-gates.md` must read from the same path that `lp-launch-qa` writes to. Mitigation: Confirm path from `lp-launch-qa/SKILL.md` output section before writing `s9b-gates.md`.
- **stage-operator-map.json parity (TASK-03):** Generator reads `stage-operator-dictionary.yaml`, not `loop-spec.yaml`. Mitigation: Parity check in TASK-03; conditional regeneration if dictionary also needs updating.
- **GATE-LAUNCH-SEC ID spelling (TASK-03/TASK-04):** Gate ID must be identical in `loop-spec.yaml` and `cmd-advance/s9b-gates.md`. Mitigation: Fix casing in TASK-03 before TASK-04 executes; dependency enforces ordering.

## Observability
- Logging: Security domain check results emitted as `evidence` strings per check in unified QA report.
- Metrics: CI pass/fail rate on security-audit and secret-scanning jobs visible in GitHub Actions.
- Alerts/Dashboards: None: no additional alerting infrastructure; CI failures are visible in GitHub UI.

## Acceptance Criteria (overall)
- [ ] `/lp-launch-qa --domain security --business brikette` executes successfully against brikette staging and returns a valid 8-check security domain result.
- [ ] `/lp-launch-qa --domain all --business brikette` dispatches 7 domains (including security) and includes security in the unified QA report.
- [ ] `/startup-loop advance --business brikette` from S9B is blocked by GATE-LAUNCH-SEC when no recent passing security QA report exists.
- [ ] `/startup-loop advance --business brikette` from S9B advances when a recent (≤30 day) QA report with security `status: pass` is present.
- [ ] `loop-spec.yaml` version is `3.15.0` with `GATE-LAUNCH-SEC` annotation on S9B stage.
- [ ] `startup-loop/SKILL.md` `loop_spec_version` references at lines 66 and 98 both read `3.15.0`.
- [ ] `brikette.yml` CI run passes with security-audit and secret-scanning jobs completing before build/deploy.
- [ ] `reusable-app.yml` CI run for caryina passes with security-audit and secret-scanning jobs completing before build/deploy.
- [ ] No high/critical CVEs block CI after TASK-05 lands (pre-check remediation complete).

## Decision Log
- 2026-03-13: Option D (extend lp-launch-qa, defer self-evolving) selected over Options A, B, C. See `docs/plans/startup-loop-security-audit/analysis.md` Chosen Approach.
- 2026-03-13: TASK-04 four-file scope confirmed: `s9b-gates.md` (new) + `cmd-advance.md` (Module Loading Order + Gate and Dispatch Map) + `startup-loop/SKILL.md` (modules table + spec_version at lines 66 and 98). Analysis critique rounds 2-3 established this.
- 2026-03-13: Self-evolving TASK-06 deferred to gap-fill dispatch after prescription registry schema is confirmed. Shadow mode means no live impact.
- 2026-03-13: TruffleHog added to both `brikette.yml` AND `reusable-app.yml`. Analysis critique round 2 confirmed `ci.yml` excludes brikette paths AND `caryina.yml` supports `workflow_dispatch` that bypasses `ci.yml`.
- 2026-03-13: QA report age threshold set to 30 days (consistent with GATE-SELL-ACT-01 precedent). [Adjacent: delivery-rehearsal] — if operator wants a different threshold, update `s9b-gates.md` directly after build.
- 2026-03-13: `stage-operator-map.json` regeneration is a conditional parity check only (generator reads `stage-operator-dictionary.yaml`, not `loop-spec.yaml`). Analysis critique round 2 corrected original claim that regeneration was mandatory.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create domain-security.md | Yes — `.claude/skills/lp-launch-qa/modules/` directory exists; 6 reference modules confirmed; output schema confirmed | None | No |
| TASK-02: Update lp-launch-qa/SKILL.md | Partial — depends on TASK-01 check IDs (SEC-01–SEC-08) being written first | None — dependency explicit in task ordering; Wave 2 placement ensures TASK-01 precedes | No |
| TASK-03: Add GATE-LAUNCH-SEC to loop-spec.yaml | Yes — S9B stage at line 1207 confirmed; version at 3.14.0 confirmed; ordering constraints at lines 1291-1292 confirmed | Advisory: stage-operator-map.json parity check needed — regeneration only if stage-operator-dictionary.yaml also bumped | No — parity check in-task |
| TASK-04: Create s9b-gates.md + 2 edits to cmd-advance.md + sync startup-loop/SKILL.md | Partial — depends on TASK-03 GATE-LAUNCH-SEC ID definition | None — dependency explicit; 3-file / 4-edit scope confirmed; cmd-advance.md Module Loading Order insert position (rule 6, between sell-gates and gap-fill-gates) confirmed | No |
| TASK-05: Add pnpm audit + TruffleHog to brikette.yml and reusable-app.yml | Yes — ci.yml patterns confirmed; reusable-app.yml app-filter input confirmed | Advisory: pre-existing high/critical CVEs will block CI until remediated — must run pre-check before adding hard-fail step | No — CVE pre-check is first step of TASK-05 |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Per-task confidence = weighted average(Implementation%, Approach%, Impact%) with equal weights; overall confidence = sum(task confidence × effort weight) / sum(effort weights)
- TASK-01: 89% × 1 (S) = 89
- TASK-02: 88% × 1 (S) = 88
- TASK-03: 87% × 1 (S) = 87
- TASK-04: 84% × 2 (M) = 168
- TASK-05: 84% × 2 (M) = 168
- Sum: 600 / 7 = **85.7% → 86%**

## Section Omission Rule
All sections present. No sections omitted.
