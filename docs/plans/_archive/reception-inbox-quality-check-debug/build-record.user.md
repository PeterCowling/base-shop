---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-quality-check-debug
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/_archive/reception-inbox-quality-check-debug/build-event.json
---

# Build Record: Reception Inbox Quality Check Debug Output

## Outcome Contract

- **Why:** When a draft fails quality checks, the operator sees only opaque check names. This makes it impossible to quickly understand what needs fixing without reading the full email and manually cross-referencing policy rules. Actionable detail saves review time and reduces missed issues.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Quality check failures include specific detail: which mandatory phrases are missing, which prohibited phrases were found, and which reference URLs were expected. Available in the quality result object returned by `runQualityChecks()` and the MCP `draft_quality_check` tool.
- **Source:** operator

## What Was Built

The quality-check result contract is now additive instead of opaque: both the reception draft pipeline and the MCP server duplicate expose `failed_check_details` alongside the existing `failed_checks` array. The detail payload enumerates missing policy phrases, prohibited content matches, prohibited claims, expected canonical references, contradicted commitments, and unanswered questions while leaving self-explanatory binary failures as plain check names.

The closure gap was on the reception-side verification surface rather than the implementation itself. This pass extended reception test coverage for missing and inapplicable references plus contradicted-thread detail, while preserving the existing lossy parity projection that intentionally excludes `failed_check_details`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Run on 2026-03-09 during closure |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Exit 0; warnings only |
| `pnpm --filter @acme/mcp-server typecheck` | Pass | Run on 2026-03-09 during closure |
| `pnpm --filter @acme/mcp-server lint` | Pass | Run on 2026-03-09 during closure |

## Validation Evidence

- `apps/reception/src/lib/inbox/draft-core/quality-check.ts` and `packages/mcp-server/src/tools/draft-quality-check.ts` both expose `failed_check_details`.
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts` still projects only `{ passed, failed_checks, warnings }` in `toParitySnapshot()`.
- Reception tests now cover reference applicability and contradicted-thread detail cases in addition to the existing mandatory/prohibited/question coverage.
- MCP tool tests already covered detail shape across policy, reference, and contradiction scenarios.

## Scope Deviations

None. This 2026-03-09 pass closed the remaining verification gap and backfilled the archive artifacts.
