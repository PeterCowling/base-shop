---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-claude-token-auto-capture
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-analysis, lp-do-plan
Related-Fact-Find: docs/plans/do-workflow-claude-token-auto-capture/fact-find.md
Related-Plan: docs/plans/do-workflow-claude-token-auto-capture/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Claude Token Auto-Capture Analysis

## Decision Frame
### Summary
Choose how the workflow telemetry system discovers the current Claude Code session and reads its token usage, closing the ~50% measurement gap left by the prior plan's Codex-only auto-capture.

### Goals
- Auto-discover the current Claude session without operator-supplied session IDs
- Read per-message usage from session JSONL and produce cumulative snapshots
- Maintain fail-open semantics — unknown fallback when discovery fails

### Non-goals
- Changing the Codex auto-capture path
- Prompt-path instrumentation
- Separate subagent token tracking

### Constraints & Assumptions
- Constraints:
  - Must fail-open (null snapshot → `unknown` token source)
  - Must validate resolved paths start within `~/.claude/` (symlink escape prevention)
  - Session JSONL has per-message usage, not cumulative totals — requires full-scan summation
  - Explicit `--claude-session-id` must remain authoritative — auto-discovery must never override a deliberately supplied session ID
- Assumptions:
  - `~/.claude/debug/latest` symlink exists in Claude Code 2.1.49+ (verified)
  - Session JSONL `usage` format matches Anthropic API response shape (verified)
  - `sessions-index.json` contains structured entries with `sessionId`, `fullPath`, `fileMtime`, `projectPath` (verified: 285 entries)
  - This repo uses concurrent agents (AGENTS.md) — concurrency is realistic, not edge-case

## Inherited Outcome Contract
- **Why:** When the system runs work using Claude, it can't automatically track how much that work costs. This means about half of all workflow runs have a blind spot in cost reporting. Fixing this gives complete visibility into what each piece of work actually costs, making budget decisions accurate instead of estimated.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All workflow runs — regardless of provider — automatically capture and report token costs without manual intervention.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/do-workflow-claude-token-auto-capture/fact-find.md`
- Key findings used:
  - Discovery chain: `~/.claude/debug/latest` → session UUID → `~/.claude/projects/<encoded-cwd>/<uuid>.jsonl` → `usage` on assistant messages
  - Session JSONL has per-message usage (not cumulative) — differs from Codex format
  - CWD encoding: `cwd.replaceAll('/', '-')` (global replace, not single)
  - `~/.claude/telemetry/` contains only failed events — not useful for token capture
  - Concurrent sessions risk: `debug/latest` points to most-recent session globally
  - Existing `resolveClaudeSnapshot()` reads from telemetry logs with explicit session ID
  - `sessions-index.json` at `~/.claude/projects/<encoded-cwd>/sessions-index.json` is project-scoped with `fileMtime` for recency sorting

## Evaluation Criteria
| Criterion | Why it matters | Weight |
|---|---|---|
| Discovery reliability | Correct session must be identified; wrong session = wrong attribution | High |
| Fail-open safety | Must never block workflow on discovery failure | High |
| Concurrency correctness | Multi-agent repo means concurrent sessions are realistic — wrong attribution is a real risk | High |
| Backward compatibility | Existing explicit session ID path must remain authoritative | High |
| Code locality | Minimize blast radius; keep changes in one module | High |
| Performance | Large sessions (hundreds of messages) must not cause latency | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | **debug/latest symlink only** — resolve `~/.claude/debug/latest` to get session UUID, read session JSONL | Simplest — one symlink read. | Global scope — points to most-recent session across all projects. Under concurrent agents, may attribute tokens to wrong session. | Misattribution under multi-agent concurrency (which this repo uses). | Partially — insufficient alone |
| B | **sessions-index.json primary** — read project-scoped index, sort by `fileMtime`, take latest entry | Project-scoped — avoids global concurrency issue. Index has structured fields (`sessionId`, `fileMtime`, `projectPath`). | Index may lag behind real-time. Adds index format parsing. | Stale index → wrong session. But bounded — latest entry for this project is almost always correct. | Yes |
| A+B | **Hybrid: explicit ID → sessions-index → debug/latest → unknown** — layered cascade with explicit always authoritative | Best correctness: explicit ID wins when supplied; project-scoped index handles the common auto case; global symlink as last-resort heuristic. | More code than either alone. Two discovery sources to maintain. | Either source alone could fail, but cascade makes failure unlikely. | Yes — recommended |
| C | **Keep explicit session ID only** — no auto-discovery | Zero risk. Already working. | Leaves ~50% gap unresolved. | Status quo. | No — defeats the goal |

## Engineering Coverage Comparison
| Coverage Area | Option A (debug/latest only) | Option B (sessions-index primary) | Option A+B (hybrid cascade) | Chosen implication |
|---|---|---|---|---|
| UI / visual | N/A | N/A | N/A | N/A |
| UX / states | N/A | N/A | N/A | N/A |
| Security / privacy | Symlink escape risk without path validation | Index within `~/.claude/projects/`. Lower escape risk. | Both paths validated. Explicit ID bypasses discovery entirely. | Path boundary validation on all discovery paths |
| Logging / observability / audit | Closes gap. Provider = `"claude"`. | Same closure. | Same closure. Discovery source logged for debugging. | Record which discovery method succeeded |
| Testing / validation | Fixture: symlink + JSONL. | Fixture: index + JSONL. | Fixture: all three paths tested independently. More test code but better coverage. | Test each cascade layer independently |
| Data / contracts | New session JSONL parser (shared). | Same parser + index parser. | Same parser + index parser. Explicit ID path unchanged. | Session JSONL parser + lightweight index parser |
| Performance / reliability | One symlink read + one JSONL scan. | One index read + one JSONL scan. | Worst case: one index read fails, one symlink read fails, falls back to unknown. Bounded. | Cascade exits at first success — no wasted I/O |
| Rollout / rollback | Additive. | Additive. | Additive. Explicit ID always authoritative. No breaking change. | Fail-open at every layer |

## Chosen Approach
- **Recommendation:** Option A+B — Hybrid cascade: explicit ID → sessions-index → debug/latest → unknown
- **Why this wins:**
  - **Explicit ID stays authoritative** — when `--claude-session-id` or env var is supplied, auto-discovery is skipped entirely. This preserves backward compatibility and prevents heuristic discovery from overriding deliberate operator intent.
  - **Project-scoped discovery first** — sessions-index.json is scoped to the current project directory, avoiding the global `debug/latest` concurrency issue. This matters because the repo uses concurrent agents.
  - **Global fallback for robustness** — if sessions-index is stale or missing, `debug/latest` provides a best-effort heuristic. Wrong attribution in this fallback is better than no attribution at all.
  - **Fail-open at every layer** — if all discovery fails, returns `unknown` as before. No regressions.
  - **Incremental complexity** — the session JSONL parser is needed regardless of discovery method. The index parser is lightweight (read JSON, sort by mtime, take latest). The symlink reader is trivial.
- **What it depends on:**
  - `sessions-index.json` format remaining stable (currently: `{version, entries: [{sessionId, fullPath, fileMtime, ...}], originalPath}`)
  - `~/.claude/debug/latest` symlink convention remaining stable
  - Session JSONL `usage` format remaining stable (matches Anthropic API shape)

### Resolve Order (Authoritative)

```
1. Explicit session ID (env var / CLI flag)     → AUTHORITATIVE, skips all auto-discovery
2. sessions-index.json (project-scoped)         → PRIMARY auto-discovery
3. debug/latest symlink (global)                → FALLBACK heuristic
4. null → unknown token source                  → FAIL-OPEN default
```

### Rejected Approaches
- **Option A alone (debug/latest only)** — Global scope creates real misattribution risk under concurrent agents. Insufficient as the sole auto-discovery mechanism for a multi-agent repo.
- **Option B alone (sessions-index only)** — Could work, but lacks the global fallback for edge cases where the index is stale. The hybrid is strictly better for reliability.
- **Option C (explicit only)** — Defeats the goal. Perpetuates the ~50% coverage gap.

### Open Questions (Operator Input Required)
None — all design decisions resolved from evidence and effectiveness reasoning.

## Planning Handoff
- Planning focus:
  - Add session JSONL usage parser to `workflow-runtime-token-usage.ts` (per-message → cumulative snapshot)
  - Add sessions-index.json reader (project-scoped discovery — find latest session for CWD)
  - Add debug/latest symlink reader (global fallback — resolve symlink, extract UUID)
  - Update `resolveClaudeSnapshot()` with layered cascade: explicit ID → index → symlink → null
  - Add path boundary validation on all discovery paths (resolved path must start with `~/.claude/`)
  - Add fixture-based tests for each cascade layer independently
  - Update skill doc guidance to document new auto-capture behavior
- Validation implications:
  - `token_measurement_coverage` for Claude-backed runs should move from 0% toward 100%
  - Existing explicit-session tests must keep passing (backward compatibility)
  - New tests: index discovery, symlink discovery, JSONL parsing, path validation, cascade ordering
- Sequencing constraints:
  - Session JSONL parser first (shared by all discovery methods)
  - Index reader and symlink reader can be parallel
  - Cascade wiring after both readers exist
  - Tests alongside each component
- Risks to carry into planning:
  - Claude Code version changes to session storage format (fail-open mitigates)
  - Large session JSONL read performance (streaming sum mitigates — bounded by message count)

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| sessions-index.json format changes | Low | Medium | Internal Claude Code format | Graceful degradation; fall through to debug/latest |
| `debug/latest` convention changes | Low | Medium | Internal Claude Code format | Fall through to unknown; explicit ID always works |
| Session JSONL format changes | Low | Low | Matches stable Anthropic API format | Version-aware parsing with graceful degradation |
| Concurrent session misattribution via debug/latest | Medium | Low | Mitigated: debug/latest is only the tertiary fallback, not the primary discovery | sessions-index handles the common case correctly |
| Large session read latency | Medium | Low | Bounded by message count (hundreds) | Streaming line-by-line sum |

## Planning Readiness
- Status: Go
- Rationale: Hybrid approach addresses all critique findings (explicit ID authoritative, project-scoped primary discovery, concurrency-aware). All engineering coverage areas addressed. No open operator questions. Bounded scope (one module + tests). Fail-open safety at every cascade layer.
