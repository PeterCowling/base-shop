---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-13
Feature-Slug: brik-email-template-confidence-threshold
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
Build-Event-Ref: docs/plans/brik-email-template-confidence-threshold/build-event.json
---

# Build Record: Email Template Confidence Threshold

## Outcome Contract

- **Why:** When a guest asks about something the hostel has no template for, the system selects the closest BM25 match and sends it as if it were correct. Staff should only see genuinely tricky cases — not false alarms from a missing threshold gate or spurious reference-link failures on routine FAQ emails.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-question confidence floor and category-compatibility check gate template block acceptance in `draft-generate`; below-threshold single-question emails emit `follow_up_required` with the escalation fallback sentence and no template text. `booking-issues` removed from `STRICT_REFERENCE_CATEGORIES` to eliminate false reference-link quality failures on FAQ drafts.
- **Source:** operator

## What Was Built

**TASK-01 — Category-compatibility gate + confidence floor for single-question path:**
Added `selectSingleQuestionTemplate` helper to `packages/mcp-server/src/tools/draft-generate.ts`. The helper mirrors `selectQuestionTemplateCandidate` semantics used by the composite path: calls `resolveScenarioCategoryHints(actionPlan)` to get scenario category hints, filters `policyCandidates` to hinted candidates first, picks the highest-confidence hinted candidate via `reduce`, and falls back to the first unhinted candidate only when `candidateConfidence` meets or exceeds `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`. When the gate rejects, `selectedTemplate` is `undefined`, the draft body receives the escalation fallback sentence, `question_blocks[0].follow_up_required` is set to `true`, and an `email_fallback_detected` telemetry event is emitted.

**TASK-02 — Remove `booking-issues` from strict reference categories:**
Removed `"booking-issues"` from `STRICT_REFERENCE_CATEGORIES` in `packages/mcp-server/src/tools/draft-quality-check.ts`. The `requiresReferenceForActionPlan` function gates the policy check on `STRICT_REFERENCE_CATEGORIES.has(category)` when `booking_action_required` is false; removing the entry eliminates false `missing_required_reference` failures for FAQ drafts that incidentally mention a booking. The `booking_action_required=true` path is unaffected (policy check still runs via independent logic).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| CI — `packages/mcp-server` test suite (TC-01-01 through TC-01-05, TC-02-01 through TC-02-03) | Committed to `dev`; CI validates on push | 8 new tests added; local Jest execution prohibited per `docs/testing-policy.md` |
| `scripts/validate-engineering-coverage.sh docs/plans/brik-email-template-confidence-threshold/plan.md` | `{"valid": true}` | All required rows marked; passed locally |

## Workflow Telemetry Summary

4 DO stages recorded. Total context consumed: 320,548 bytes across lp-do-fact-find (42,287 bytes), lp-do-analysis (51,683 bytes), lp-do-plan (110,639 bytes), and lp-do-build (115,938 bytes). lp-do-build loaded 2 modules (build-code.md, build-validate.md). Deterministic checks: `validate-engineering-coverage.sh` run at both plan and build stages.

| Stage | Records | Modules | Context Bytes |
|---|---|---|---|
| lp-do-fact-find | 1 | 1 | 42,287 |
| lp-do-analysis | 1 | 1 | 51,683 |
| lp-do-plan | 1 | 1 | 110,639 |
| lp-do-build | 1 | 2 | 115,938 |
| **Total** | **4** | **5** | **320,548** |

## Validation Evidence

### TASK-01
- TC-01-01: Category-mismatched template (scenario `faq`, template category `check-in`), `adjustedConfidence=45` → gate rejects → `payload.template_used.subject === null`, `follow_up_required === true`, `appendTelemetryEvent` called with `event_key: "email_fallback_detected"`
- TC-01-02: No category hint (scenario `general`, template category `faq`), `adjustedConfidence=45` < 70 → gate rejects → `payload.template_used.subject === null`
- TC-01-03: Two candidates; hinted candidate (`faq` at confidence 65) beats unhinted (`general` at confidence 90) → gate selects hinted → `payload.template_used.subject === "FAQ — Check-in Time"`
- TC-01-04: No hint, unhinted confidence 80 ≥ 70 → gate accepts → `payload.template_used.subject === "Transportation to Hostel Brikette"`
- TC-01-05 (regression): Two-question composite email (breakfast + wifi) with real `rankTemplates` → `payload.composite === true`, `payload.question_blocks.length === 2` — composite path unaffected

### TASK-02
- TC-02-01: `booking_action_required: false`, scenario `booking-issues`, no reference URL → `failed_checks` does NOT contain `"missing_required_reference"`
- TC-02-02: `booking_action_required: true`, scenario `booking-issues`, no reference URL → `failed_checks` contains both `"missing_required_link"` AND `"missing_required_reference"` (action-required path unaffected)
- TC-02-03: `booking_action_required: false`, scenario `cancellation`, no reference URL → `failed_checks` contains `"missing_required_reference"` (remaining strict categories unchanged)

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Server-side email draft generation; no UI component changes |
| UX / states | N/A | No user-facing state machine changes |
| Security / privacy | N/A | No data flow, auth, or PII handling changes |
| Logging / observability / audit | `email_fallback_detected` telemetry event emitted on gate rejection (TC-01-01 asserts `appendTelemetryEvent` called with correct `event_key`) | Existing telemetry path reused |
| Testing / validation | 8 new tests (TC-01-01–TC-01-05, TC-02-01–TC-02-03); `validate-engineering-coverage.sh` passes | CI-only per testing policy |
| Data / contracts | No schema changes; `follow_up_required: true` field pre-exists in payload schema | Removed one Set entry in `STRICT_REFERENCE_CATEGORIES`; no migration needed |
| Performance / reliability | N/A | `selectSingleQuestionTemplate` is O(n) over small candidate arrays (typically ≤5) |
| Rollout / rollback | No feature flags; revert via git revert if needed | Isolated to `packages/mcp-server/src/` |

## Scope Deviations

- **Broken symlink removal** (`docs/plans/brik-email-template-confidence-threshold` wave commit was blocked by pre-existing broken symlink `.agents/skills/lp-signal-review` → `../../.claude/skills/lp-signal-review` which no longer existed). Removed and committed separately as a pre-push fix. Not in plan scope but required for CI to pass. No functional code was changed.
