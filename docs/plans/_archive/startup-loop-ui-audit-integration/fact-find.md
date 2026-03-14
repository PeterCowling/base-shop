---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: BOS
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: startup-loop-ui-audit-integration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep
Related-Analysis: docs/plans/startup-loop-ui-audit-integration/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313192500-BRIK-BOS-007
Trigger-Why: The startup loop has no step that requires checking how every screen in the app actually looks when rendered — both in light and dark mode. Issues like invisible text in dark mode, clashing colours, and text that is too small are only caught by doing this audit manually. Adding a screen-by-screen rendered audit to the loop means these problems get found automatically for every product, every time, before launch.
Trigger-Intended-Outcome: type: operational | statement: The startup loop includes a required rendered UI screen audit at S9B that covers every screen in both light and dark mode, with findings saved as an artifact and blocking issues preventing advance. | source: operator
---

# Startup Loop UI Audit Integration — Fact-Find Brief

## Scope

### Summary

The startup loop's S9B stage currently runs `/lp-launch-qa` (with `/lp-design-qa` as secondary). Neither skill performs a rendered, screen-by-screen visual audit in light and dark mode. `tools-ui-contrast-sweep` — the skill that does exactly this — is documented as sitting at "S9C (Parallel Sweep)" but S9C does not exist in `loop-spec.yaml`. There is no gate enforcing that a contrast-and-uniformity sweep has been run before S9B→SIGNALS advance. This change adds the rendered UI audit requirement to the S9B gate, including a hard gate enforcing that a sweep artifact exists and is unblocked (no unresolved S1 blockers) before the loop can advance to SIGNALS.

### Goals

- Add `/tools-ui-contrast-sweep` as a required step in S9B, covering all routes in both light and dark mode.
- Add a hard gate `GATE-UI-SWEEP-01` to `s9b-gates.md` that blocks S9B→SIGNALS advance when no recent sweep artifact exists or when the artifact contains unresolved S1 blockers.
- Record this gate in `loop-spec.yaml` with a spec version bump.
- Update the S9B stage entry in `loop-spec.yaml` to list `tools-ui-contrast-sweep` as a secondary skill alongside `/lp-design-qa`.
- Update the startup-loop `SKILL.md` stage map table to reflect the new secondary skill and gate.

### Non-goals

- Redesigning the `/tools-ui-contrast-sweep` workflow — only the artifact schema and the SKILL.md loop-position label require changes as a direct consequence of this gate design.
- Changing the `lp-launch-qa` or `lp-design-qa` skills.
- Adding a new loop stage (S9C as a formal stage ID) — we integrate into the existing S9B stage.
- Automating the sweep execution (it remains a skill invocation step; the gate only checks the artifact).

Note: adding a `Business: <BIZ>` frontmatter field to sweep reports is required by the gate design and is therefore in scope. This touches `tools-ui-contrast-sweep/modules/report-template.md` (one-line addition to the template header). This is a minimal, direct prerequisite of the gate — not a redesign of the skill.

### Constraints & Assumptions

- Constraints:
  - `loop-spec.yaml` is the runtime-authoritative source. All downstream docs (SKILL.md, workflow guide) must align after a spec version bump (VC-02).
  - Gate enforcement must remain filesystem-only at advance time (consistent with existing `GATE-LAUNCH-SEC` pattern).
  - The sweep artifact naming convention is already defined: `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`.
  - Business scoping of sweep artifacts is required — not optional. The live `docs/audits/contrast-sweeps/` directory already contains unrelated slugs from different products (`xa-uploader`, `reception-login`, `startup-loop-files`). A business-agnostic glob would silently allow one product's sweep to satisfy another product's gate.
- Assumptions:
  - The gate checks for the most recent sweep artifact within a 30-day window (consistent with `GATE-LAUNCH-SEC`).
  - S1 blocker = advance-blocking; S2 and S3 are warning-only at the gate (consistent with the skill's own severity model).
  - Business scoping is via a `Business: <BIZ>` frontmatter field added to the sweep report template (Option C). Artifacts lacking this field are treated as hard-block (not warn), because there is no safe way to infer which business a slug-named artifact belongs to. New sweeps will carry the field; legacy artifacts (pre-gate) will require re-running the sweep before S9B advance.

## Outcome Contract

- **Why:** The startup loop has no step that requires checking how every screen in the app actually looks when rendered — both in light and dark mode. Issues like invisible text in dark mode, clashing colours, and text that is too small are only caught by doing this audit manually. Adding a screen-by-screen rendered audit to the loop means these problems get found automatically for every product, every time, before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The startup loop includes a required rendered UI screen audit at S9B that covers every screen in both light and dark mode, with findings saved as an artifact and blocking issues preventing advance.
- **Source:** operator

## Current Process Map

- **Trigger:** `startup-loop advance --business <BIZ>` when current stage is S9B (DO complete, S9B→SIGNALS transition pending).
- **End condition:** SIGNALS stage becomes active; loop operator begins weekly readout.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| S9B execution | Operator runs `/lp-launch-qa --business <BIZ>` (optionally with `--domain`), then `/lp-design-qa <feature-slug>`. Results are recorded in `launch-qa-report-YYYY-MM-DD.md`. | Operator / lp-launch-qa / lp-design-qa | `loop-spec.yaml` lines 1214–1228 | `/lp-design-qa` is listed as secondary but no gate enforces it ran. No rendered visual audit is required. Dark mode screen issues are invisible to both skills. |
| S9B→SIGNALS advance gate | `GATE-LAUNCH-SEC` (Hard): checks for a launch QA report ≤30 days old with security domain passing. No other gates at this transition. | startup-loop skill / s9b-gates.md | `s9b-gates.md` full content | Only one gate. Visual/UI quality has zero gated enforcement. |
| Contrast/uniformity audit | `/tools-ui-contrast-sweep` exists as a standalone tool. Its own SKILL.md declares "Loop position: S9C (Parallel Sweep)" but S9C is not a stage in `loop-spec.yaml`. It is never invoked by the loop automatically and no gate checks for its artifact. | Operator (ad-hoc only) | `tools-ui-contrast-sweep/SKILL.md` line 237 | "S9C" is a stale self-declaration — the loop has no S9C stage. The skill's artifacts are stored in `docs/audits/contrast-sweeps/` but nothing reads them as a gate input. |
| Evidence from recent audit | A full screen audit was run for BRIK reception (2026-03-12) finding 2 S1 blockers, 7 S2 major issues, 5 S3 minor issues — all from a token-level analysis (auth-blocked from live rendering). | Agent / docs/audits/contrast-sweeps/ | `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/` | Demonstrates real issue class: invisible near-black text on dark shade swatches (~1.5:1 ratio against WCAG 4.5:1 threshold). This would have been missed by both lp-launch-qa and lp-design-qa. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

Not applicable — this is a direct operator dispatch, not a self-evolving discovery gap.

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md` — gate enforcement module loaded during `startup-loop advance` when current transition is S9B→SIGNALS. This is the canonical location for the new gate.
- `.claude/skills/startup-loop/modules/cmd-advance.md` — dispatch table that routes to `s9b-gates.md` (step 6 in the advance module). Will need a line item added for the new gate summary.
- `docs/business-os/startup-loop/specifications/loop-spec.yaml` — runtime-authoritative spec. S9B stage definition at line 1214. Requires: secondary skill addition + version comment + spec_version bump.
- `.claude/skills/startup-loop/SKILL.md` — stage map table at line 174. Requires update.

### Key Modules / Files

- `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md` — currently 55 lines, single gate (`GATE-LAUNCH-SEC`). New gate (`GATE-UI-SWEEP-01`) appended here. Pattern: filesystem-only check, glob for artifact, date parse, content check, hard block.
- `.claude/skills/tools-ui-contrast-sweep/SKILL.md` — defines artifact output paths (`docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`), severity model (S1/S2/S3), and frontmatter schema (`S1-Blockers: N`). The gate must parse this frontmatter field.
- `docs/business-os/startup-loop/specifications/loop-spec.yaml` — 75.9 KB, spec_version 3.15.0. S9B stage: `skill: /lp-launch-qa`, `secondary_skills: [/lp-design-qa]`. Gate comment block exists for GATE-LAUNCH-SEC pattern.
- `.claude/skills/startup-loop/SKILL.md` — stage map table row: `| S9B | QA gates | \`/lp-launch-qa\`, \`/lp-design-qa\` | — |`. Needs `tools-ui-contrast-sweep` added.
- `.claude/skills/startup-loop/modules/cmd-advance.md` — step 6 already routes to `s9b-gates.md` and lists GATE-LAUNCH-SEC in the summary. Add GATE-UI-SWEEP-01.
- `docs/audits/contrast-sweeps/` — artifact location for sweep reports. Existing structure: `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md` with YAML frontmatter including `S1-Blockers: N`.
- `.claude/skills/tools-ui-contrast-sweep/modules/report-template.md` — report output template. Must add `Business: <BIZ>` to the frontmatter header block so future sweeps produce gate-compatible artifacts. Existing reports without this field will fail the gate until re-run.

### Patterns & Conventions Observed

- **Gate pattern (GATE-LAUNCH-SEC):** Glob for artifact → parse date from filename → check staleness (>30 days) → read artifact for domain status → hard block on fail. Filesystem-only. `evidence: .claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`
- **Sweep artifact frontmatter:** YAML front-matter includes `S1-Blockers: N` (integer), `S2-Major: N`, `Issues-Total: N`. Artifact path: `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`. `evidence: docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md`
- **Spec version bump pattern:** v3.15.0 added GATE-LAUNCH-SEC with a comment block above the change. Same pattern expected for v3.16.0.
- **Secondary skill listing:** `secondary_skills: [/lp-design-qa]` in YAML. `/tools-ui-contrast-sweep` uses `tools-` prefix (tool, not workflow skill) — confirm prefix format in SKILL registry.

### Data & Contracts

- Types/schemas/events:
  - Sweep artifact frontmatter schema (current): `S1-Blockers: <int>`, `S2-Major: <int>`, `S3-Minor: <int>`, `Issues-Total: <int>`, `Audit-Date: YYYY-MM-DD`, `Routes-Tested: <int|(int + description)>`, `Status: Complete|In-progress`. Evidence: `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md`.
  - New frontmatter field (Option C — confirmed approach): `Business: <BIZ>` (e.g. `Business: BRIK`). Gate filters on this field for scoping. **Missing field = hard-block** (not warn) because there is no safe way to attribute an unscoped report to the correct business without the field. Legacy artifacts without the field must be re-run before S9B advance.
  - Gate reads: `Status` (must be `Complete`; `In-progress` → block), `Routes-Tested` (must be > 0; 0 → block as degraded/non-rendered), `S1-Blockers` (must be 0; > 0 → block), `Business` (must match `<BIZ>` arg; missing → warn).
  - Gate pass packet addition: `ui_sweep_gate: GATE-UI-SWEEP-01`, `ui_sweep_gate_status: pass|warn`, `ui_sweep_report: docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`
  - Gate block packet: same structure as GATE-LAUNCH-SEC block packet.
- Persistence:
  - Sweep artifacts in `docs/audits/contrast-sweeps/` — already written by tools-ui-contrast-sweep. No new persistence required; gate only reads them.
- API/contracts:
  - None. Gate is filesystem-only (consistent with existing pattern).

### Dependency & Impact Map

- Upstream dependencies:
  - `tools-ui-contrast-sweep` must have been run and produced an artifact before S9B→SIGNALS advance. This is a new precondition on the operator workflow.
  - The `--business <BIZ>` flag must resolve to a slug usable for artifact globbing (e.g., `BRIK` → `brik` lowercase, or a more liberal glob pattern).
- Downstream dependents:
  - `startup-loop advance` command when transitioning S9B→SIGNALS.
  - Loop documentation (`docs/agents/feature-workflow-guide.md` — may need a note).
  - `docs/business-os/startup-loop/_generated/stage-operator-map.json` — if secondary skills are reflected here (check whether regeneration is needed).
- Likely blast radius:
  - Small: 4–5 files changed. No app code. No database. No API. Pure orchestration/documentation layer.
  - Risk of operator friction: if operators haven't run the sweep before attempting advance, the new hard gate will block them. This is intentional by design.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit), shell-based validator scripts.
- Commands: `pnpm --filter scripts test`, `scripts/validate-fact-find.sh`, `scripts/validate-engineering-coverage.sh`
- CI integration: `ci.yml` → `scripts/` package tests run in CI.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| startup-loop gates (s6b) | Unit | `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` | Tests exist for s6b gate logic — pattern is applicable |
| loop-spec validation | Unit | `scripts/check-startup-loop-contracts.sh` | Validates loop-spec contracts |
| s9b gates | None | n/a | No tests for GATE-LAUNCH-SEC exist; new gate will also lack tests unless added |

#### Coverage Gaps

- Untested paths:
  - `s9b-gates.md` gate logic has no automated tests (GATE-LAUNCH-SEC, and the new GATE-UI-SWEEP-01).
  - Artifact glob + date parse + frontmatter read logic for the new gate — no existing test harness.
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test: Gate logic (fixture sweep artifact files, assert gate pass/block decisions) — follows the s6b test pattern.
- Hard to test: Full end-to-end loop advance (requires startup-loop runner context).
- Test seams needed: None new — file system fixture pattern already established in s6b tests.

#### Recommended Test Approach

- Unit tests for: GATE-UI-SWEEP-01 gate logic (glob matching, date parsing, S1-Blockers check) using fixture artifacts.
- Integration tests for: Not required at this scope.
- E2E tests for: Not required.
- Contract tests for: Sweep artifact frontmatter schema (snapshot test on existing artifact files).

### Recent Git History (Targeted)

- `docs/business-os/startup-loop/specifications/loop-spec.yaml` — most recent change in active diff: v3.15.0 (GATE-LAUNCH-SEC addition). Establishes the exact pattern this change should follow.
- `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md` — file exists as of v3.15.0 (created with GATE-LAUNCH-SEC). New gate appended following same structure.
- `.claude/skills/tools-ui-contrast-sweep/SKILL.md` — referenced in current git diff (M in status). Current content declares "Loop position: S9C" — this fact-find surfaces the misalignment.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | This change is to orchestration/config files, not to any rendered UI | No visual change; the gate enforces visual quality is checked externally | No |
| UX / states | Required | Operator flow: advance command now blocks if sweep not run or has S1 blockers. Operator must know to run tools-ui-contrast-sweep first. | Operator may be surprised by new block; documentation/next_action message must be clear | Yes — plan must define the exact block message and next_action string |
| Security / privacy | N/A | No auth, no untrusted input, no data exposure. Gate reads local files only. | None | No |
| Logging / observability / audit | Required | Advance command already returns structured packet with gate status. New gate adds fields to this packet. | Gate pass/fail is visible to operator via the advance packet. No separate logging needed. | No — same packet pattern as GATE-LAUNCH-SEC |
| Testing / validation | Required | s6b gate tests establish the pattern. No tests exist for s9b gates. | New gate logic should have unit tests to prevent regression. | Yes — plan must include test task |
| Data / contracts | Required | Sweep artifact frontmatter schema (S1-Blockers field). Gate pass/block packet schema. | Frontmatter schema is currently undocumented as a contract. Gate is a new consumer. | Yes — plan must document the frontmatter contract |
| Performance / reliability | N/A | Gate is filesystem glob + file read — trivially fast. No hot path risk. | None | No |
| Rollout / rollback | Required | loop-spec.yaml version bump is irreversible (semantic). Gate is additive (new hard gate). | Existing businesses mid-loop will encounter the new gate at next S9B advance. If no sweep artifact exists, they block. Mitigation: plan must define the grace-period strategy (if any). | Yes — plan must address existing-run impact |

## External Research (If Needed)

Not investigated: no external sources required — all evidence is in-repository.

## Questions

### Resolved

- Q: Does S9C exist as a formal stage ID in loop-spec.yaml?
  - A: No. `loop-spec.yaml` (spec_version 3.15.0) has no S9C stage. `tools-ui-contrast-sweep/SKILL.md` self-declares "Loop position: S9C (Parallel Sweep)" but this is a stale or aspirational label — the loop has no such stage. The integration must go into the existing S9B stage, not a new stage.
  - Evidence: `grep -n "S9C" loop-spec.yaml` returns no results.

- Q: Is `/tools-ui-contrast-sweep` listed as a secondary skill anywhere in the loop-spec?
  - A: No. `loop-spec.yaml` S9B entry lists `secondary_skills: [/lp-design-qa]` only. `tools-ui-contrast-sweep` is absent.
  - Evidence: `loop-spec.yaml` lines 1217–1218.

- Q: What is the sweep artifact path pattern? Is it parseable for a business-scoped gate check?
  - A: Path: `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`. The `<slug>` is operator-assigned and is not automatically derived from `--business`. This creates an open question about scoping (see Open).
  - Evidence: `tools-ui-contrast-sweep/SKILL.md` lines 199–206; existing audits in `docs/audits/contrast-sweeps/`.

- Q: Does lp-design-qa do any rendered screen-by-screen check?
  - A: No. `lp-design-qa` is explicitly "static code analysis — no browser rendering or screenshot capture." Evidence: `lp-design-qa/SKILL.md` key distinction block.

- Q: Does lp-launch-qa cover contrast or dark-mode rendering?
  - A: No. `lp-launch-qa` covers conversion, SEO, performance, legal, brand copy, measurement, security, and data hardening. No contrast or dark-mode rendering domain exists. Evidence: `lp-launch-qa/SKILL.md` domain module list.

- Q: What severity does the reception audit find as S1 blockers?
  - A: 2 S1 blockers (near-black text on dark shade swatches at ~1.5:1 ratio against 4.5:1 WCAG threshold). Demonstrates the real issue class this gate is intended to catch.
  - Evidence: `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md`.

- Q: Should the new gate be Hard or Soft at S9B→SIGNALS?
  - A: Hard — consistent with operator intent ("blocking issues preventing advance") and with the GATE-LAUNCH-SEC model. S1 blockers = unreadable text = cannot launch with acceptable quality.
  - Rationale: S2/S3 findings should be warnings only at gate time (same logic as security `warn` in GATE-LAUNCH-SEC).

- Q: How should the gate scope the artifact to the correct business (not any product's sweep)?
  - A: Use a `Business: <BIZ>` frontmatter field in sweep reports (Option C). The live `docs/audits/contrast-sweeps/` directory contains unrelated slugs across products (`xa-uploader`, `startup-loop-files`, `reception-login`). Business-agnostic glob (Option A) would let one product's sweep satisfy another product's gate. Slug-pattern matching (Option B) is brittle. Option C is unambiguous and the gate hard-blocks on missing field (no backward-compat warn softening).
  - Evidence: `ls docs/audits/contrast-sweeps/` — 23 slugs from multiple distinct products; frontmatter in `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md` (no `Business:` field currently — must be added to template).

- Q: Does the stage-operator-map.json need regeneration when secondary_skills changes?
  - A: Checked `docs/business-os/startup-loop/_generated/stage-operator-map.json` pattern — it reflects stage IDs and labels, not secondary skill lists. No regeneration needed for this change alone.
  - Evidence: `grep -n "secondary_skills\|secondary" docs/business-os/startup-loop/_generated/stage-operator-map.json` returns nothing relevant.

### Open (Operator Input Required)

- Q: Should the new hard gate apply immediately to all businesses, or should there be a 30-day advisory window before it becomes a hard block?
  - Why operator input is required: this is a preference about rollout aggressiveness vs. operator convenience for mid-loop runs. It depends on how many businesses are currently at S9B and how much friction is acceptable.
  - Decision impacted: whether `GATE-UI-SWEEP-01` starts as `severity: Hard` immediately or as `severity: Soft (warn)` for the first 30 days.
  - Decision owner: operator
  - Default assumption: immediate hard gate — consistent with `GATE-LAUNCH-SEC` and with the operator's statement that "blocking issues preventing advance". If operator wants a grace period, plan adds a 30-day warn window with a date-triggered auto-harden.

## Confidence Inputs

- Implementation: 90%
  - Evidence: Exact file paths, gate pattern, artifact schema all confirmed. Business scoping approach resolved: Option C (`Business: <BIZ>` frontmatter field, hard-block when missing). Report template change (`tools-ui-contrast-sweep/modules/report-template.md`) is a one-line addition.
  - Raises to ≥90: Operator confirming the grace-period approach (immediate hard gate vs. 30-day warn window for existing runs).
- Approach: 88%
  - Evidence: Integrating into existing S9B (not a new stage) is confirmed as the right approach. Gate pattern matches established GATE-LAUNCH-SEC. No architectural uncertainty.
  - Raises to ≥90: Confirming no secondary_skills list impacts downstream tooling (confirmed — stage-operator-map.json not affected).
- Impact: 85%
  - Evidence: Reception audit confirmed real S1 blockers that would not have been caught by existing S9B gates. Gate adds meaningful pre-launch protection.
  - Raises to ≥90: First real business (BRIK or other) completing a loop with the gate in place and finding/blocking an issue.
- Delivery-Readiness: 85%
  - Evidence: All source files located. Pattern established. Change is small (4–5 files, ~100 lines total). No app code, no database, no API.
  - Raises to ≥90: Resolving the glob scoping open question and confirming the grace-period approach for existing runs.
- Testability: 75%
  - Evidence: s6b gate tests establish the test pattern. New gate logic is testable with fixture files. However, s9b gates currently have no tests, so the test seam needs to be established.
  - Raises to ≥90: Adding unit tests for GATE-UI-SWEEP-01 gate logic covering: (a) no artifact found, (b) stale artifact, (c) S1 blockers > 0, (d) S1 blockers = 0 (pass), (e) Status: In-progress (should block or warn).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Existing mid-loop businesses hit new hard gate unexpectedly at next S9B advance | Medium | Medium — blocks advance until sweep is run | Add grace-period logic (advisory warn vs hard block) for first 30 days post-deployment, or document clearly in the block message that `/tools-ui-contrast-sweep` needs to be run. |
| Glob scoping too loose — gate passes for any product's sweep, not the product being advanced | Medium | Low — reduces gate value but does not cause harm | Addressed by Open Question. Default Option A is pragmatic; tighten with Option B/C in follow-on. |
| Sweep run in degraded mode (auth-blocked, no rendered screenshots) produces artifact that passes gate | Medium | High — operator's required outcome is a rendered screen-by-screen audit; a token-only report does not satisfy this even if `Status: Complete` | The gate should hard-block when `Routes-Tested: 0` (or equivalent degraded indicator) is present in frontmatter. A `Status: Complete` report with zero rendered routes is a non-rendered audit and explicitly fails the intent. Analysis must carry a fail-closed rule for degraded sweeps. |
| tools-ui-contrast-sweep SKILL.md "S9C" label creates confusion after integration into S9B | Low | Low — cosmetic confusion | Update SKILL.md "Loop position" line from "S9C (Parallel Sweep)" to "S9B secondary" as part of this change. |
| spec_version bump breaks downstream VC-02 alignment check | Low | Low — alignment check is a reminder, not a hard block | Follow v3.15.0 comment block pattern exactly; update all downstream docs that declare a spec_version dependency. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Gate must be filesystem-only (no HTTP calls) — consistent with GATE-LAUNCH-SEC.
  - spec_version bump must include a comment block in loop-spec.yaml changelog section at the top.
  - All files that mention `spec_version` or `loop_spec_version` require alignment (checked: `loop-spec.yaml` line 1337 references `loop_spec_version` in constraints — this is a loop-internal cross-check, not an external file dependency).
  - The `s9b-gates.md` module currently has exactly one gate. The new gate appends as a second `##` section following the same structure.
- Rollout/rollback expectations:
  - Rollback path exists: the gate change is a file edit to `s9b-gates.md` and `loop-spec.yaml`. If the gate causes unexpected friction (e.g., auth-blocked products cannot produce a rendered sweep), the gate can be reverted or softened to advisory (`warn` not `block`) by reverting or editing those files. No data migration or deployment is involved — rollback cost is low.
  - Grace period consideration: existing mid-loop businesses will hit the new hard gate at their next S9B advance attempt. The plan should decide whether to introduce a 30-day `warn`-only window (advisory) before hardening to block, or whether the hard gate applies immediately. Operator should confirm.
  - No feature flag needed: the change is to orchestration documents, not deployed code.
- Observability expectations:
  - Gate pass/block is visible via the advance packet output (structured text). No additional logging needed.

## Suggested Task Seeds (Non-binding)

1. Add `GATE-UI-SWEEP-01` to `s9b-gates.md` — define glob pattern (filter on `Business: <BIZ>` frontmatter field), staleness check (≤30 days), `Routes-Tested > 0` check (degraded-mode block), `S1-Blockers = 0` check, `Status: Complete` check, pass/block packets.
2. Update `tools-ui-contrast-sweep/modules/report-template.md` — add `Business: <BIZ>` to frontmatter template header. This is a prerequisite for task 1.
3. Update `loop-spec.yaml` — bump spec_version to 3.16.0, add comment block for GATE-UI-SWEEP-01, add `tools-ui-contrast-sweep` to S9B `secondary_skills`, add gate comment to S9B stage block.
4. Update `startup-loop/SKILL.md` — stage map table S9B row to include `tools-ui-contrast-sweep`.
5. Update `cmd-advance.md` — step 6 summary to reference GATE-UI-SWEEP-01.
6. Update `tools-ui-contrast-sweep/SKILL.md` — "Loop position" line from "S9C (Parallel Sweep)" to "S9B secondary skill, required before S9B→SIGNALS advance".
7. Add unit tests for `GATE-UI-SWEEP-01` gate logic (fixture-based, following s6b gate test pattern) — cover: no artifact, stale artifact, missing `Business` field, `Routes-Tested: 0`, `S1-Blockers > 0`, clean pass.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none at build time
- Deliverable acceptance package:
  - `s9b-gates.md` contains `GATE-UI-SWEEP-01` with hard-block logic (business-scoped via `Business:` frontmatter, degraded-mode block, S1-Blockers block)
  - `tools-ui-contrast-sweep/modules/report-template.md` includes `Business: <BIZ>` in frontmatter
  - `loop-spec.yaml` spec_version bumped to 3.16.0, S9B secondary_skills updated
  - `startup-loop/SKILL.md` stage map table updated
  - `tools-ui-contrast-sweep/SKILL.md` loop-position updated from "S9C" to "S9B secondary"
  - Unit tests passing for new gate logic (7 cases)
- Post-delivery measurement plan:
  - First loop advance against a business with the new gate confirms correct block/pass behaviour.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `tools-ui-contrast-sweep` self-declares S9C loop position but S9C does not exist — closing the spec misalignment is part of this change.
- Confirmed neither `lp-launch-qa` nor `lp-design-qa` covers rendered contrast or dark mode — no overlap with existing gates.
- Confirmed exact artifact frontmatter schema from existing sweep artifacts.
- Confirmed gate implementation pattern from GATE-LAUNCH-SEC — new gate follows same filesystem-only approach.
- Confirmed blast radius is small (4–5 files, orchestration layer only).

### Confidence Adjustments

- Delivery-Readiness held at 85% (not 90%) because of the open glob-scoping question. Once the operator confirms the approach (Option A recommended), this moves to 92%.
- Testability held at 75% because no test infrastructure currently exists for s9b gates specifically. The pattern is established by s6b tests; the seam needs to be created.

### Remaining Assumptions

- The 30-day staleness window for the sweep artifact (matching GATE-LAUNCH-SEC) is appropriate. No operator input received to the contrary.
- S2/S3 findings at gate time are advisory (warn, not block) — only S1 is hard-blocking.
- `Status: Complete` in the sweep artifact frontmatter is required for the gate to pass (an `In-progress` report should block or warn).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| S9B stage definition in loop-spec.yaml | Yes | None | No |
| Existing GATE-LAUNCH-SEC pattern (gate template) | Yes | None | No |
| tools-ui-contrast-sweep artifact schema (frontmatter fields) | Yes | Minor — `Status: Complete` field assumed required; not explicitly tested across all existing artifacts | No |
| s9b-gates.md structure and append pattern | Yes | None | No |
| Glob scoping approach for artifact discovery | Partial | [Scope gap in investigation] Minor: whether artifact slug follows business-nameable pattern is unresolved | No (open question surfaced) |
| Secondary skills YAML syntax in loop-spec | Yes | None | No |
| Stage-operator-map.json regeneration requirement | Yes | None — secondary skills not reflected in generated map | No |
| Downstream doc alignment (SKILL.md, cmd-advance.md) | Yes | None | No |
| Test landscape and seam availability | Yes | Minor — no existing s9b gate test harness; seam must be created | No |

## Scope Signal

- Signal: right-sized
- Rationale: The change touches exactly 4–5 orchestration/documentation files with no app code, no database, and no API. The implementation pattern is fully established by GATE-LAUNCH-SEC. One open question (glob scoping) has a pragmatic default. The test gap is real but bounded and addressive within the same build.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis startup-loop-ui-audit-integration` — primary question is the glob scoping approach (Option A / B / C); secondary is whether to add a grace period for existing runs.
