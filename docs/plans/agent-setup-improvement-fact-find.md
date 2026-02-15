---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: DevEx/Tooling
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-15
Feature-Slug: agent-setup-improvement
Deliverable-Type: code-change
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: (not yet created)
Supersedes: docs/plans/archive/agent-enhancement-plan-archived-2026-02-14.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: (pending — BOS_AGENT_API_BASE_URL not set; create manually or re-run with env)
---

# Agent Setup Improvement — Fact-Find Brief

## Scope

### Summary

Audit the current multi-agent configuration in Base-Shop and identify concrete improvements to achieve three goals: reduce context bloat, improve agent reliability, and simplify configuration sprawl — all while maintaining parity across agents (Claude Code, Codex, and future agents). This supersedes the stale `agent-enhancement-plan.md` (2026-01-20), whose core premise (migrating skills to `.agents/skills/`) was never executed.

### Goals

- **Multi-agent parity**: Any agent should have an equivalent experience — same safety enforcement, same skill access, same workflow
- **Reduce context bloat**: Minimize always-loaded tokens; load on-demand
- **Simplify config**: Fewer places to maintain the same information
- **Improve reliability**: Agents make fewer mistakes by having clearer, non-duplicated guidance

### Non-goals

- Building custom agent orchestration infrastructure
- Real-time monitoring dashboards
- Changing which agents are used (that's user choice)
- Redesigning the skill content itself (only the discovery/loading mechanism)

### Constraints & Assumptions

- Constraints:
  - Must work for Claude Code (primary), Codex (active), and future agents (Gemini-CLI, Cursor, Aider)
  - Each agent platform has different capabilities (hooks, MCP, auto-discovery) — parity must be achieved at the right abstraction level
  - No breaking changes to current workflows during transition
  - Safety enforcement is non-negotiable
- Assumptions:
  - User will continue operating 2+ agents concurrently
  - All agents can read markdown files from the repo
  - Agent-specific hooks/permissions are platform features, not things we can standardize


### Definitions (Operational)

- **Context bloat**: startup prompt tokens that are always-loaded before any task-specific context is fetched.
- **Always-loaded**: loaded by platform/config automatically at agent session start (not "commonly copy/pasted").
- **Parity (repo-level)**: parity in safety + workflow at the repository abstraction level, not parity in platform features (MCP, hooks, subagents).

### Parity Rubric (Plan Target)

- **Hard safety enforcement**: available by default for Claude Code; available for Codex and future agents via one documented command (`scripts/agents/integrator-shell.sh -- <agent>`).
- **Skill discovery**: a single documented command prints the skill registry for any agent (no memorizing paths).
- **Onboarding**: adding a new agent platform requires editing **<=3 files** (overlay + capability profile + optional config hook) and **no policy duplication**.

### Known Inconsistencies / Uncertainties (Resolve Early)

- Skill count evidence is inconsistent: this doc says "49 skills" (verified by `find .claude/skills -name SKILL.md | wc -l`), but elsewhere this brief implied "40" without a reliable source.
- "Always-loaded" is currently measured in lines/bytes, not prompt tokens, and mixes platform auto-load vs config load vs habitual copy/paste.
- Codex context loading is uncertain: it is **unclear whether** `PROJECT_DIGEST.md` is actually loaded for Codex sessions in practice.


## Evidence Audit (Current State)

### Agent Configuration Landscape

| File/Location | Scope | Lines | Bytes | Always-loaded? | Agent |
|---|---|---|---|---|---|
| `CLAUDE.md` | Claude Code overlay | 73 | 2,712 | Yes (Claude) | Claude Code |
| `CODEX.md` | Codex overlay | 256 | 11,331 | Yes (Codex) | Codex |
| `AGENTS.md` | Universal runbook | 313 | 18,779 | Yes (both, via config) | All |
| `PROJECT_DIGEST.md` | Repo layout/invariants | 110 | 4,222 | Yes (both, via config) | All |
| `.agents/README.md` | Agent directory guide | 48 | 1,672 | No | All |
| `.agents/safety/rationale.md` | Safety rule explanations | 269 | 9,187 | No | All |
| `.agents/safety/checklists.md` | Pre-action checklists | 150 | 5,215 | No | All |
| `docs/agents/feature-workflow-guide.md` | Workflow entrypoint | 106 | 4,878 | No | All |
| `docs/git-safety.md` | Git safety source of truth | 279 | 8,919 | No | All |
| `.claude/settings.json` | Hooks + permissions | 126 | 3,632 | Yes (Claude) | Claude Code |
| `.claude/config.json` | Context files + ignores | 21 | 391 | Yes (Claude) | Claude Code |
| **Total always-loaded** | | **~900** | **~41KB** | | |

**Note:** lines/bytes are a weak proxy for what matters (startup prompt tokens). Token baselines should be measured per agent (Claude Code vs Codex) and tracked as a regression metric.

### Skills System

- **Location**: `.claude/skills/*/SKILL.md` (49 skills, 17,563 total lines)
- **Shared helpers**: `.claude/skills/_shared/` (27 files, 8,761 lines)
- **Loading mechanism**:
  - Claude Code: auto-discovered via system; invoked with `/skill-name`
  - Codex: must read `.claude/skills/<name>/SKILL.md` directly by path
  - Other agents: no standard discovery mechanism
- **Largest skills** (top 5 by lines):
  - `ideas-go-faster` — 1,289 lines
  - `idea-generate` — 1,289 lines
  - `lp-fact-find` — 1,032 lines
  - `lp-plan` — 1,017 lines
  - `lp-seo` — 920 lines

### Safety Enforcement Architecture

Safety rules are defined in `docs/git-safety.md` (source of truth) and enforced at **multiple layers**:

| Layer | Mechanism | Agent Coverage | Enforcement Type |
|---|---|---|---|
| 1. PATH shim | `scripts/agent-bin/git` (338 lines) | Claude Code (via session-start hook) + Codex (via integrator-shell) | **Hard block** — command denied at shell level |
| 2. Pre-tool hook | `.claude/hooks/pre-tool-use-git-safety.sh` (241 lines) | Claude Code only | **Hard block** — tool call rejected |
| 3. Permission deny list | `.claude/settings.json` deny array (34 patterns) | Claude Code only | **Hard block** — tool call denied |
| 4. Documentation | `AGENTS.md`, `CODEX.md`, `.agents/safety/rationale.md` | All | **Soft** — relies on agent compliance |
| 5. Checklists | `.agents/safety/checklists.md` | All | **Soft** — optional reference |

**Key finding**: Layers 1-3 duplicate the same rule set in 3 different formats (bash regex, bash patterns, glob patterns). Layer 4-5 duplicate it again in prose. The source of truth (`docs/git-safety.md`) is mentioned in comments but no generation/sync mechanism exists.

### Agent Parity Gap Analysis

| Capability | Claude Code | Codex | Gap |
|---|---|---|---|
| **Safety enforcement (hard)** | 3 layers (hook + permissions + PATH shim) | 1 layer (PATH shim via integrator-shell) | Codex only gets hard enforcement when user remembers to use integrator-shell |
| **Skill discovery** | Auto-discovered; `/slash-command` invocation | Must know path; reads `.claude/skills/<name>/SKILL.md` | Codex has no discovery — must memorize or be told |
| **Context loading** | `CLAUDE.md` + `AGENTS.md` + `PROJECT_DIGEST.md` auto-loaded | `CODEX.md` + `AGENTS.md` (must reference explicitly) | Different overlay docs; unclear if PROJECT_DIGEST.md loads for Codex |
| **MCP tools** | Available (TypeScript intelligence, IDE diagnostics) | Not available | Platform limitation — cannot fix |
| **Writer lock** | Available via hooks and scripts | Available via integrator-shell | Parity achieved |
| **Subagent spawning** | Task tool with agent types | Limited (depends on Codex capabilities) | Platform limitation |
| **Session hooks** | `session-start.sh` sets up PATH shim automatically | No equivalent | Must manually run integrator-shell |

### What's Working Well

1. **`AGENTS.md` as shared backbone** — single universal runbook, read by all agents
2. **Agent-agnostic scripts** — `scripts/agents/integrator-shell.sh`, `scripts/agents/with-writer-lock.sh`, `scripts/agents/with-git-guard.sh` work for any agent
3. **PATH-level safety shims** — `scripts/agent-bin/git` is the strongest enforcement layer and is agent-agnostic
4. **Feature workflow guide** — `docs/agents/feature-workflow-guide.md` is clean, short, shared
5. **CODEX.md safety section** — comprehensive with examples and hand-off protocol
6. **Skill depth** — 49 skills covering code, business, and workflow tasks

### What's Not Working

1. **Safety rule duplication (8 locations)**: Same rules expressed in `docs/git-safety.md`, `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/agent-bin/git`, `.claude/settings.json` deny list, `AGENTS.md`, `CODEX.md`, `.agents/safety/rationale.md`, `.agents/safety/checklists.md`. No sync mechanism. Drift is inevitable.

2. **`.agents/` directory is half-built**: Only `safety/`, `learnings/.gitkeep`, `status/.gitkeep`, `private/`, `pre_rollback_reports/` exist. Planned `skills/`, `orchestration/` directories were never created. README reflects the abandoned plan.

3. **Dead infrastructure**:
   - `.claude/SKILLS_INDEX.md` appears stale and references skill paths that no longer exist (e.g. `.claude/skills/fact-find/SKILL.md`) — concrete evidence of documentation drift
   - `scripts/validate-agent-manifest.js` is a stub (prints "PASS", exits) — CI runs it but it validates nothing
   - `.agents/learnings/` is deprecated per README — use `/meta-reflect` instead
   - `.agents/status/` is empty — no orchestration protocol was ever built

4. **Skill discovery is Claude Code-specific**: The `.claude/skills/` path convention works for Claude Code (auto-discovery) but is opaque to other agents. CODEX.md lists 12 skills manually; the other 37 are effectively invisible to Codex.

5. **CODEX.md is 3.5x larger than CLAUDE.md** (256 vs 73 lines): Because Codex lacks hooks, it duplicates safety rules inline + includes full workflow documentation. This bloats Codex's always-loaded context.

6. **No agent capability detection**: No standard way for an agent to know what it can do (network? MCP? hooks? subagents?). CODEX.md has manual network detection but this is ad-hoc.

7. **Overlay maintenance burden**: Adding a new agent means creating a new `<AGENT>.md` overlay, manually copying safety rules, manually listing available skills, and hoping it stays in sync.

### `.agents/` Directory — Actual vs Planned State

```
.agents/
├── README.md                    # Exists (says skills are in .claude/skills/)
├── safety/
│   ├── rationale.md             # Exists, comprehensive (269 lines)
│   └── checklists.md            # Exists, comprehensive (150 lines)
├── learnings/.gitkeep           # Exists but DEPRECATED
├── status/.gitkeep              # Exists, unused
├── private/                     # Gitignored, exists (email samples, patches)
├── pre_rollback_reports/        # Gitignored, exists (incident recovery data)
├── skills/                      # NEVER CREATED
└── orchestration/               # NEVER CREATED
```

### Dependency & Impact Map

- Upstream dependencies:
  - Agent platform capabilities (Claude Code hooks, Codex sandbox, etc.)
  - Git hooks infrastructure (`simple-git-hooks` in package.json)
  - CI workflow (`.github/workflows/ci.yml`)
- Downstream dependents:
  - All agent sessions (every conversation loads these files)
  - Feature workflow (lp-fact-find → plan → build → lp-replan)
  - Business OS integration (card/stage-doc operations)
  - Guide translation workflow
- Likely blast radius:
  - Changes to AGENTS.md affect ALL agents immediately
  - Changes to CLAUDE.md affect Claude Code only
  - Changes to skills affect only sessions that invoke that skill
  - Changes to safety enforcement must be consistent across all layers

### Test Landscape

#### Test Infrastructure
- No tests exist for agent configuration correctness
- `scripts/validate-agent-manifest.js` is a no-op stub
- CI runs the stub but validates nothing

#### Coverage Gaps
- No validation that safety rules are consistent across locations
- No validation that skill file cross-references resolve
- No validation that agent overlays are complete/consistent
- No test that PATH shim + hook + permissions all agree

#### Recommended Test Approach
- **Lint/validation script**: Check consistency of safety rules across all locations (generate from single source)
- **Skill integrity**: Validate all SKILL.md files have required frontmatter, referenced files exist
- **Cross-reference check**: All doc links (e.g., `docs/git-safety.md`) resolve

### Recent Git History (Targeted)

- `.claude/hooks/` — Last modified 2026-02-11 (session-start.sh, git-safety hook)
- `scripts/agent-bin/git` — Last modified 2026-02-11 (comprehensive safety wrapper)
- `AGENTS.md` — Last modified 2026-02-14 (active maintenance)
- `CODEX.md` — Last modified 2026-02-12
- `.agents/safety/` — Created as part of original agent-enhancement-plan; comprehensive content
- `scripts/validate-agent-manifest.js` — Stub since creation; never implemented

## Questions

### Resolved

- Q: Should skills migrate from `.claude/skills/` to `.agents/skills/`?
  - A: **No.** The original plan proposed this (AGENT-05) but it was never executed. Claude Code auto-discovers `.claude/skills/` — moving them breaks this. The parity problem should be solved differently (e.g., skill registry that any agent can read, or standardized frontmatter).
  - Evidence: `.agents/README.md` says skills live in `.claude/skills/` (no count). Repo audit shows **49** skills at `.claude/skills/*/SKILL.md`.

- Q: Is the `.agents/` directory still valuable?
  - A: **Partially.** The `safety/` subdirectory has valuable content (rationale.md, checklists.md). The `learnings/`, `status/`, and planned `skills/` directories are dead weight. The `private/` and `pre_rollback_reports/` directories serve real operational purposes but weren't in the original plan.
  - Evidence: `.agents/README.md` marks learnings as DEPRECATED; status is empty.

- Q: What is the actual source of truth for safety rules?
  - A: `docs/git-safety.md` (per comments in both `pre-tool-use-git-safety.sh` line 2 and `scripts/agent-bin/git` line 8). But no generation pipeline enforces consistency.
  - Evidence: Both scripts say "Source of truth: docs/git-safety.md § Command Policy Matrix"

- Q: How many locations state safety rules?
  - A: **8 locations** with varying formats and levels of detail. See "Safety Rule Duplication" in the What's Not Working section.

- Q: Can the PATH shim approach provide universal hard enforcement?
  - A: **Yes, if agents use integrator-shell.** Claude Code gets it automatically via session-start hook. Codex gets it when launched via `scripts/agents/integrator-shell.sh -- codex`. Any future agent can use the same script.
  - Evidence: `scripts/agents/integrator-shell.sh` is agent-agnostic.

### Open (User Input Needed)

- Q: Should we invest in making `.agents/` the canonical shared location, or consolidate everything into fewer root-level files?
  - Why it matters: Determines whether to clean up `.agents/` (remove dead directories) or build it out
  - Default recommendation: Use `.agents/` for agent-agnostic registries/policy kernels, keep `.claude/` platform-specific. This avoids future tool dotdir visibility issues without moving skills.

- Q: Is reducing CODEX.md's size (256 lines) a priority, or is the current approach of inline safety rules acceptable?
  - Why it matters: Codex loads this every session; 11KB of always-loaded context vs. Claude's 2.7KB
  - Default recommendation: Reduce CODEX.md, but retain a non-negotiable safety TL;DR + explicit integrator-shell requirement + pointer to the canonical safety doc/kernel.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 85%
  - Strong: all config files, scripts, and conventions are well-understood from this audit
  - Gap: unclear how different agent platforms handle context file loading (need to test Gemini-CLI, Cursor, etc.)

- **Approach:** 70%
  - Strong: the problems are clear (duplication, sprawl, parity gaps)
  - Gap: multiple valid approaches for each problem; user preferences needed on consolidation vs. `.agents/` investment
  - What would raise to 80%+: answer the two open questions above

- **Impact:** 80%
  - Strong: changes are to documentation/config, not production code; blast radius is agent experience only
  - Gap: risk of breaking Codex workflows if safety rules move out of CODEX.md

- **Delivery-Readiness:** 85%
  - Owner: DevEx
  - Quality gate: All agents can run equivalent safety checks and discover skills
  - Deployment: commit to dev, no production deploy needed

- **Testability:** 60%
  - No test infrastructure exists for agent config validation
  - Would improve: a script that checks safety rule consistency, skill integrity, cross-references
  - What would raise to 80%+: build the validation script (replaces the current stub)

## Planning Constraints & Notes

- Must-follow patterns:
  - `docs/git-safety.md` remains the single source of truth for safety rules
  - Recommendation for durability: embed a fenced **machine-readable policy kernel** (YAML/JSON) inside `docs/git-safety.md`, and generate enforcement-layer artifacts from that kernel
  - Skills stay in `.claude/skills/` (Claude Code auto-discovery depends on this)
  - `AGENTS.md` remains the shared universal runbook
  - Any new shared mechanism must be agent-agnostic (no platform-specific features)
- Rollout/rollback expectations:
  - Changes can be incremental — no big-bang migration required
  - Each change should be independently valuable and independently revertible
- Observability expectations:
  - Agent sessions should show clearer error messages when safety rules trigger
  - Validation script should run in CI and catch drift

## Suggested Task Seeds (Non-binding)

1. **Safety policy kernel + generator (not validator-only)**: Define a stable machine-readable policy kernel (YAML/JSON) inside `docs/git-safety.md`, then generate the enforcement-layer rule data from it. Prefer generating small data includes (or clearly delimited sections) consumed by: `scripts/agent-bin/git`, `.claude/hooks/pre-tool-use-git-safety.sh`, and `.claude/settings.json` deny patterns.

2. **Measure startup prompt tokens per agent**: Add a baseline metric for "startup prompt tokens" (Claude Code vs Codex) with "required" vs "optional" context classification. Use it as a regression check (even approximate is better than bytes).

3. **Replace validation stub (top-3)**: Implement `scripts/validate-agent-manifest.js` (rename to `scripts/validate-agent-config.js`) to fail CI when: (a) safety policy kernel does not parse, (b) regenerated enforcement artifacts differ from committed outputs, (c) skill registry generation differs from committed registry, (d) critical cross-refs resolve (e.g. links to `docs/git-safety.md`, `scripts/agents/integrator-shell.sh`).

4. **Skill registry (generated, not hand-maintained)**: Generate a registry by scanning `.claude/skills/**/SKILL.md` frontmatter (`name`, `description`, optional `allowed-tools`, etc.). Emit an agent-agnostic registry (recommended location: `.agents/registry/skills.json`) plus a single command like `scripts/agents/list-skills` that prints it.

5. **Reduce CODEX.md by extraction, but keep a safety TL;DR**: Keep CODEX.md as a thin operational overlay with (a) non-negotiable safety TL;DR, (b) explicit integrator-shell requirement, (c) links to canonical docs/kernel. Remove duplicated long-form matrices once hard enforcement + validation are in place.

6. **Repurpose `.agents/` instead of deleting it**: Keep `.agents/safety/` as-is; remove true dead placeholders only if they cause confusion. Use `.agents/` as the home for agent-agnostic registries and policy kernels while keeping `.claude/` platform-specific.

7. **Agent capability profiles (narrow, declarative)**: Start with static `.agents/capabilities/<platform>.yaml` describing only fields that actually drive instructions/conditional behavior (hooks, MCP, network, subagents). Avoid modeling internals we can't detect or enforce.

8. **Unified agent onboarding (composition-only)**: A single onboarding doc that is short steps + links to canonical docs, with no policy duplication.

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: none (all tasks are config/documentation changes)
- Deliverable acceptance package:
  - Safety rules are derived from single source (no manual sync)
  - Skill registry exists and is validated in CI
  - Agent overlay docs are proportionally sized (no 3.5x disparity)
  - Dead infrastructure is cleaned up
  - Validation script runs real checks in CI
- Post-delivery measurement plan:
  - Spot-check: agents reference skills and follow safety rules consistently
  - CI: validation catches drift before merge
  - Maintenance: overlay docs are easier to update (fewer locations)

## Planning Readiness

- Status: **Ready-for-planning** (with 2 non-blocking open questions)
- Blocking items: none (open questions have safe defaults)
- Recommended next step: Proceed to `/lp-plan` — the open questions can be resolved during planning with user input
