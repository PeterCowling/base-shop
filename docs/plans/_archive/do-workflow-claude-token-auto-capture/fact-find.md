---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-claude-token-auto-capture
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-analysis, lp-do-plan
Related-Analysis: docs/plans/do-workflow-claude-token-auto-capture/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312075840-C001
Trigger-Source: dispatch-routed
artifact: fact-find
---

# Claude Token Auto-Capture Fact-Find Brief

## Scope
### Summary
Extend the workflow telemetry system to automatically capture token usage for Claude Code sessions, closing the ~50% coverage gap left when the prior plan (do-workflow-runtime-token-capture) shipped Codex auto-capture but deferred Claude as a non-goal.

### Goals
- Auto-discover the current Claude Code session without requiring an explicit session ID argument
- Read token usage from the session JSONL (same data source Claude Code uses internally)
- Produce cumulative token snapshots compatible with the existing delta-from-previous-feature-record mode

### Non-goals
- Changing the Codex auto-capture path
- Adding prompt-path instrumentation
- Capturing subagent token usage separately from the parent session

### Constraints & Assumptions
- Constraints:
  - Must fail-open: if discovery fails, fall back to existing `unknown` behavior
  - Must not read files outside `~/.claude/` without explicit user intent. The `debug/latest` symlink must be resolved and the target path validated to start with `~/.claude/` before reading, preventing symlink-based escape.
  - Must work on macOS (primary dev environment)
- Assumptions:
  - `~/.claude/debug/latest` symlink exists and points to the current session's debug log (verified: true for Claude Code 2.1.49+)
  - Session JSONL files at `~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl` contain `usage` data on `assistant`-type messages (verified)
  - CWD-to-project-path encoding replaces all `/` with `-` using a global replace (verified: `/Users/petercowling/base-shop` → `-Users-petercowling-base-shop`). Note: in JS/TS this requires `replaceAll('/', '-')` or a regex, not `replace('/', '-')` which only replaces the first occurrence.

## Outcome Contract
- **Why:** When the system runs work using Claude, it can't automatically track how much that work costs. This means about half of all workflow runs have a blind spot in cost reporting. Fixing this gives complete visibility into what each piece of work actually costs, making budget decisions accurate instead of estimated.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All workflow runs — regardless of provider — automatically capture and report token costs without manual intervention.
- **Source:** operator

## Discovery Contract Output
Not applicable — no self-evolving discovery contract present.

## Evidence Audit (Current State)

### Entry Points
- `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts` — runtime token resolution module; `resolveWorkflowRuntimeTokenUsage()` is called by the telemetry recorder
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts:388-394` — builds runtime token env and calls the resolver

### Key Modules / Files
1. `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts` — core module; contains `resolveCodexSnapshot()`, `resolveClaudeSnapshot()`, `findClaudeSessionId()`, and the delta/fallback logic
2. `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — telemetry recorder; calls runtime token resolution and persists records
3. `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts` — integration tests including Claude explicit-session test at line 299
4. `~/.claude/debug/latest` — symlink to current session debug log; filename = session UUID
5. `~/.claude/projects/-Users-petercowling-base-shop/<uuid>.jsonl` — session conversation logs with `usage` in assistant messages

### Patterns & Conventions Observed
- **Provider cascade**: Codex checked first, Claude second — `resolveCodexSnapshot() ?? resolveClaudeSnapshot()` at line 393
- **Session discovery**: Codex uses `CODEX_THREAD_ID` env var → file search in `~/.codex/sessions/`; Claude currently uses explicit env vars (`WORKFLOW_TELEMETRY_CLAUDE_SESSION_ID`, `CLAUDE_SESSION_ID`, `CLAUDE_CODE_SESSION_ID`) → file search in `~/.claude/telemetry/`
- **Tail scanning**: Codex uses progressive tail windows (512KB → 2MB → 8MB) for large JSONL files; Claude currently reads full files
- **Snapshot shape**: Both providers produce `WorkflowRuntimeTokenSnapshot` with `provider`, `sessionId`, `snapshotAt`, `totalInputTokens`, `totalOutputTokens`, `lastInputTokens`, `lastOutputTokens`

### Data & Contracts
- Types/schemas:
  - `WorkflowRuntimeTokenSnapshot` — shared snapshot interface for both providers
  - `WorkflowRuntimeUsageProvider` — `"codex" | "claude"` (no change needed)
  - `WorkflowStepTelemetryRecord` — downstream record; already supports Claude provider
- Session JSONL `usage` format (verified):
  ```json
  {
    "input_tokens": 3,
    "cache_creation_input_tokens": 16420,
    "cache_read_input_tokens": 0,
    "output_tokens": 7,
    "service_tier": "standard"
  }
  ```
- Telemetry JSONL already has fields for `runtime_usage_provider: "claude"`, `runtime_session_id`, etc.

### Dependency & Impact Map
- Upstream dependencies:
  - Claude Code session file format (internal to Claude Code; may change between versions)
  - `~/.claude/debug/latest` symlink convention (internal to Claude Code)
  - `~/.claude/projects/` directory structure (internal to Claude Code)
- Downstream dependents:
  - `lp-do-ideas-workflow-telemetry.ts` — calls resolver; already handles Claude provider
  - Telemetry reporter and summaries — already supports Claude records
  - Workflow step CLI command — already passes `claudeSessionId` through
- Likely blast radius:
  - Small — changes are isolated to `workflow-runtime-token-usage.ts` discovery functions
  - Fail-open by design — if discovery fails, existing `unknown` behavior preserved

### Test Landscape
#### Test Infrastructure
- Framework: Jest (via `pnpm -w run test:governed`)
- Relevant test file: `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- CI integration: tests run in CI only (per testing policy)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Codex auto-capture with delta | Integration | telemetry.test.ts:248-296 | Full Codex session log fixture + multi-stage delta |
| Claude explicit-session capture | Integration | telemetry.test.ts:299-398 | Claude telemetry log fixture + `claudeSessionId` param |
| Telemetry dedup | Integration | telemetry.test.ts | SHA-256 dedup key prevents duplicate records |

#### Coverage Gaps
- No unit tests for `workflow-runtime-token-usage.ts` in isolation (tested only through integration)
- No test for auto-discovery (since it didn't exist yet)
- No test for session JSONL reading (only telemetry log format tested)

#### Testability Assessment
- Easy to test: session JSONL parsing (create temp file with known usage data)
- Easy to test: session UUID extraction from debug symlink (create temp symlink)
- Hard to test: CWD-to-project-path encoding (depends on Claude Code internal convention)

#### Recommended Test Approach
- Unit tests for: `findClaudeSessionFromProjectLogs()` (new function), session JSONL token parsing
- Integration tests for: full auto-capture chain with fixture session JSONL + debug symlink

### Recent Git History (Targeted)
- `workflow-runtime-token-usage.ts` — created as part of `do-workflow-runtime-token-capture` plan (2026-03-11); Codex auto-capture + Claude explicit-session support
- `lp-do-ideas-workflow-telemetry.ts` — extended same date with runtime token integration and CLI flags

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI component | None | None |
| UX / states | N/A | CLI/telemetry only | None | None |
| Security / privacy | Required | Reads session files from `~/.claude/` which contain conversation data | Must only read `usage` fields, not message content; only access own session | Ensure content is never logged or stored |
| Logging / observability / audit | Required | Telemetry records already have provider/session fields | Auto-capture will close the measurement gap | Verify telemetry coverage moves toward 100% |
| Testing / validation | Required | Existing integration tests cover explicit-session path | Need new tests for auto-discovery chain | Add fixture-based unit tests |
| Data / contracts | Required | `WorkflowRuntimeTokenSnapshot` interface unchanged | Session JSONL `usage` format differs from telemetry log format — need new parser | New parsing function required |
| Performance / reliability | Required | Codex uses tail-scanning for large files (cumulative totals per record). Claude session JSONL has per-message usage — no cumulative totals, so tail-scanning alone won't work. | Session JSONL can grow large in long sessions (194 messages in current session). Must sum all assistant message usage fields. | Use line-by-line streaming sum; avoid full JSON parse into memory. Bounded by message count (hundreds, not millions). |
| Rollout / rollback | Required | Fail-open design — null snapshot returns `unknown` token source | Auto-discovery added as first-preference; explicit session ID remains available | No breaking changes; additive only |

## Scope Signal
- **Signal:** right-sized
- **Rationale:** The discovery chain is verified working (debug/latest → UUID → session JSONL → usage data). The change is bounded to one module plus tests. Parallels the existing Codex pattern exactly. Prior plan's non-goal was based on "no stable session locator" — this investigation found it.

## Questions

### Resolved
- Q: Does Claude Code expose any session identifier as an environment variable?
  - A: No. `CLAUDE_SESSION_ID` and `CLAUDE_CODE_SESSION_ID` are empty. `CLAUDECODE=1`, `CLAUDE_CODE_ENTRYPOINT=cli`, and `CLAUDE_CODE_SSE_PORT` are set but don't contain the session UUID.
  - Evidence: `env | grep CLAUDE` in current session

- Q: Where does Claude Code store session token data?
  - A: In `~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl`. Each `assistant`-type message contains a `usage` object with `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.
  - Evidence: Parsed current session file — 194 assistant messages with 15M+ total input tokens

- Q: How can the current session UUID be discovered without an explicit env var?
  - A: `~/.claude/debug/latest` is a symlink to `~/.claude/debug/<session-uuid>.txt`. The basename minus `.txt` extension is the session UUID. Verified: `readlink ~/.claude/debug/latest` → `69d199f6-bf3f-4837-a680-8fa673ae6207.txt`
  - Evidence: Direct filesystem inspection
  - **Concurrency caveat**: Under concurrent Claude sessions, `debug/latest` points to whichever session was started most recently — not necessarily the invoking session. This means auto-discovery may attribute tokens to the wrong session when multiple Claude instances are active. Mitigation: the implementation should treat this as a best-effort heuristic and fall back to explicit session ID when concurrency is detected (e.g. multiple recent debug logs within a time window). This is an accepted limitation — single-session use is the dominant case for this repo.

- Q: How is the CWD encoded in the project path?
  - A: `cwd.replace('/', '-')`. E.g. `/Users/petercowling/base-shop` → `-Users-petercowling-base-shop`
  - Evidence: `ls ~/.claude/projects/` shows exactly this pattern

- Q: Does the `~/.claude/telemetry/` directory contain token data?
  - A: No. It only contains `1p_failed_events.*` files (error logs). Successful API events with token data are in the project session JSONL, not in the telemetry directory.
  - Evidence: `ls ~/.claude/telemetry/` shows only `1p_failed_events.*` files

- Q: Why did the prior plan list Claude auto-capture as a non-goal?
  - A: The prior analysis (do-workflow-runtime-token-capture) rejected "unsafe implicit Claude discovery" because it assumed no stable current-session locator existed. The `debug/latest` symlink provides that locator.
  - Evidence: `docs/plans/do-workflow-runtime-token-capture/analysis.md` line 53 and `plan.md` non-goals

### Open (Operator Input Required)
None — all questions resolved from filesystem evidence.

## Confidence Inputs
- Implementation: 90% — discovery chain verified end-to-end; parallels existing Codex pattern; bounded to one module
- Approach: 88% — clear path forward; only risk is Claude Code version changes to session storage format
- Impact: 85% — closes ~50% token measurement gap; exact coverage improvement depends on ratio of Claude vs Codex runs
- Delivery-Readiness: 92% — module exists with tests; changes are additive
- Testability: 88% — fixture-based tests straightforward; symlink/file creation in tmpdir is standard

All scores ≥80 (build-eligible). To reach ≥90: confirm the `debug/latest` convention is stable across Claude Code 2.1.x releases.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Claude Code changes session file format | Low | Medium | Fail-open design — returns `unknown` instead of crashing; version check possible |
| `debug/latest` symlink removed in future version | Low | High | Fall back to explicit session ID; monitor Claude Code changelogs |
| Large session JSONL causes slow reads | Medium | Low | Unlike Codex (which has cumulative totals in each record allowing tail-scan), Claude session JSONL has per-message usage requiring a full scan to sum. Mitigation: stream and sum incrementally (no full parse into memory); or maintain a running-total cache file alongside the session |
| Session JSONL locked by Claude Code during writes | Low | Low | Read-only access; JSONL append-only format is safe for concurrent reads |
| Concurrent Claude sessions misattribute tokens | Medium | Low | `debug/latest` points to most-recent session, not necessarily the invoking one. Mitigate: detect concurrent sessions and fall back to explicit ID. Single-session is the dominant case. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Provider cascade: Codex first, then Claude (session JSONL), then Claude (telemetry logs), then unknown
  - Fail-open: null snapshot → unknown token source
  - Delta mode: cumulative totals with prior-baseline subtraction
- Rollout expectations:
  - Auto-discovery is additive; no flag needed
  - Explicit `--claude-session-id` remains available as override
- Observability expectations:
  - `runtime_usage_provider: "claude"` and `token_source: "api_usage"` in telemetry records when auto-capture succeeds

## Suggested Task Seeds (Non-binding)
1. Add `findClaudeSessionFromProjectLogs()` function to `workflow-runtime-token-usage.ts` — discovers session UUID from `debug/latest`, reads usage from session JSONL
2. Update `resolveClaudeSnapshot()` to try project-log discovery before falling back to telemetry-log discovery
3. Add parsing for session JSONL `usage` format (differs from `tengu_api_success` format)
4. Add fixture-based unit tests for the new discovery chain
5. Update skill docs and telemetry schema description to document the new auto-capture path

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: lp-do-analysis, lp-do-plan
- Deliverable acceptance package: token_measurement_coverage ≥ 90% on Claude-backed runs (up from 0%)
- Post-delivery measurement plan: run telemetry report after next few workflow executions; compare coverage

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Claude session discovery chain | Yes | None | No |
| Token data in session JSONL | Yes | None | No |
| Existing Codex pattern (parallel) | Yes | None | No |
| CWD-to-project-path encoding | Yes | None | No |
| Test landscape | Partial | No dedicated unit tests yet | No (test creation is part of implementation) |
| Prior art / design constraints | Yes | Prior non-goal based on wrong premise | No |

## Evidence Gap Review
### Gaps Addressed
- Confirmed `~/.claude/debug/latest` symlink exists and is reliable (direct filesystem check)
- Confirmed session JSONL contains `usage` with full token breakdown (parsed 194 messages)
- Confirmed CWD encoding matches expected pattern
- Confirmed telemetry directory does NOT have useful data (only failed events)

### Confidence Adjustments
- Implementation raised from 80% → 90% after verifying full discovery chain works
- Approach raised from 80% → 88% after confirming prior plan's non-goal was premise-based not risk-based

### Remaining Assumptions
- `debug/latest` convention is stable across Claude Code 2.1.x (high confidence, no changelog evidence of removal)
- Session JSONL `usage` format is stable (high confidence, matches Anthropic API response format)

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis do-workflow-claude-token-auto-capture`
