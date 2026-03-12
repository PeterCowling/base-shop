---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-claude-token-auto-capture
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-analysis, lp-do-plan
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-claude-token-auto-capture/analysis.md
artifact: plan
---

# Claude Token Auto-Capture Plan

## Summary
Extend the workflow telemetry token capture module with automatic Claude Code session discovery via a layered cascade: explicit session ID (authoritative) → sessions-index.json (project-scoped) → debug/latest symlink (global fallback) → unknown. Add a session JSONL usage parser that sums per-message token data into cumulative snapshots compatible with the existing delta-from-previous-feature-record mode. All discovery paths validate resolved file paths stay within `~/.claude/`. Changes are additive and fail-open — existing explicit-session and Codex paths are untouched.

## Active tasks
- [x] TASK-01: Add session JSONL usage parser and sessions-index reader
- [x] TASK-02: Wire hybrid cascade into resolveClaudeSnapshot and update tests
- [x] TASK-03: Update skill docs and record telemetry for this slug

## Goals
- Auto-discover the current Claude session without operator-supplied session IDs
- Read per-message usage from session JSONL and produce cumulative snapshots
- Maintain fail-open semantics — unknown fallback when discovery fails

## Non-goals
- Changing the Codex auto-capture path
- Prompt-path instrumentation
- Separate subagent token tracking

## Constraints & Assumptions
- Constraints:
  - Explicit `--claude-session-id` must remain authoritative (never overridden by auto-discovery)
  - Must fail-open at every cascade layer
  - Resolved paths must be validated to start with `~/.claude/`
  - Session JSONL has per-message usage requiring full-scan summation
- Assumptions:
  - `sessions-index.json` and `debug/latest` conventions stable in Claude Code 2.1.x
  - Session JSONL `usage` format matches Anthropic API response shape

## Inherited Outcome Contract
- **Why:** When the system runs work using Claude, it can't automatically track how much that work costs. This means about half of all workflow runs have a blind spot in cost reporting. Fixing this gives complete visibility into what each piece of work actually costs, making budget decisions accurate instead of estimated.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All workflow runs — regardless of provider — automatically capture and report token costs without manual intervention.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-claude-token-auto-capture/analysis.md`
- Selected approach inherited:
  - Option A+B hybrid cascade: explicit ID → sessions-index → debug/latest → unknown
- Key reasoning used:
  - Explicit ID stays authoritative — backward compatible
  - sessions-index is project-scoped — handles concurrent agents correctly
  - debug/latest is global fallback — last-resort heuristic
  - Fail-open at every layer — no regressions

## Selected Approach Summary
- What was chosen:
  - Hybrid cascade discovery with project-scoped primary and global fallback
  - Session JSONL parser that streams and sums per-message usage
  - Path boundary validation on all discovery paths
- Why planning is not reopening option selection:
  - Analysis settled hybrid as strictly better than either source alone, with critique validation

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-claude-token-auto-capture/fact-find.md`
- Evidence carried forward:
  - Discovery chain verified end-to-end on live session
  - sessions-index.json has 285 entries with structured fields
  - Session JSONL usage format confirmed (input_tokens, output_tokens, cache_*)
  - CWD encoding: `replaceAll('/', '-')`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Session JSONL parser + sessions-index reader + debug/latest reader | 90% | M | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Wire cascade into resolveClaudeSnapshot + tests | 88% | M | Complete (2026-03-12) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update skill docs + record telemetry | 92% | S | Complete (2026-03-12) | TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: no UI component | - | - |
| UX / states | N/A: CLI/telemetry only | - | - |
| Security / privacy | Path boundary validation on all resolved paths | TASK-01, TASK-02 | Validate resolved path starts with `~/.claude/` |
| Logging / observability / audit | Discovery source recorded in telemetry `note` field | TASK-02, TASK-03 | Which cascade layer succeeded |
| Testing / validation | Fixture-based tests for each cascade layer independently | TASK-02 | Index, symlink, JSONL parser each tested |
| Data / contracts | New session JSONL parser; sessions-index reader; `WorkflowRuntimeTokenSnapshot` unchanged | TASK-01 | No schema changes |
| Performance / reliability | Line-by-line streaming sum; cascade exits at first success | TASK-01 | Bounded by message count |
| Rollout / rollback | Additive; explicit ID authoritative; fail-open at every layer | TASK-02 | No breaking changes |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Parser + readers (foundation) |
| 2 | TASK-02 | TASK-01 | Cascade wiring + tests |
| 3 | TASK-03 | TASK-02 | Docs + telemetry (light) |

## Tasks

### TASK-01: Add session JSONL usage parser, sessions-index reader, and debug/latest reader
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 92% - direct parallel to existing Codex parser; all formats verified
  - Approach: 90% - analysis settled hybrid cascade; no design ambiguity
  - Impact: 88% - closes measurement gap for Claude runs
- **Acceptance:**
  - `parseSessionJsonlUsage(filePath)` returns `WorkflowRuntimeTokenSnapshot` with cumulative totals summed from per-message `usage` fields
  - Handles `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` correctly
  - `findClaudeSessionFromIndex(projectDir, cwd)` reads `sessions-index.json`, returns latest session UUID for matching project
  - `findClaudeSessionFromDebugLatest(debugDir)` resolves symlink, extracts UUID from filename
  - Both discovery functions validate resolved paths start with `~/.claude/` (path boundary check)
  - All functions return `null` on any failure (fail-open)
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - CLI only
  - Security / privacy: Required - path boundary validation (`realpath` must start with `~/.claude/`)
  - Logging / observability / audit: N/A - logging added in TASK-02 cascade wiring
  - Testing / validation: Required - tested in TASK-02 via integration fixtures
  - Data / contracts: Required - new parser for session JSONL `usage` format; new reader for sessions-index.json `entries[]`
  - Performance / reliability: Required - line-by-line streaming sum; no full JSON.parse of session JSONL
  - Rollout / rollback: N/A - internal functions, not yet wired
- **Validation contract (TC-XX):**
  - TC-01: Session JSONL with 3 assistant messages (varying usage shapes) → cumulative snapshot with correct sums
  - TC-02: Session JSONL with no assistant messages → returns null
  - TC-03: Session JSONL with malformed lines → skips bad lines, returns partial sum or null
  - TC-04: sessions-index.json with 3 entries, different mtimes → returns latest session UUID
  - TC-05: sessions-index.json missing or malformed → returns null
  - TC-06: debug/latest symlink pointing to valid file → extracts UUID
  - TC-07: debug/latest symlink missing → returns null
  - TC-08: Resolved path outside `~/.claude/` → returns null (path boundary)
- **Execution plan:**
  1. Add `parseSessionJsonlUsage(filePath: string): WorkflowRuntimeTokenSnapshot | null` — streams lines, filters `type === "assistant"`, sums `message.usage` fields
  2. Add `findClaudeSessionFromIndex(projectDir: string, cwd: string): { sessionId: string; sessionJsonlPath: string } | null` — reads index, sorts by mtime, validates path
  3. Add `findClaudeSessionFromDebugLatest(debugDir: string): string | null` — readlink, extract UUID, validate path
  4. Add `validateClaudePath(resolvedPath: string): boolean` — checks path starts with resolved `~/.claude/`
- **Planning validation (required for M/L):**
  - Checks run: verified sessions-index.json structure (285 entries with `sessionId`, `fullPath`, `fileMtime`), verified session JSONL `usage` format, verified debug/latest symlink convention
  - Validation artifacts: fact-find.md § Evidence Audit, analysis.md § Fact-Find Reference
  - Unexpected findings: None
- **Consumer tracing:**
  - `parseSessionJsonlUsage` → consumed by TASK-02 `resolveClaudeSnapshot` cascade
  - `findClaudeSessionFromIndex` → consumed by TASK-02 cascade step 2
  - `findClaudeSessionFromDebugLatest` → consumed by TASK-02 cascade step 3
  - `validateClaudePath` → consumed by both discovery functions internally
- **Scouts:** None: all formats verified in fact-find
- **Edge Cases & Hardening:**
  - Empty sessions-index.json `entries` array → return null
  - Session JSONL where `message` field is not a dict → skip line
  - `usage` field missing `cache_creation_input_tokens` (older API responses) → treat as 0
  - Symlink target is relative path → resolve to absolute before validation
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with confirmation sessions-index format is documented by Anthropic.
- **Rollout / rollback:**
  - Rollout: Internal functions, no external interface change
  - Rollback: Remove functions; no downstream impact until TASK-02 wires them
- **Documentation impact:**
  - JSDoc on new exported functions
- **Notes / references:**
  - Parallel to existing `readLatestCodexTokenSnapshot()` and `findCodexSessionLog()`
  - `usage` format: `{ input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, service_tier }`
  - sessions-index schema: `{ version, entries: [{ sessionId, fullPath, fileMtime, ... }], originalPath }`

### TASK-02: Wire hybrid cascade into resolveClaudeSnapshot and add tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts` + test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 90% - clear cascade wiring; existing test patterns to follow
  - Approach: 88% - cascade ordering verified by critique
  - Impact: 85% - closes the measurement gap; exact coverage depends on runtime
- **Acceptance:**
  - `resolveClaudeSnapshot()` now follows: explicit ID → sessions-index → debug/latest → null
  - Explicit `--claude-session-id` / env var always wins (backward compatible)
  - When auto-discovery succeeds, `runtime_usage_provider` is `"claude"` and `token_source` is `"api_usage"`
  - When auto-discovery fails, behavior is identical to current (falls back to `unknown`)
  - Existing explicit-session test at telemetry.test.ts:299 still passes unchanged
  - New tests cover: index discovery, symlink discovery, cascade ordering, path boundary rejection
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - CLI only
  - Security / privacy: Required - cascade respects path boundary validation from TASK-01
  - Logging / observability / audit: Required - record which discovery method succeeded in `note` field
  - Testing / validation: Required - fixture-based tests for each cascade layer independently
  - Data / contracts: Required - no schema changes; `WorkflowRuntimeTokenSnapshot` shape unchanged
  - Performance / reliability: Required - cascade exits at first success; no wasted I/O
  - Rollout / rollback: Required - additive; existing paths untouched; fail-open preserved
- **Validation contract (TC-XX):**
  - TC-01: Explicit session ID supplied + auto-discovery would find different session → explicit ID wins
  - TC-02: No explicit ID, sessions-index has entries → project-scoped discovery returns correct session
  - TC-03: No explicit ID, sessions-index missing, debug/latest exists → symlink fallback returns session
  - TC-04: All discovery fails → returns null → `token_source: "unknown"` (existing behavior)
  - TC-05: Existing explicit-session test (telemetry.test.ts:299) passes unchanged
  - TC-06: Path boundary violation on any discovery path → that layer returns null, cascade continues
- **Execution plan:**
  1. Refactor `resolveClaudeSnapshot()` to try cascade: (a) explicit session ID from env, (b) `findClaudeSessionFromIndex()`, (c) `findClaudeSessionFromDebugLatest()`
  2. For each successful discovery, call `parseSessionJsonlUsage()` to read the session JSONL
  3. Set `note` field (singular, matching `WorkflowRuntimeTokenSnapshot`) indicating which discovery method succeeded (for observability)
  4. Add fixture-based tests: create temp directories with session JSONL, sessions-index.json, debug/latest symlink
  5. Verify existing explicit-session test passes without modification
- **Planning validation (required for M/L):**
  - Checks run: existing test file at telemetry.test.ts:299 confirmed; cascade ordering validated by critique
  - Validation artifacts: analysis-critique-history.md (resolve order critical finding)
  - Unexpected findings: None
- **Consumer tracing:**
  - `resolveClaudeSnapshot()` → consumed by `resolveWorkflowRuntimeTokenUsage()` at line 394 (unchanged call site)
  - `note` field → consumed by telemetry reporter (already supports non-null note)
  - No new consumers; existing consumers unchanged
- **Scouts:** None: cascade ordering settled by critique
- **Edge Cases & Hardening:**
  - Concurrent sessions: sessions-index returns latest by mtime for this project — correct for single-operator multi-agent use
  - debug/latest pointing to different project's session: path validation catches this (session JSONL path must match CWD-encoded project dir)
  - Race condition: session JSONL growing while being read → streaming read handles this (reads whatever is available at scan time)
- **What would make this >=90%:**
  - End-to-end test verifying `token_measurement_coverage` increases after wiring
- **Rollout / rollback:**
  - Rollout: Auto-discovery activates immediately for all Claude-backed runs; no flag needed
  - Rollback: Revert the cascade wiring; explicit-session and Codex paths unaffected
- **Documentation impact:**
  - Update inline comments in `resolveClaudeSnapshot()` to document cascade ordering
- **Notes / references:**
  - Resolve order (authoritative): explicit ID → sessions-index → debug/latest → null

### TASK-03: Update skill docs and record telemetry for this slug
- **Type:** IMPLEMENT
- **Deliverable:** doc updates + telemetry record
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-ideas/SKILL.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`, `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`, `docs/plans/do-workflow-claude-token-auto-capture/build-record.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% - doc edits only; straightforward
  - Approach: 92% - clear what needs updating
  - Impact: 90% - removes misleading "Claude requires explicit session ID" language
- **Acceptance:**
  - All DO stage skill docs updated: Claude token usage is now auto-captured (no explicit session ID required)
  - Telemetry schema doc updated to note sessions-index and debug/latest as discovery sources
  - Workflow telemetry recorded for this feature slug
  - Build record persisted
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - docs only
  - Security / privacy: N/A - no code changes
  - Logging / observability / audit: Required - telemetry recorded for this slug
  - Testing / validation: N/A - doc changes don't need tests
  - Data / contracts: N/A - no schema changes
  - Performance / reliability: N/A - docs only
  - Rollout / rollback: N/A - docs only
- **Validation contract (TC-XX):**
  - TC-01: Grep skill docs for "explicit session" / "manual" Claude language → none remain
  - TC-02: Telemetry record exists for this slug with stage `lp-do-build`
- **Execution plan:**
  1. Update 5 skill SKILL.md files: replace "Claude requires explicit session ID" with "Claude auto-captured via project session logs"
  2. Update telemetry schema doc to list sessions-index.json and debug/latest as discovery sources
  3. Record workflow telemetry: `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage lp-do-build --feature-slug do-workflow-claude-token-auto-capture --module modules/build-code.md --input-path docs/plans/do-workflow-claude-token-auto-capture/plan.packet.json --deterministic-check scripts/validate-plan.sh --deterministic-check scripts/validate-engineering-coverage.sh`
  4. Write build-record to `docs/plans/do-workflow-claude-token-auto-capture/build-record.md` using template `docs/plans/_templates/build-record.user.md`
- **Scouts:** None: scope is clear
- **Edge Cases & Hardening:** None: doc-only task
- **What would make this >=90%:** Already at 92%.
- **Rollout / rollback:**
  - Rollout: Doc changes take effect immediately
  - Rollback: Revert doc changes
- **Documentation impact:**
  - This task IS the documentation update
- **Notes / references:**
  - Grep for "claude.*session.*id" and "explicit.*session" in skill docs to find all instances

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Parser + readers | Yes — no dependencies | None | No |
| TASK-02: Cascade wiring + tests | Yes — TASK-01 provides functions | None — existing test patterns confirmed | No |
| TASK-03: Docs + telemetry | Yes — TASK-02 proves the feature works | None | No |

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| sessions-index.json format changes | Low | Medium | Graceful degradation; fall through to debug/latest |
| debug/latest convention changes | Low | Medium | Fall through to telemetry-log; explicit ID always works |
| Large session JSONL read latency | Medium | Low | Streaming line-by-line sum; bounded by message count |
| Concurrent session misattribution | Medium | Low | sessions-index is project-scoped; debug/latest is last resort only |

## Observability
- Logging: `note` field on telemetry records indicates which discovery method succeeded
- Metrics: `token_measurement_coverage` should increase from ~50% toward ~100%
- Alerts/Dashboards: existing telemetry reporter already surfaces coverage gaps

## Acceptance Criteria (overall)
- [ ] Claude-backed workflow runs auto-capture token usage without explicit session ID
- [ ] Explicit `--claude-session-id` still works and takes priority
- [ ] Codex auto-capture unchanged
- [ ] All existing tests pass
- [ ] New tests cover each cascade layer independently
- [ ] Skill docs updated to reflect auto-capture

## Decision Log
- 2026-03-12: Analysis chose hybrid cascade (A+B) over debug/latest-only (A) after critique found concurrency risk. Explicit ID remains authoritative per critique finding.

## Overall-confidence Calculation
- TASK-01: 90% × M(2) = 180
- TASK-02: 88% × M(2) = 176
- TASK-03: 92% × S(1) = 92
- Overall = (180 + 176 + 92) / (2 + 2 + 1) = 448 / 5 = 89.6% → 88% (conservative rounding, min-method applies)
