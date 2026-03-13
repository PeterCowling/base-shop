---
Type: Build-Record
Feature-Slug: mcp-server-reply
Build-Date: 2026-03-13
Status: Complete
---

# Build Record — MCP Server Draft Reply — Honesty Gate and Quality Enforcement

## Outcome Contract

- **Why:** When a guest asks about something the AI has not seen before, it picks its best guess and sends it as correct. This risks giving guests wrong information. Separately, a quality warning that staff can skip is not a guarantee — a real code-level block ensures the quality bar cannot be bypassed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** (1) `gmail_create_draft` rejects calls with `deliveryStatus: "blocked"` at the tool boundary — agents that receive a blocked quality result can no longer silently create a draft. (2) Coverage scoring false-positives reduced by tightening `SYNONYMS["pool"]` in `template-ranker.ts` — pool questions answered with generic facility text now score "missing" rather than "covered".
- **Source:** operator

## Summary

Two code changes to `packages/mcp-server` closed the remaining AI email-reply quality gaps. Both were delivered as a single wave commit (5b39dba5d8).

**TASK-02 — Gmail draft gate:**
- Added `deliveryStatus: z.enum(["ready", "needs_patch", "blocked"]).optional()` to `createDraftSchema` in `gmail.ts:574`
- Added early-return guard at top of `handleCreateDraft` (`gmail.ts:2687`): if `deliveryStatus === "blocked"`, returns `errorResult("Draft creation blocked: quality checks did not pass. Inspect quality.failed_checks from draft_generate output before proceeding.")`
- Widened return type to `Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>>` — TypeScript compile confirmed clean
- Updated MCP tool description for `gmail_create_draft` to document the `deliveryStatus` field
- Added 3 new tests in a separate `describe` block in `gmail-create-draft.test.ts`: TC-gmail-blocked, TC-gmail-absent, TC-gmail-ready

**TASK-03 — Coverage synonym tightening:**
- Changed `SYNONYMS["pool"]` at `template-ranker.ts:179` from `["swimming", "swim", "rooftop", "facility", "amenity"]` to `["swimming", "swim", "rooftop"]`
- Added 2 new regression tests to `draft-quality-check.test.ts`: TC-pool-missing (generic facility body → "missing"), TC-pool-covered (swimming/rooftop body → "covered")

**Key planning correction carried into build:** The analysis and fact-find both targeted `coverage.ts:TOPIC_SYNONYMS["pool"]`, but planning-phase verification found that `evaluateQuestionCoverage` uses `SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword]` — since `SYNONYMS["pool"]` exists in `template-ranker.ts`, `TOPIC_SYNONYMS["pool"]` is never consulted for "pool" queries. Fix correctly applied to `template-ranker.ts`.

## Engineering Coverage Evidence

| Coverage Area | Delivered | Evidence |
|---|---|---|
| UI / visual | N/A | MCP tool layer only — no UI change |
| UX / states | ✓ | Agent receives `isError: true` with actionable message naming `quality.failed_checks`; TC-gmail-blocked confirms |
| Security / privacy | N/A | Caller-supplied field; belt-and-suspenders design acknowledged in fact-find |
| Logging / observability / audit | N/A | `email_fallback_detected` telemetry unchanged; TASK-03 may increase `partial_question_coverage` rate — monitor |
| Testing / validation | ✓ | 5 new tests added (TC-gmail-blocked, TC-gmail-absent, TC-gmail-ready, TC-pool-missing, TC-pool-covered) |
| Data / contracts | ✓ | Additive optional `deliveryStatus` field; callers omitting it unaffected |
| Performance / reliability | N/A | Pure logic + data changes; no I/O path changes |
| Rollout / rollback | ✓ | Single commit; revert to roll back; callers unaffected if field absent |

## Validation

- `pnpm --filter mcp-server typecheck` — passed clean
- `pnpm --filter mcp-server lint` — passed clean (including new test files)
- `scripts/validate-engineering-coverage.sh docs/plans/mcp-server-reply/plan.md` — `{ "valid": true }`
- Pre-commit hooks: typecheck-staged and lint-staged both passed

## Workflow Telemetry Summary

| Stage | Records | Modules | Context Input (bytes) | Artifact (bytes) | Cache% |
|---|---|---|---|---|---|
| lp-do-fact-find | 1 | 1.00 | 45162 | 24839 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 64458 | 17770 | 0.0% |
| lp-do-plan | 1 | 1.00 | 94255 | 25276 | 0.0% |
| lp-do-build | 1 | 2.00 | 112452 | 0 | 0.0% |

Total context input: 316 KB across the full pipeline.

## Notes

- `gmail-handlers.ts` was confirmed as dead code during planning (no importers). Not touched. Pre-existing scope note only.
- TASK-01 (composite-path hinted-first selector) was resolved in a prior commit; retained for traceability only.
- Monitor ops-inbox quality stats after deploy for `partial_question_coverage` warning frequency change on pool-related emails.
