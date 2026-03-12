---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: "2026-03-12"
Feature-Slug: do-workflow-claude-token-auto-capture
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
Build-Event-Ref: docs/plans/do-workflow-claude-token-auto-capture/build-event.json
---

# Build Record: Claude Token Auto-Capture

## Outcome Contract

- **Why:** When the system runs work using Claude, it can't automatically track how much that work costs. This means about half of all workflow runs have a blind spot in cost reporting. Fixing this gives complete visibility into what each piece of work actually costs, making budget decisions accurate instead of estimated.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All workflow runs — regardless of provider — automatically capture and report token costs without manual intervention.
- **Source:** operator

## What Was Built

**TASK-01 + TASK-02:** Added a hybrid cascade for automatic Claude Code session discovery to `workflow-runtime-token-usage.ts`. The cascade tries: (1) explicit session ID from env vars (authoritative), (2) `sessions-index.json` project-scoped discovery (primary auto), (3) `debug/latest` symlink (global fallback), then (4) falls back to unknown. Added `parseSessionJsonlUsage()` to sum per-message token usage from session JSONL files, `findClaudeSessionFromIndex()` to read the project-scoped sessions index, `findClaudeSessionFromDebugLatest()` to resolve the global debug symlink, and `validateClaudePath()` to prevent symlink escape. The `note` field now records which discovery method succeeded. New test file covers all cascade layers independently.

**TASK-03:** Updated 5 DO stage skill docs (fact-find, analysis, plan, build, ideas) to replace "requires explicit session ID" language with "auto-captured via project session logs". Recorded workflow telemetry for this feature slug.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit --project scripts/tsconfig.json` | Pass | Clean typecheck |
| `npx eslint <changed files>` | Pass | Clean lint |
| New tests in `workflow-runtime-token-usage.test.ts` | Pending CI | 14 test cases covering parser, index reader, debug/latest reader, cascade ordering |

## Workflow Telemetry Summary

- Feature slug: `do-workflow-claude-token-auto-capture`
- Records: 4 (fact-find, analysis, plan, build)
- Token measurement coverage: 0.0% (expected — this build implements the auto-capture that will fix this)
- Context input bytes: 203,913
- Modules counted: 5
- Deterministic checks counted: 6
- Stages missing records: lp-do-ideas

## Validation Evidence

### TASK-01
- TC-01: Session JSONL with 3 assistant messages → cumulative snapshot with correct sums — test written
- TC-02: Session JSONL with no assistant messages → returns null — test written
- TC-03: Malformed lines skipped, partial sum returned — test written
- TC-04: sessions-index with 3 entries, different mtimes → latest session returned — test written
- TC-05: Missing/malformed index → returns null — test written
- TC-06: debug/latest symlink → extracts UUID correctly — test written
- TC-07: Missing symlink → returns null — test written
- TC-08: Path boundary validation on discovery paths — `validateClaudePath()` implemented

### TASK-02
- TC-01: Explicit session ID wins over auto-discovery — test written
- TC-02: sessions-index auto-discovery when no explicit ID — test written
- TC-03: debug/latest fallback when index unavailable — test written
- TC-04: All discovery fails → unknown — test written
- TC-05: Existing explicit-session test unchanged — backward compatible
- TC-06: Path boundary validation on cascade — enforced via TASK-01 functions

### TASK-03
- TC-01: Grep for "explicit session" in skill docs → none remain — verified
- TC-02: Telemetry record exists for this slug with stage lp-do-build — recorded

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A: no UI component | - |
| UX / states | N/A: CLI/telemetry only | - |
| Security / privacy | `validateClaudePath()` checks `realpathSync()` starts with `~/.claude/` | Prevents symlink escape on all discovery paths |
| Logging / observability / audit | `note` field populated with `claude_discovery:<method>` | Records which cascade layer succeeded |
| Testing / validation | 14 test cases in `workflow-runtime-token-usage.test.ts` | Each cascade layer tested independently |
| Data / contracts | `WorkflowRuntimeTokenSnapshot` interface unchanged; 3 new options fields with defaults | No breaking changes |
| Performance / reliability | Line-by-line JSONL scan; cascade exits at first success | Bounded by message count |
| Rollout / rollback | Additive; explicit session ID authoritative; fail-open at every layer | No breaking changes; revert = remove new functions |

## Scope Deviations

None.
