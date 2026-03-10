---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: qa-skill-playwright-enhancements
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/qa-skill-playwright-enhancements/plan.md
Trigger-Why: OpenAI's playwright-interactive skill contains six QA methodology patterns absent from our tools-web-breakpoint and meta-user-test skills. Adopting them raises the rigor and signoff reliability of every browser QA run.
Trigger-Intended-Outcome: type: operational | statement: All six patterns are integrated into the relevant skill SKILL.md and report template files so that future QA runs automatically apply structured inventory, per-region viewport checks, functional/visual separation, proper mobile context, negative confirmation, and exploratory passes. | source: operator
---

# QA Skill Playwright Enhancements Fact-Find Brief

## Scope

### Summary

Six QA methodology patterns from OpenAI's playwright-interactive skill are missing from this repo's two primary browser QA skills (`tools-web-breakpoint` and `meta-user-test`). This fact-find inventories the exact gaps, maps each pattern to the correct target files, and surfaces one pre-existing inconsistency in `meta-user-test/SKILL.md` that must be fixed as part of the same edit pass.

### Goals

- Add pre-test QA inventory (3-source checklist + 2+ exploratory scenarios) to both skills.
- Add per-region `getBoundingClientRect` viewport fit checks to `tools-web-breakpoint`.
- Add explicit functional vs visual QA pass separation to `tools-web-breakpoint`.
- Add `isMobile: true, hasTouch: true` mobile context instruction to `tools-web-breakpoint`.
- Add negative confirmation requirement to both SKILL.md files (agent-layer summary for `meta-user-test`; report template section for `tools-web-breakpoint`).
- Add exploratory pass requirement to both skills.

### Non-goals

- Modifying `run-user-testing-audit.mjs` beyond correcting the script name reference in `meta-user-test/SKILL.md`.
- Changing how audits are invoked, their CLI flags, or their output paths.
- Adding new skill files or creating new skills.
- Changes to Playwright configuration, CI, or test infrastructure.
- Modifying `meta-user-test/references/report-template.md` — that file is not referenced by the skill or the audit script; it is a reference-only artifact and template edits there do not affect generated reports.

### Constraints & Assumptions

- Constraints:
  - `tools-web-breakpoint` uses `mcp__brikette__browser_*` MCP tools or direct Playwright node scripts. The SKILL.md instruction is mechanism-agnostic; executor resolves context option support at build time.
  - `meta-user-test/run-user-testing-audit.mjs` already uses `devices["iPhone 13"]` which includes `isMobile: true` and `hasTouch: true` — no script change needed.
  - Changes are limited to 3 files: `tools-web-breakpoint/SKILL.md`, `tools-web-breakpoint/modules/report-template.md`, `meta-user-test/SKILL.md`. The `meta-user-test/references/report-template.md` is excluded — it is not wired to the script or the skill workflow.
  - For `meta-user-test`, negative confirmation and exploratory pass notes are agent-generated additions to the Step 8 summary (SKILL.md), not script-generated report sections.
- Assumptions:
  - Skill prose changes take effect immediately on next invocation — no build, compile, or deploy step.
  - The 6 patterns are additive to existing workflows, not replacements.

## Outcome Contract

- **Why:** OpenAI's playwright-interactive skill contains structured QA methodology that our skills lack. Adopting it raises signoff quality and makes QA findings more reliable and consistent across runs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All six playwright-interactive patterns are integrated into tools-web-breakpoint and meta-user-test skill files so that future QA runs automatically apply structured pre-test inventory, per-region viewport fit checks, functional/visual pass separation, proper mobile context flags, negative confirmation at signoff, and a mandatory exploratory pass.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/tools-web-breakpoint/SKILL.md` — breakpoint sweep orchestrator; all workflow steps, detection heuristics, and completion message live here
- `.claude/skills/tools-web-breakpoint/modules/report-template.md` — report structure template; defines required sections for every breakpoint sweep run
- `.claude/skills/meta-user-test/SKILL.md` — two-layer user test audit orchestrator; defines layers A/B, workflow steps, and completion summary contract. **Pre-existing inconsistency**: Step 3 references `run-meta-user-test.mjs` but the actual script is `run-user-testing-audit.mjs` — fix during the same edit pass.

### Key Modules / Files

- `.claude/skills/meta-user-test/scripts/run-user-testing-audit.mjs` (79KB) — automated audit script; line 2069: `browser.newContext({ ...devices["iPhone 13"] })` — mobile context already correct
- `.claude/skills/meta-user-test/scripts/run-user-testing-audit.mjs:1995` — desktop context: `{ viewport: { width: 1440, height: 900 } }` — no `isMobile`/`hasTouch` (desktop only, correct)
- `.claude/skills/meta-user-test/scripts/run-user-testing-audit.mjs:1247,1281` — `getBoundingClientRect` calls exist for individual elements in the automated audit; not systematic per required region
- `.claude/skills/meta-user-test/scripts/run-user-testing-audit.mjs:1365` — `scrollWidth > clientWidth` check exists (page-level only)

### Patterns & Conventions Observed

- `tools-web-breakpoint` §4 uses `documentElement.scrollWidth > documentElement.clientWidth + 2` for page-level overflow and `rect.right > viewportWidth + 4` for element-level checks — but element checks are not systematic per named critical region before signoff.
- `tools-web-breakpoint` §2 conflates navigation, interaction, screenshot capture, and overflow checks into a single "Execute Breakpoint Matrix" step — no named functional vs visual pass separation.
- `tools-web-breakpoint` §1 has "Route list" construction but no 3-source inventory requirement (user requirements + features implemented + claims to sign off).
- `tools-web-breakpoint` mobile breakpoints (≤480px) are set via viewport width only — no `isMobile: true` or `hasTouch: true` instruction.
- `tools-web-breakpoint` §7 completion message says "No responsive layout failures detected" if clean — no requirement to name which defect classes were checked.
- `meta-user-test` Step 5 "Validate critical findings manually" does targeted repro but no free-form exploratory pass requirement.
- `meta-user-test` §8 "Return concise summary" has no negative confirmation field. Negative confirmation for `meta-user-test` must be an agent-generated summary item in Step 8, not a template section (the references/report-template.md is not consumed by the script or skill).
- `meta-user-test` SKILL.md Step 3 references `run-meta-user-test.mjs` which does not exist — actual script is `run-user-testing-audit.mjs`. Pre-existing inconsistency confirmed by inspecting the `scripts/` directory.

### Data & Contracts

- Types/schemas/events: Skill files are markdown prose with no type system. Changes are purely additive sections/steps.
- Persistence: Report artifacts (markdown + JSON) written to `docs/audits/`. New sections in templates are additive.
- API/contracts: No external API contracts affected.

### Dependency & Impact Map

- Upstream dependencies:
  - `tools-web-breakpoint` is invoked by `lp-design-qa`, `lp-do-build` (pre-launch QA), and `lp-launch-qa`.
  - `meta-user-test` is self-invoked by operator or triggered post-deploy.
- Downstream dependents:
  - Both skills feed findings into `lp-do-build` as structured issue backlogs.
  - Report templates are consumed by operators and downstream fix tasks.
- Likely blast radius:
  - Zero code blast radius. All changes are skill instruction markdown.
  - Behavioral blast radius: every future breakpoint sweep and user test run will require QA inventory + exploratory pass + negative confirmation — adds ~5–10 min to each run but raises signoff quality.

### Test Landscape

#### Test Infrastructure

- Frameworks: none for skill files (markdown prose)
- Commands: none
- CI integration: none (skills are agent instructions, not code)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Skill prose | None | N/A | Skills are agent instructions; correctness is verified by running them |
| `run-user-testing-audit.mjs` | None (CI only per testing-policy.md) | N/A | Script tests run in CI |

#### Coverage Gaps

- No automated tests for skill prose correctness — this is expected and unchanged.

#### Testability Assessment

- Easy to test: invoke each skill after changes and verify the new steps appear in the run output.
- Hard to test: automated assertion that the agent followed every new step.
- Test seams needed: none.

### Recent Git History (Targeted)

- No recent git history for either skill file (no tracked commits found in current session). Skills are authored once and evolve by direct edit.

## Questions

### Resolved

- Q: Does `meta-user-test` already handle `isMobile`/`hasTouch` for mobile contexts?
  - A: Yes. Line 2069 of `run-user-testing-audit.mjs`: `browser.newContext({ ...devices["iPhone 13"] })` — Playwright's `devices["iPhone 13"]` preset includes `isMobile: true`, `hasTouch: true`, and a mobile user agent. No change needed to the script.
  - Evidence: `.claude/skills/meta-user-test/scripts/run-user-testing-audit.mjs:2069`

- Q: Does `tools-web-breakpoint` need `isMobile`/`hasTouch` instructions?
  - A: Yes. The skill sets `viewport: W x 900` but provides no instruction to set mobile context flags when testing sub-480px breakpoints. Real touch event simulation and mobile UA behavior are absent without these flags.
  - Evidence: `.claude/skills/tools-web-breakpoint/SKILL.md:96` ("Set viewport to W x 900")

- Q: Are there existing per-region `getBoundingClientRect` checks in `tools-web-breakpoint`?
  - A: Partial. The skill checks `rect.right > viewportWidth + 4` for individual elements but does not require a systematic check of named critical regions (nav, primary CTA, modal close, form submit) before signoff. The check is reactive (flag if found) not systematic (verify each required region).
  - Evidence: `.claude/skills/tools-web-breakpoint/SKILL.md:136-139`

- Q: Does changing the SKILL.md require any build, deploy, or compile step?
  - A: No. Skill files are markdown prose read by agents at invocation time. Changes take effect immediately.

- Q: Should `run-user-testing-audit.mjs` be modified to add QA inventory or negative confirmation to its automated output?
  - A: No. The QA inventory and exploratory pass are agent-driven pre-/post-test steps, not automatable in the script. Negative confirmation in the script output would require modifying the 79KB script for marginal gain. The SKILL.md Step 8 instruction covers this at the agent layer.

- Q: Is `meta-user-test/references/report-template.md` consumed anywhere?
  - A: No. Confirmed by reading the SKILL.md and the script. The template is a reference artifact only — not `import`ed or `require`d by `run-user-testing-audit.mjs`, and not referenced in SKILL.md workflow steps. Edits to it would have no effect on generated reports. Excluded from scope.
  - Evidence: `meta-user-test/SKILL.md` workflow steps reference `run-user-testing-audit.mjs` directly; no template file is referenced. `run-user-testing-audit.mjs` generates report markdown inline (lines 1889–2146).

- Q: Is `meta-user-test/SKILL.md` Step 3 referencing the correct script name?
  - A: No. SKILL.md line 94 says `run-meta-user-test.mjs` but the actual script is `run-user-testing-audit.mjs`. Fix this during the SKILL.md edit pass.
  - Evidence: `.claude/skills/meta-user-test/scripts/` directory listing.

### Open (Operator Input Required)

None. All questions resolved from evidence.

## Confidence Inputs

- Implementation: 95% — 3 files, no code, no APIs, pure markdown additions plus one script-name typo fix. Evidence: all target files read and gaps confirmed.
- Approach: 90% — patterns are well-understood from the source material; mapping to target files is clear. What raises to >=90: confirmed (already there).
- Impact: 80% — improves every future QA run; risk that agents skip new steps is inherent in prose-based instruction but mitigated by explicit checklist format. What raises to >=90: adding checklist items to completion message validation.
- Delivery-Readiness: 95% — all evidence gathered; file locations, sections, and content are known. What raises to >=90: confirmed (already there).
- Testability: 70% — skill prose is not unit-testable; verification requires running the skill and checking output. What raises to >=80: adding a self-check item to each skill's completion message that lists the new required steps.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Agent executing the skill skips the new QA inventory step | Low | Medium — QA run is less rigorous | Frame inventory as a gate: "Do not start sweep until inventory is written." |
| Per-region getBoundingClientRect check adds time to each breakpoint run | Medium | Low — slightly longer runs | Document as required only for critical regions (nav, CTA, modal, form), not every element. |
| `isMobile`/`hasTouch` instruction can't be applied via MCP browser tool | Low | Low — can fall back to node Playwright script | SKILL.md instruction is mechanism-agnostic; executor resolves at build time. |
| Exploratory pass adds ambiguity to scope (how long is "30-90s"?) | Low | Low | Keep the range as written; it's intentionally guidance not a hard rule. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Additions are additive only — no existing skill sections removed or reordered.
  - Formatting must match existing skill file conventions (headers, bullet lists, code blocks).
  - QA inventory step must be gated: sweep cannot start until inventory is written.
  - Functional/visual separation must be explicit named phases in `tools-web-breakpoint` workflow.
- Rollout/rollback expectations:
  - No rollout mechanism needed; skill files take effect immediately on next invocation.
  - Rollback: revert the 3 file edits via git.
- Observability expectations:
  - `tools-web-breakpoint`: negative confirmation section in the generated report provides immediate visibility.
  - `meta-user-test`: negative confirmation appears in the agent-generated Step 8 chat summary, not in the script-generated markdown report (the script is not modified).

## Suggested Task Seeds (Non-binding)

1. **SKILL update: tools-web-breakpoint** — Add QA inventory step (pre-sweep gate), split workflow into named functional/visual passes, add per-region getBoundingClientRect check for critical regions (nav, primary CTA, modal close, form submit), add `isMobile`/`hasTouch` instruction for breakpoints ≤480px, add exploratory pass step, update completion message with negative confirmation requirement.
2. **Report template update: tools-web-breakpoint** — Add `## QA Inventory` section, `## Functional QA Pass` and `## Visual QA Pass` sections, `## Negative Confirmation` section to `tools-web-breakpoint/modules/report-template.md`.
3. **SKILL update: meta-user-test** — Fix script name typo (`run-meta-user-test.mjs` → `run-user-testing-audit.mjs`). Add pre-test QA inventory step before Layer A. Add exploratory pass sub-step inside Step 5 manual validation. Add negative confirmation requirement to Step 8 summary (agent-generated, not script-generated).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - 3 files updated: `tools-web-breakpoint/SKILL.md`, `tools-web-breakpoint/modules/report-template.md`, `meta-user-test/SKILL.md`
  - `meta-user-test/references/report-template.md` NOT modified (not wired to skill or script)
  - Script name typo fixed: `run-meta-user-test.mjs` → `run-user-testing-audit.mjs` in `meta-user-test/SKILL.md`
  - Each of the 6 patterns is present in the appropriate file(s)
  - No existing skill sections removed or reordered
  - Changes are additive and formatting-consistent with existing file conventions
- Post-delivery measurement plan:
  - Next invocation of `tools-web-breakpoint` produces a QA inventory before sweep begins
  - Next invocation of `meta-user-test` includes negative confirmation in the summary

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| tools-web-breakpoint SKILL.md current state (all 7 sections) | Yes | None | No |
| tools-web-breakpoint report-template.md current state | Yes | None | No |
| meta-user-test SKILL.md current state (8 steps) | Yes | None | No |
| meta-user-test report-template current state | Yes | [Scope gap] Minor: references/report-template.md not wired to script or SKILL.md — excluded from scope | No |
| meta-user-test script mobile context (isMobile/hasTouch) | Yes | None — already correct via devices["iPhone 13"] | No |
| meta-user-test script getBoundingClientRect usage | Yes | Partial — exists for individual elements, not systematic per region (acceptable; systematic check goes into SKILL.md, not script) | No |
| Gap 1: QA inventory — absent from both SKILL.md files | Yes | None structural | No |
| Gap 2: per-region getBoundingClientRect — absent from tools-web-breakpoint | Yes | None structural | No |
| Gap 3: functional/visual separation — absent from tools-web-breakpoint | Yes | None structural | No |
| Gap 4: isMobile/hasTouch instruction — absent from tools-web-breakpoint | Yes | None structural | No |
| Gap 5: negative confirmation — absent from both SKILL.md files; tools-web-breakpoint report template | Yes | None structural — meta-user-test negative confirmation routes to SKILL.md Step 8 (agent summary), not template | No |
| Gap 6: exploratory pass — absent from both skills | Yes | None structural | No |
| Blast radius check: no code/API/CI changes required | Yes | None | No |

## Scope Signal

- Signal: right-sized
- Rationale: Three files, all markdown, all additive plus one script-name fix. All 6 patterns are fully understood from the source material. No infrastructure, script, or API changes required. `references/report-template.md` correctly excluded after confirming it is not wired. Evidence floor is clear and complete.

## Evidence Gap Review

### Gaps Addressed

- Confirmed 3 target files exist and are fully read. `meta-user-test/references/report-template.md` removed from scope after codemoot Round 1 confirmed it is not wired to the script or skill.
- Confirmed `run-user-testing-audit.mjs` mobile context is already correct — scope narrowed to SKILL.md only for pattern 4.
- Confirmed per-region getBoundingClientRect is a SKILL.md instruction gap, not a script gap — no script changes needed.
- Confirmed no build/deploy steps required for skill file changes.

### Confidence Adjustments

- Implementation raised from estimated 85% to 95% after confirming 3 target files, excluding unwired template, and adding the script-name fix to scope.
- Added pre-existing inconsistency (script name typo in meta-user-test SKILL.md) to scope — does not increase risk, reduces drift.
- Testability held at 70% — inherent to prose-based skills; noted in planning constraints.

### Remaining Assumptions

- `mcp__brikette__browser_session_open` or equivalent can support `isMobile`/`hasTouch` context options, or the executor can fall back to a direct Playwright node script for mobile breakpoints. This is resolved at build time, not planning time.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan qa-skill-playwright-enhancements --auto`
