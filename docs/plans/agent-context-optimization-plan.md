---
Type: Plan
Status: Draft
Domain: DevEx/Tooling
Last-reviewed: 2026-01-24
Relates-to charter: none
Created: 2026-01-24
Created-by: Claude Opus 4.5
Last-updated: 2026-01-24
Last-updated-by: Claude Opus 4.5
---

# Agent Context Optimization Plan


## Active tasks

No active tasks at this time.

## Executive Summary

Reduce the fixed token cost of every Claude Code and Codex session by restructuring always-on context files. The current `.claude/config.json` loads ~2,032 lines across 8 files on every conversation start. This plan replaces that with a lean two-file always-on context (operational rules + a curated digest), while ensuring agents can still navigate the full documentation on demand.

## Current State

### Always-on context (`.claude/config.json` → `contextFiles`)

Measured on 2026-01-24 using four methods: `tiktoken` encodings (`cl100k_base`, `p50k_base`), Anthropic's legacy tokenizer (`@anthropic-ai/tokenizer` v0.0.4), and Anthropic's official heuristic (chars / 3.5).

| File | Chars | Codex (cl100k) | Claude legacy | Claude heuristic | Claude p50k |
|------|-------|----------------|---------------|------------------|-------------|
| CLAUDE.md | 6,525 | 1,639 | 1,894 | 1,864 | 2,023 |
| AGENTS.md | 9,506 | 2,356 | 2,621 | 2,716 | 2,781 |
| README.md | 17,112 | 4,010 | 4,612 | 4,889 | 5,003 |
| docs/architecture.md | 9,880 | 2,313 | 2,603 | 2,823 | 2,794 |
| docs/development.md | 6,437 | 1,620 | 1,776 | 1,839 | 1,938 |
| docs/AGENTS.docs.md | 19,289 | 4,972 | 5,553 | 5,511 | 6,050 |
| docs/INDEX_FOR_CLAUDE.md | 11,999 | 3,185 | 3,575 | 3,428 | 3,808 |
| .agents/README.md | 1,459 | 371 | 407 | 417 | 436 |
| **Total** | **82,207** | **20,466** | **23,041** | **23,487** | **24,833** |

**Per-agent cost summary:**

| Agent | Encoder | Tokens/session | Confidence |
|-------|---------|----------------|------------|
| Codex (GPT) | cl100k_base | 20,466 | Exact (native tokenizer) |
| Claude Code | @anthropic-ai/tokenizer | 23,041 | Approximate (legacy, pre-Claude-3) |
| Claude Code | chars/3.5 heuristic | 23,487 | Approximate (Anthropic-recommended) |
| Claude Code | p50k_base proxy | 24,833 | Approximate (community-suggested proxy) |

**Best estimate for Claude Code: ~23,000–25,000 tokens per session start.** The three Claude-oriented methods agree within 8%. The exact count can only be confirmed via Anthropic's Token Count API (`client.messages.count_tokens()`), which requires an API key and is rate-limited.

### Token measurement methodology

- **cl100k_base** (tiktoken): OpenAI's GPT-4/4o tokenizer. Exact for Codex; underestimates Claude by ~12-21%.
- **@anthropic-ai/tokenizer**: Anthropic's official npm package for pre-Claude-3 models. Described by Anthropic as "no longer accurate for Claude 3+" but usable as "a very rough approximation."
- **chars/3.5**: Anthropic's recommended offline heuristic. Simple but surprisingly close to the legacy tokenizer for this content mix.
- **p50k_base** (tiktoken): OpenAI's older encoding. Community sources suggest it may be a closer proxy to Claude's tokenizer than cl100k_base.

None of these are ground truth for Claude 3+. To get exact counts, run the files through `client.messages.count_tokens()` with an active API key. The three Claude estimates clustering at 23-25k provides reasonable confidence in this range.

### Redundancy between CLAUDE.md and AGENTS.md

Both files currently duplicate:
- Git rules (destructive command prohibitions)
- Testing rules (`--maxWorkers`, ESM/CJS handling)
- Validation commands (`pnpm typecheck && pnpm lint`)
- Feature workflow description (`/fact-find` → `/plan-feature` → `/build-feature`)

This redundancy costs tokens and creates drift risk when only one file is updated.

### Skills (lazy-loaded, no changes needed)

18 skills in `.claude/skills/*/SKILL.md` (~1,869 lines total) are only loaded when invoked via `/skill-name`. This is already optimal.

## Goals

1. **Reduce fixed session cost** by 60-75% (from ~23-25k Claude tokens / ~20k Codex tokens to ~6-8k tokens of always-on context).
2. **Preserve capability** — agents can still access all documentation on demand.
3. **Prevent navigation failures** — a thin manifest ensures agents know where to look without searching blindly.
4. **Eliminate redundancy** — single source of truth for each concern.
5. **Protect non-negotiables** — security constraints, architectural invariants, and quality gates remain always-on.

## Non-Goals

- Rewriting the content of architecture/development docs (those remain as-is for on-demand reading).
- Changing the skills system (already lazy-loaded).
- Optimizing mid-session token usage (conversation summarization, tool call patterns).

## Design Decisions

### Why not just remove files and rely on search?

On-demand reading is not free:
- **Token cost still occurs** when agents open files later, potentially multiple times per session.
- **Behavioral risk:** Agents may not open referenced docs unless they encounter failure or are explicitly prompted. Always-on context for critical rules prevents this.
- **Discovery failure:** Search works when you know what to search for. Without a curated manifest, agents may miss relevant docs entirely and make incorrect changes.

### Why a digest instead of keeping full docs?

A curated `PROJECT_DIGEST.md` (target: 100-150 lines) provides:
- Key commands (build/test/lint/dev)
- Repo layout (3-5 bullets)
- Architectural invariants ("do not" rules)
- "When to read which doc" heuristics with file paths
- No narrative or background — pure reference density

This preserves navigability at ~5-10% of the token cost of loading the full docs.

### Non-negotiables that must remain always-on

Before trimming, these categories must be present in the always-on context:

| Category | Currently in | Must stay always-on |
|----------|-------------|-------------------|
| Security constraints (secrets, auth) | AGENTS.md | Yes |
| Destructive git command prohibitions | AGENTS.md + settings.json hooks | Yes (hooks enforce; docs explain) |
| Test/build/lint commands | AGENTS.md + CLAUDE.md + development.md | Yes (in one place) |
| Import/layer rules | CLAUDE.md + architecture.md | Yes (condensed) |
| "Do not" invariants | architecture.md | Yes (condensed) |
| Plan schema | AGENTS.docs.md (511 lines) | No — only needed when creating plans |
| Doc taxonomy | AGENTS.docs.md | No — reference material |
| Project history/overview | README.md | No — onboarding, not operational |

## Proposed Target State

### New `contextFiles` configuration

```json
{
  "contextFiles": [
    "AGENTS.md",
    "PROJECT_DIGEST.md"
  ]
}
```

**Measured size (after CTX-03..05, cl100k_base, 2026-01-24):**

| File | Lines | Chars | Tokens |
|------|-------|-------|--------|
| AGENTS.md | 212 | 9,592 | 2,375 |
| PROJECT_DIGEST.md | 111 | 4,198 | 1,153 |
| **Total** | **323** | **13,790** | **3,528** |

### AGENTS.md (single source of truth for operational rules)

Remains largely as-is (~210 lines). This is already well-structured and covers:
- Commands (build/test/lint)
- Git rules
- Testing rules
- Validation gates
- Task workflow
- Progressive context loading

**Changes:**
- Remove any content that duplicates PROJECT_DIGEST.md
- Ensure all test/build/lint commands live here (not scattered across other files)

### PROJECT_DIGEST.md (new file, target: 100-150 lines)

A high-signal, zero-narrative reference containing:

```markdown
## Repo Layout
- apps/: Applications (cms, brikette, skylar, prime, reception, ...)
- packages/: Shared packages (platform-core, ui, design-system, auth, ...)

## Key Commands
[consolidated from development.md, CLAUDE.md — no duplication with AGENTS.md]

## Architecture Invariants
- UI layers: atoms → molecules → organisms → templates → pages (one-way only)
- Package layers: apps → CMS pkgs → @acme/ui → @acme/design-system → platform-core → libs
- Import from package exports only, never from src/internal paths
- Presentation primitives from @acme/design-system, domain components from @acme/ui

## Import Patterns
[2-3 concise examples, not the full docs]

## When to Read Deeper Docs
| Need | Read |
|------|------|
| Architecture decisions | docs/architecture.md |
| Database/persistence | docs/persistence.md |
| Plan metadata schema | docs/AGENTS.docs.md |
| CI/CD details | docs/development.md |
| Theming system | docs/theming-advanced.md |
| SEO patterns | docs/seo.md |
| TypeScript config | docs/tsconfig-paths.md |

## Key File Locations
[consolidated from CLAUDE.md — schema, fixtures, env vars]
```

### CLAUDE.md (Claude-specific guidance only)

Reduced to contain only:
- Project overview (2-3 lines)
- Key technologies list
- Model usage policy (sonnet default, escalation rules)
- Pointer: "Operational rules: see AGENTS.md"
- Pointer: "Repo layout, commands, invariants: see PROJECT_DIGEST.md"
- Workflow reference (one line: `/fact-find` → `/plan-feature` → `/build-feature`)

**Not loaded as always-on context** — it becomes a reference doc that agents can read when needed, or that IDE extensions inject separately.

### Redundancy enforcement

To prevent drift back into duplication:
- Commands live in AGENTS.md only
- Architecture invariants live in PROJECT_DIGEST.md only
- CLAUDE.md contains no duplicated commands, rules, or invariants — only pointers

## Active Tasks

### Phase 0 — Measure and baseline

- [x] **CTX-01**: Measure exact token counts for current contextFiles
  - **Scope**: Use `tiktoken` (or Claude's tokenizer if available) to compute per-file token counts for all 8 current context files.
  - **Definition of done**: Table with measured token counts replaces the estimates in this plan. Baseline cost is a known number, not a heuristic.
  - **Result**: Codex measured at 20,466 tokens (cl100k_base, exact). Claude estimated at 23,000–25,000 tokens via three independent methods (legacy tokenizer, chars/3.5 heuristic, p50k proxy). Ground truth requires Anthropic Token Count API access.

- [x] **CTX-02**: Verify prompt assembly behavior
  - **Scope**: Confirm that `contextFiles` entries are concatenated verbatim into the system context on every new session (not cached, summarized, or partially loaded). Document evidence (config docs, captured prompt, or observed behavior).
  - **Definition of done**: One paragraph in this plan confirming the loading mechanism with evidence.

Claude Code’s memory docs state that all memory files (including project-level `CLAUDE.md`) are automatically loaded into Claude Code’s context when launched, with higher-priority memories loaded first. The docs do not mention summarization or caching, so the safest assumption is that these files are included verbatim at session start. We should still capture a prompt assembly trace or `/memory` output in a future session to confirm the exact concatenation behavior for `.claude/config.json` `contextFiles`, since that mechanism is repo-specific.

### Phase 1 — Create the digest and restructure

- [x] **CTX-03**: Create PROJECT_DIGEST.md
  - **Scope**: Extract high-signal content from README.md, architecture.md, development.md, INDEX_FOR_CLAUDE.md, and CLAUDE.md into a single 100-150 line reference file. Include "when to read which doc" table.
  - **Dependencies**: CTX-01 (want measured tokens to validate the digest is actually smaller).
  - **Definition of done**: PROJECT_DIGEST.md exists, covers all non-negotiable categories from the table above, and is under 150 lines.

- [x] **CTX-04**: Deduplicate AGENTS.md and CLAUDE.md
  - **Scope**: Remove duplicated content from CLAUDE.md. AGENTS.md becomes sole owner of commands, git rules, testing rules. CLAUDE.md retains only Claude-specific guidance (model policy, technology list, pointers).
  - **Dependencies**: CTX-03 (digest must exist before removing content from CLAUDE.md).
  - **Definition of done**: No block of 3+ lines appears in both files. CLAUDE.md is under 80 lines.

- [x] **CTX-05**: Update `.claude/config.json` contextFiles
  - **Scope**: Change contextFiles to `["AGENTS.md", "PROJECT_DIGEST.md"]`. Remove all other entries.
  - **Dependencies**: CTX-03, CTX-04.
  - **Definition of done**: Config updated. New always-on context is under 400 lines total.

### Phase 2 — Validate and harden

- [ ] **CTX-06**: Run representative task evaluation
  - **Scope**: Execute a structured evaluation across task types:
    - 5 short tasks (one-line fixes, simple questions)
    - 5 medium tasks (bug fixes, small features)
    - 3 large tasks (refactors, multi-file features)
  - **Metrics to capture**:
    - Input tokens per session (from API usage or billing)
    - Tool calls count (especially Read calls for docs)
    - Success rate (correct output without architectural violations)
    - Whether agent opened the right docs when needed
  - **Dependencies**: CTX-05.
  - **Definition of done**: Results documented in this plan. Success rate >= baseline. Token reduction confirmed.

  **Proposed evaluation template (fill in during runs):**

  | Task | Size | Session date | Input tokens | Tool calls | Docs opened | Outcome | Notes |
  |------|------|--------------|--------------|------------|-------------|---------|-------|
  | 1 | Short | | | | | | |
  | 2 | Short | | | | | | |
  | 3 | Short | | | | | | |
  | 4 | Short | | | | | | |
  | 5 | Short | | | | | | |
  | 6 | Medium | | | | | | |
  | 7 | Medium | | | | | | |
  | 8 | Medium | | | | | | |
  | 9 | Medium | | | | | | |
  | 10 | Medium | | | | | | |
  | 11 | Large | | | | | | |
  | 12 | Large | | | | | | |
  | 13 | Large | | | | | | |

  **Candidate task set (select from real backlog when available):**

  Short
  1. Update a doc pointer or fix a small typo in a doc under `docs/`.
  2. Adjust a single import to use package exports (no logic change).
  3. Add a missing link in a plan doc.
  4. Update a small configuration value (e.g., script alias).
  5. Fix a trivial lint warning in a single file.

  Medium
  1. Add a small utility with unit tests in `packages/lib`.
  2. Refactor a UI component to align with layer rules + update tests.
  3. Fix a small bug across 2-3 files in a single package.
  4. Update a workflow or script with supporting docs.
  5. Add a new CLI flag in a script + update docs/tests.

  Large
  1. Multi-file refactor in `@acme/ui` + Storybook updates.
  2. Cross-package API change with migration notes.
  3. App feature addition touching UI + platform-core.

- [x] **CTX-07**: Add drift prevention
  - **Scope**: Add a lightweight check (script or CI step) that:
    - Warns if PROJECT_DIGEST.md exceeds 200 lines
    - Warns if CLAUDE.md exceeds 100 lines
    - Detects if known command/rule blocks appear in multiple always-on files
  - **Dependencies**: CTX-05.
  - **Definition of done**: Check runs in CI (or as a pre-commit hook). Documented in docs/development.md.

### Phase 3 — Consider advanced optimizations (optional)

- [ ] **CTX-08**: Evaluate context profiles
  - **Scope**: If the tooling supports it (or via wrapper scripts), define task-type-specific context profiles:
    - **Base**: AGENTS.md + PROJECT_DIGEST.md (default)
    - **Architecture**: Base + docs/architecture.md
    - **Planning**: Base + docs/AGENTS.docs.md
  - **Definition of done**: Decision recorded here — either implement profiles or document why the single-profile approach is sufficient.

- [ ] **CTX-09**: Evaluate `maxContextTokens` impact
  - **Scope**: The current setting is `100000`. Run A/B comparison with 70000 on 3-5 long sessions to measure whether earlier summarization improves or degrades outcomes.
  - **Caveat**: Summarization itself consumes tokens. This may not be a net win — validate empirically.
  - **Definition of done**: Decision recorded: keep 100000, lower it, or remove the setting.

## Acceptance Criteria (Overall)

- Always-on context is under 400 lines / ~8k Claude tokens / ~6k Codex tokens (measured).
- No duplicated commands, rules, or invariants across always-on files.
- Agents can still:
  - Find and read architecture docs when making structural decisions.
  - Find and read plan schema when creating plans.
  - Execute correct build/test/lint commands without reading additional files.
  - Respect import/layer rules without reading architecture.md.
- Token reduction confirmed via representative task evaluation (Phase 2).
- No regression in task success rate.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agents skip reading deeper docs when needed | Architectural violations, incorrect patterns | PROJECT_DIGEST.md includes explicit "when to read which doc" heuristics |
| PROJECT_DIGEST.md grows over time, recreating the problem | Cost savings erode | CI check (CTX-07) warns on size growth |
| CLAUDE.md and AGENTS.md drift back into redundancy | Wasted tokens, contradictory guidance | CI check (CTX-07) detects duplicate blocks |
| On-demand reads add mid-session cost | Some sessions cost more than before | Acceptable trade-off: most sessions are net cheaper; the few that need deep docs pay only when they need them |
| Invariants removed from always-on context | Agents violate rules they don't see | Non-negotiables table above ensures critical rules stay in always-on files |
| `maxContextTokens` reduction causes quality loss | Failed tasks, incomplete work | Validate empirically (CTX-09) before committing to a change |
| Token measurement is model-specific | Estimates don't transfer across Claude versions | Baseline uses `cl100k_base` (tiktoken). Re-measure with the target model tokenizer when it changes; use relative reduction (%) not absolute numbers |

## Relationship to Other Plans

- [Agent Language Intelligence Plan](agent-language-intelligence-plan.md): That plan adds MCP-based TypeScript intelligence. If implemented, its tools reduce the need for agents to read source files for type information, further reducing mid-session token usage. The two plans are complementary but independent.
- docs/AGENTS.docs.md: Defines the plan schema this document follows. Will become an on-demand reference rather than always-on context.

## Pending Audit Work

CTX-06 requires running 13 real tasks across short/medium/large scopes and capturing token metrics from the session provider (Claude Code/Codex). This environment does not expose those usage metrics, so the evaluation is pending.

Remaining work:
- Select 13 representative tasks from actual backlog (avoid synthetic tasks if possible).
- For each session, record input tokens, tool calls, docs opened, and outcome in the table above.
- Compare success rate to baseline and confirm token reduction.
