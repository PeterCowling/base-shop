# Build Record: Email Pipeline Simulation Hardening

**Plan:** `docs/plans/email-pipeline-simulation-hardening/plan.md`
**Completed:** 2026-03-06
**Status:** All 6 tasks complete

## What Was Done

A simulation audit identified six structural defects in the `@acme/mcp-server` email draft pipeline not addressed by the prior `email-day-to-day-readiness` plan. This build fixed all six defects across three pipeline layers.

**Layer 1 — Intent extraction** (TASK-01, TASK-02):
- Added a simulation defect corpus to the integration test (4 new scenarios targeting each defect).
- Implemented `atomizeCompoundClauses()` in `draft-interpret.ts` — a preprocessing step that splits compound guest inquiries (joined by "and also", "and what", "as well as", etc.) before extractors run. Each fragment is processed independently and results merged. Cross-array dedup removes request items that overlap with question items so the same intent isn't counted twice.

**Layer 2 — Template selection** (TASK-03, TASK-04):
- Split `booking_monitor` into two fields in `WorkflowTriggers`: `booking_action_required` (narrowed to operational booking verbs: cancel, modify, change, extend, new booking) and `booking_context` (broad informational mention). Quality gate and link enforcement now key off `booking_action_required` only — informational emails mentioning "my booking" no longer produce spurious `missing_required_link` failures. Updated all 4 production Zod schemas and 24 test files.
- Added `PER_QUESTION_FLOOR = 25` constant and a confidence floor filter to `rankTemplatesPerQuestion()` in `template-ranker.ts`. Candidates below the floor are excluded, producing `followUpRequired: true` blocks for unknown-topic questions instead of fluent-but-wrong template answers.

**Layer 3 — Quality enforcement and coverage** (TASK-06, TASK-05):
- Extended the `SYNONYMS` dict in `template-ranker.ts` with 15 new entries (availability, pool, facility, amenity, parking, kitchen, tour, activity, etc.) and added a `TOPIC_SYNONYMS` fallback dict in `coverage.ts` for coverage-specific keyword expansion. Correctly paraphrased answers are no longer marked partial.
- Added `computeDeliveryStatus()` helper and `delivery_status: "ready" | "needs_patch" | "blocked"` field to the `draft_generate` output. Updated `ops-inbox/SKILL.md` to make the `delivery_status` check a mandatory hard gate before calling `gmail_create_draft` — replacing the prior advisory `quality.passed` check.

## Outcome Contract

- **Why:** The `email-day-to-day-readiness` plan improved multipart answer composition, but a simulation audit showed the pipeline still drops sub-questions on mixed-intent emails, accepts semantically wrong template blocks for unknown topics, and can return failed-quality drafts with no machine enforcement — creating routine operator patch work and eroding daily inbox trust.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Compound guest emails produce one intent per clause with no double-counted requests; composite template blocks have a confidence floor so unknown topics get an explicit follow-up instead of a wrong answer; `quality.passed=false` is surfaced as a machine-enforced `delivery_status: blocked` that prevents Gmail draft creation.
- **Source:** operator

## Commits

| Task | Commit | Scope |
|---|---|---|
| TASK-01 | `348a4bb8cd` | Simulation defect corpus (integration tests) |
| TASK-02 | `da5a586031` | Clause atomization + cross-dedup in draft-interpret |
| TASK-03a | `b21eddddb2` | booking_monitor → booking_action_required + booking_context (production) |
| TASK-03b | `fe57c805e7` | booking field rename (test batch 1) |
| TASK-03c | `f399bddfcc` | booking field rename (draft-refine tests) |
| TASK-04 + TASK-06 | `8a6c3c86b1` | Confidence floor + synonym expansion |
| TASK-05 | `41940d851c` | delivery_status field + ops-inbox skill doc update |

## Validation

All changes validated by:
- TypeScript typecheck (`pnpm --filter ./packages/mcp-server typecheck`) — passes on each commit
- ESLint (`pnpm --filter ./packages/mcp-server lint`) — passes on each commit
- All pre-commit hooks passed (lint-staged, typecheck-staged, validate-agent-context)
- CI tests pending (per testing-policy.md — tests run in CI only)
