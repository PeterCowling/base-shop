---
Type: Plan
Status: Active
Domain: DevEx/Tooling
Last-reviewed: 2026-01-20
Relates-to charter: none
Created: 2026-01-20
Created-by: Claude Opus 4.5
Last-updated: 2026-01-20
Last-updated-by: Claude Opus 4.5 (MVP implementation complete)
---

# Agent Enhancement Plan

## Summary

Unify and enhance agent configuration for both Claude Code and Codex (and future agents) based on insights from the "Flywheel" approach to agent tooling. The goal is to create agent-first tooling that enables recursive self-improvement, composable skills, and safe multi-agent orchestration.

## Motivation

Analysis of current agent configuration revealed:

| Aspect | Claude Code | Codex | Gap |
|--------|-------------|-------|-----|
| Project instructions | `CLAUDE.md` (comprehensive) | `CODEX.md` (thin overlay) | Codex relies heavily on shared docs |
| Safety hooks | 9 hooks in `.claude/settings.json` | None | **Codex has no guardrails** |
| Skills/Prompts | 12 implemented | References Claude's | Works but not agent-agnostic |
| Progressive disclosure | None | None | Everything dumped at once |
| Self-reflection | None | None | No learning mechanism |
| Orchestration | None | None | No multi-agent patterns |

Key insight from external research: **Tools should be agent-first** — designed for agents to use, with human convenience as secondary. Agents can improve the tools they use while using them (recursive self-improvement).

## Goals

1. **Maximum feasible safety alignment** — Codex gets equivalent safety documentation to Claude Code (enforcement is platform-limited; see Non-Goals)
2. **Unified skill system** — Agent-agnostic skills both can use equally
3. **Progressive disclosure** — Load context only when needed
4. **Reflection mechanism** — Agents can record learnings to improve skills (exploratory)
5. **Orchestration patterns** — Enable controller/worker multi-agent setups (exploratory)
6. **Codified reasoning** — Move critical rules from "agent memory" to reliable tooling

## Non-Goals

- Replacing Claude Code or Codex with custom tooling
- Building external orchestration infrastructure (like the "ntm" tool mentioned in research)
- Real-time agent monitoring dashboards
- Automated skill generation (agents suggest, humans approve)
- **MCP parity for Codex** — Codex runs via OpenAI's API and cannot access Claude Code's MCP servers. This is a platform limitation, not something we can solve with documentation. Codex workflows should not depend on MCP tools.

## Current State

### Claude Code Configuration
- `.claude/settings.json` — Hooks, MCP servers, permissions
- `.claude/prompts/*.md` — 12 skill templates
- `CLAUDE.md` — Project architecture and patterns
- `AGENTS.md` — Universal runbook (shared)

### Codex Configuration
- `CODEX.md` — Thin overlay for network/timeout handling
- References `AGENTS.md` and `.claude/prompts/`
- **No safety hooks** — Can run destructive commands
- **No MCP access** — Can't use project MCP tools

### Skill Inventory (Current)
```
.claude/prompts/
├── plan-feature.md           ✅ Core workflow
├── build-feature.md          ✅ Core workflow
├── create-ui-component.md    ✅ Component creation
├── add-component-tests.md    ✅ Testing
├── add-form-validation.md    ✅ Forms
├── add-e2e-test.md          ✅ E2E testing
├── create-server-action.md   ✅ Next.js
├── create-api-endpoint.md    ✅ API routes
├── create-prisma-model.md    ✅ Database
├── refactor-component.md     ✅ Refactoring
├── apply-design-system.md    ✅ Design tokens
└── migrate-to-app-router.md  ✅ Migration
```

## Critical Path (Execution Order)

Phases are thematic groupings; the critical path is the actual execution order accounting for dependencies:

| Step | Task | Depends On | Deliverable | Notes |
|------|------|------------|-------------|-------|
| CP1 | AGENT-00, AGENT-01 | — | Codex discovery + CODEX.md safety | **Can run in parallel** |
| CP2 | AGENT-03, 03b, 03c | AGENT-00 | `.agents/` directory + gitignore + config | |
| CP3 | AGENT-02 | AGENT-03 | Safety rationale document | |
| CP4 | AGENT-04, 04b | AGENT-03 | Manifest + CI validation | |
| CP5 | AGENT-05, 06 | AGENT-04 | Migrated skills + CODEX.md reference | |
| CP6 | AGENT-07, 08, 09 | AGENT-05 | Progressive disclosure | |
| CP7+ | Phases 4-6 | CP6 | Exploratory features | Includes AGENT-01b (optional) |

**MVP Slice** (minimum viable delivery): CP1 through CP5. This delivers safety parity and unified skills. CP6+ (progressive disclosure, reflection, orchestration) can be deferred.

## Active Tasks

### Phase 0: Validation (Prerequisites)

- [x] **AGENT-00**: Verify Codex file discovery behavior ✅ **PASSED**
  - **Performed by**: Human (manual Codex session)
  - **Test plan**:
    1. Create test file `.agents/test-discovery.md` with unique content
    2. Start Codex session in repo
    3. Ask Codex: "What is in .agents/test-discovery.md?"
    4. If Codex reads it unprompted or when asked → dotfolders work
    5. If Codex fails, try `agents/test-discovery.md` (non-hidden)
    6. Test `AGENTS.md` read: ask Codex to summarize it
  - **Findings (2026-01-20)**: Codex successfully read `.agents/test-discovery.md` and reported the unique identifier `AGENT-DISCOVERY-TEST-2026-01-20`. The `.agents/` hidden directory strategy is confirmed viable for both Claude Code and Codex.
  - Affects: Entire plan (blocking prerequisite) — **UNBLOCKED**

### Phase 1: Safety Alignment (Critical)

- [x] **AGENT-01**: Extend safety rules in CODEX.md (AGENTS.md already covers basics)
  - **Note**: AGENTS.md § "Git Rules → Destructive commands" already bans `git reset --hard`, `git clean -fd`, `git push --force`
  - This task adds **delta coverage only**:
    - Add "STOP and ask" protocol for dangerous operations to CODEX.md
    - Add Codex-specific reinforcement (since Codex lacks hooks)
    - Ensure CODEX.md references AGENTS.md safety rules explicitly
  - **Rule table to add** (commands, danger level, protocol):
    | Command/Pattern | Why Dangerous | Required Protocol | Enforcement |
    |-----------------|---------------|-------------------|-------------|
    | `git reset --hard` | Loses uncommitted work | STOP, ask user | Wrapper (01b) |
    | `git push --force` | Overwrites remote history | STOP, ask user | Wrapper (01b) |
    | `git clean -fd` | Deletes untracked files | STOP, ask user | Wrapper (01b) |
    | `rm -rf` on project dirs | Irreversible deletion | STOP, ask user | Doc only |
    | `pnpm test` (unfiltered) | Spawns too many workers | Use targeted tests | Doc only |
    | Modifying `main` branch | Protected branch | Work on `work/*` only | Doc only |
  - Affects: `CODEX.md` (AGENTS.md already sufficient for basic rules)
  - **Enforcement limitation**: Documentation cannot block commands like hooks can. Acceptance criteria is "agents are informed" not "agents are blocked." True enforcement requires wrapper scripts (see AGENT-01b).

- [x] **AGENT-02**: Add safety rationale to `.agents/safety/rationale.md`
  - Document WHY each safety rule exists
  - Include incident history (2026-01-14 reset --hard incident)
  - Provide safe alternatives for each blocked command
  - **Single location** — no separate `docs/agent-safety-rationale.md`
  - **Depends on**: AGENT-03 (Phase 2) — directory must exist first
  - **Phase ordering note**: This task is in Phase 1 conceptually but executes after AGENT-03. Start Phase 2's AGENT-03 first, then return to complete AGENT-02.
  - Affects: `.agents/safety/rationale.md` (new)

### Phase 2: Unified Skill System

**Note**: Phase 2 depends on AGENT-00 confirming Codex can read `.agents/`. If not, tasks must be revised.

- [x] **AGENT-03**: Create `.agents/` directory structure
  - Agent-agnostic location (not `.claude/`-specific)
  - Structure:
    ```
    .agents/
    ├── README.md
    ├── skills/
    │   ├── manifest.yaml
    │   ├── workflows/
    │   ├── components/
    │   ├── testing/
    │   └── domain/
    ├── safety/
    ├── orchestration/
    ├── learnings/           # gitignored except .gitkeep
    │   └── .gitkeep
    └── status/              # gitignored except .gitkeep
        └── .gitkeep
    ```
  - Affects: New directory tree

- [x] **AGENT-03b**: Define file policies for agent-generated content
  - **Committed (tracked in git)**:
    - `.agents/skills/**` — skill definitions
    - `.agents/safety/**` — safety rules and rationale
    - `.agents/orchestration/**` — patterns documentation
    - `.agents/README.md` — usage guide
  - **Gitignored (local-only, ephemeral)**:
    - `.agents/learnings/**` — session reflections (may contain sensitive task details)
    - `.agents/status/**` — worker status files (ephemeral coordination)
  - **Directory persistence**: Add `.gitkeep` files in `learnings/` and `status/`
    - Use negation pattern in `.gitignore` to track `.gitkeep` while ignoring other files:
      ```
      .agents/learnings/*
      !.agents/learnings/.gitkeep
      .agents/status/*
      !.agents/status/.gitkeep
      ```
  - **Retention policy**:
    - `learnings/` files: manual cleanup (no auto-delete; too complex to implement reliably)
    - `status/` files: manual cleanup after sessions
    - Document cleanup command in `.agents/README.md`
  - Add patterns to root `.gitignore` (not a separate `.agents/.gitignore`)
  - Affects: `.gitignore` (update), `.gitkeep` files

- [x] **AGENT-03c**: Update `.claude/config.json` context files
  - Add `.agents/README.md` to context files list
  - Add `.agents/skills/manifest.yaml` to context files list
  - **Scope decision**: Only auto-load README + manifest; individual skills loaded on-demand per Phase 3
  - Ensure Claude Code discovers the new skill location
  - Affects: `.claude/config.json`

- [x] **AGENT-04**: Create skill manifest with metadata
  - YAML manifest defining all skills
  - Include: name, path, load conditions, dependencies
  - Enable progressive disclosure (load on trigger)
  - Affects: `.agents/skills/manifest.yaml` (new)

- [x] **AGENT-04b**: Add manifest validation to CI
  - **Implementation**: Node script using `js-yaml`
  - **Prerequisite**: Verify `js-yaml` is available (`pnpm why js-yaml`); if not, add as devDependency to root
  - Validates manifest.yaml:
    - All referenced paths exist
    - No orphan skills (files in `skills/` not in manifest, excluding `TEMPLATE.md` and `README.md`)
    - YAML is valid
    - Required fields present (name, path, load)
  - **Exception handling**: stub files in `.claude/prompts/` are not errors
  - Add to existing CI workflow (`.github/workflows/ci.yml` exists)
  - Affects: `scripts/validate-agent-manifest.js` (new), `.github/workflows/ci.yml`

- [x] **AGENT-05**: Migrate core skills to `.agents/`
  - **Scope**: Migrate only core workflow skills first (`plan-feature.md`, `build-feature.md`)
  - **Remaining 10 skills**: Left in `.claude/prompts/` for now; migrate incrementally in follow-up tasks or leave in place if working
  - Update references in `AGENTS.md`, `CODEX.md`, `CLAUDE.md`
  - **Backward compatibility strategy (no symlinks)**:
    - Keep stub files in `.claude/prompts/` with this format:
      ```markdown
      # Moved

      This skill has moved to `.agents/skills/workflows/plan-feature.md`.

      Please read the new location.
      ```
    - Avoids symlink issues on Windows/CI environments
  - **README.md handling**: `.claude/prompts/README.md` stays in place (documents the prompts directory); add note about `.agents/` migration
  - Affects: Multiple files

- [x] **AGENT-06**: Add skill reference section to CODEX.md
  - Explicitly document that Codex can use skills
  - Show invocation syntax
  - List most useful skills for Codex workflows
  - Affects: `CODEX.md`

### Phase 3: Progressive Disclosure

- [x] **AGENT-07**: Implement trigger-based skill loading
  - Define triggers in manifest (error messages, keywords)
  - **Important**: Agents don't have regex engines; triggers are human-readable hints, not programmatic matchers
  - Document pattern for agents: "When you encounter error X, read skill Y"
  - Add trigger hints to AGENTS.md so agents know to check manifest
  - Example: Jest ESM errors → load `testing/jest-esm-issues.md`
  - Affects: `.agents/skills/manifest.yaml`, skill files, `AGENTS.md`

- [x] **AGENT-08**: Create troubleshooting skill tree
  - Extract troubleshooting from `CLAUDE.md` into discrete skills
  - Jest ESM/CJS issues → `testing/jest-esm-issues.md`
  - Git state confusion → `safety/git-recovery.md`
  - Dependency conflicts → `domain/dependency-conflicts.md`
  - Affects: New skill files

- [x] **AGENT-09**: Add "load more context" protocol to AGENTS.md
  - Document how agents should discover and load skills
  - Pattern: Check manifest → match triggers → read skill
  - Reduces initial context size
  - Affects: `AGENTS.md`

### Phase 4: Reflection Mechanism (Exploratory)

**Note**: This phase is exploratory. Value is uncertain until tested in practice.

- [x] **AGENT-10**: Create session reflection workflow
  - Skill template for end-of-session reflection
  - Questions: problems, patterns, skill gaps, tooling ideas
  - Output format: structured markdown in `.agents/learnings/`
  - Affects: `.agents/skills/workflows/session-reflection.md` (new)

- [x] **AGENT-11**: Initialize learnings directory
  - Directory: `.agents/learnings/` with `.gitkeep` only
  - **Note**: Template lives in `.agents/skills/workflows/session-reflection.md` (AGENT-10), not in learnings dir
  - **Rationale**: `learnings/` is gitignored for ephemeral outputs; tracked templates belong in `skills/`
  - Cleanup instructions in `.agents/README.md`
  - Affects: `.agents/learnings/.gitkeep`

- [x] **AGENT-12**: Add reflection prompt to AGENTS.md
  - Encourage agents to reflect after significant work
  - Link to reflection skill
  - Optional: suggest reflection at natural breakpoints
  - Affects: `AGENTS.md`

### Phase 5: Multi-Agent Orchestration (Exploratory)

**Note**: This phase is exploratory. Status file sharing only works when agents run on the same machine with access to the same filesystem. Remote/distributed orchestration is out of scope.

- [ ] **AGENT-13**: Document controller/worker pattern
  - Controller responsibilities (parse, assign, monitor, aggregate)
  - Worker responsibilities (scope, report, flag conflicts)
  - Communication protocol (assignment format, status format)
  - Affects: `.agents/orchestration/multi-agent-patterns.md` (new)

- [ ] **AGENT-14**: Add conflict prevention guidelines
  - File scope exclusivity rules
  - Shared resource locking patterns (TM, config files)
  - Contention detection and resolution
  - Affects: `.agents/orchestration/conflict-prevention.md` (new)

- [ ] **AGENT-15**: Create status reporting protocol
  - Worker status file format (`.agents/status/{worker-id}-{timestamp}.md`)
  - **Atomicity**: Use write-temp-then-rename to avoid partial writes
  - **Staleness**: Controller treats status older than 10 minutes as stale; reassigns task
  - **Collision handling**: If two workers claim same file, controller arbitrates
  - Controller aggregation pattern
  - Handoff protocol for session boundaries
  - Affects: `.agents/orchestration/status-protocol.md` (new)

### Phase 6: Codified Reasoning

- [x] **AGENT-16**: Expand safety rationale with non-git rules
  - **Note**: Git safety rationale is covered in AGENT-02 (Phase 1)
  - **Timing**: This task appends to the file created in AGENT-02; the file will exist but may be months old by Phase 6
  - This task adds non-git rules:
    - "Never run unfiltered pnpm test" → why, verification, alternatives
    - Layer hierarchy rules → why, detection, fixes
    - Import boundaries → why, detection, fixes
  - Affects: `.agents/safety/rationale.md` (append to AGENT-02's file)

- [x] **AGENT-17**: Create pre-action checklists
  - Before commit checklist
  - Before destructive command checklist
  - Before large refactor checklist
  - Affects: `.agents/safety/checklists.md` (new)

- [x] **AGENT-18**: Document domain skill extraction pattern
  - Create template for extracting domain knowledge from plan docs into skills
  - Pattern: plan doc → skill directory with README + sub-skills + troubleshooting
  - **Example extraction** (optional, demonstrates pattern):
    - Source: `content-translation-pipeline-plan.md`
    - Output: `.agents/skills/domain/translation/` with README, workstream docs, troubleshooting
  - The pattern is the deliverable; specific domain skills are optional follow-ups
  - Affects: `.agents/skills/domain/TEMPLATE.md` (new)

- [ ] **AGENT-01b**: Create wrapper script for destructive command protection (optional)
  - Shell wrapper that intercepts dangerous git commands (`reset --hard`, `push --force`, `clean -fd`)
  - Provides enforcement layer that documentation cannot
  - **Adoption mechanism** (best-effort):
    - If using devcontainers: bake into container image and PATH
    - If using bootstrap script: add shell init sourcing
    - Otherwise: document manual installation steps
  - **Scope**: Protects git history only; does not prevent `rm -rf` or other destructive edits (those are doc-only)
  - Affects: `scripts/agent-safety/git-wrapper.sh` (new, optional)
  - **Note**: Only useful if Codex environment allows PATH modification; deferred to Phase 6 as optional hardening

## Patterns to Follow

### Skill File Structure
```markdown
# Skill Name

## When to Use
Brief trigger description

## Prerequisites
- Required knowledge
- Required files/state

## Workflow
1. Step-by-step instructions
2. Commands to run
3. Validation checks

## Quality Checks
- [ ] Validation 1
- [ ] Validation 2

## Common Pitfalls
❌ Anti-pattern
✅ Correct pattern

## Related Skills
- Link to related skill
```

### Manifest Entry Structure
```yaml
- name: skill-name
  path: category/skill-name.md
  load: always | on-demand
  triggers:  # For on-demand skills
    - "error message pattern"
    - "keyword"
  depends_on:
    - other-skill
  provides:
    - capability
```

### Learning Entry Structure
```markdown
## Session: {ISO timestamp}
### Agent: {claude-code|codex}
### Task: {brief description}

### Problems Encountered
- Problem 1: {description}
  - Resolution: {what worked}
  - Skill gap: {what documentation was missing}

### Patterns That Worked
- Pattern 1: {description}

### Suggested Skill Updates
- Skill: {name}
  - Add: {content}
  - Reason: {why}

### Tooling Ideas
- Idea 1: {description}
  - Benefit: {why useful}
```

## Acceptance Criteria

### Phase 0 Complete When:
- [ ] Codex file discovery behavior is documented
- [ ] Decision made: proceed with `.agents/` or revise strategy

### Phase 1 Complete When:
- [ ] CODEX.md extended with "STOP and ask" protocol and explicit reference to AGENTS.md safety rules
- [ ] Safety rationale document (`.agents/safety/rationale.md`) explains WHY each rule exists
  - **Note**: AGENT-02 executes after AGENT-03 (Phase 2) due to directory dependency
- [ ] **Realistic expectation**: Agents are *informed* about dangerous commands; Claude Code *enforces* via hooks, Codex *relies on documentation* (no enforcement possible without wrapper scripts)

### Phase 2 Complete When:
- [ ] `.agents/` directory exists with defined structure
- [ ] Root `.gitignore` excludes `learnings/` and `status/` content (with negation for `.gitkeep`)
- [ ] `.gitkeep` files ensure directories exist on fresh clones
- [ ] `.claude/config.json` updated to include new paths
- [ ] Skill manifest lists all skills with metadata
- [ ] Manifest validation runs in CI (AGENT-04b)
- [ ] Core skills work from both Claude Code and Codex
- [ ] CODEX.md explicitly references skill system

### Phase 3 Complete When:
- [x] Manifest includes human-readable trigger hints for on-demand skills
- [x] AGENTS.md documents "check manifest when you encounter X" pattern
- [x] Troubleshooting content is extracted into discrete skills
- [x] Agents can discover skills via documented lookup pattern

### Phase 4 Complete When (Exploratory):
- [x] Reflection workflow skill exists and is documented
- [x] `.agents/learnings/` directory is initialized with `.gitkeep`
- [x] Cleanup instructions documented in `.agents/README.md`
- [ ] (Optional) At least one test reflection has been recorded to validate the workflow

### Phase 5 Complete When (Exploratory):
- [ ] Controller/worker pattern is documented
- [ ] Documentation explicitly states "same-machine only" limitation
- [ ] Conflict prevention guidelines exist
- [ ] Status reporting protocol is defined

### Phase 6 Complete When:
- [x] Non-git safety rules (test commands, layer hierarchy) added to rationale doc
- [x] Pre-action checklists exist
- [x] Domain skill extraction pattern/template is documented

## Success Metrics

How we know this plan is working (qualitative, assessed quarterly by **DevEx**):

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Safety incidents (destructive commands) | Unknown | 0 per quarter | Review incident reports, user-reported issues, PR audit trail (force pushes require admin override and are logged) |
| Skill reference rate | Unknown | Agents reference skills in commit messages or session logs | Spot-check 10 sessions per month |
| Codex/Claude parity | Codex lacks safety docs | Both have equivalent safety documentation | Diff AGENTS.md coverage |
| Troubleshooting efficiency | Ad-hoc | Agents find relevant skill within 2 turns | Spot-check sessions with errors |

**Owner**: DevEx reviews metrics quarterly and reports to team.

**Note**: These are directional indicators, not hard SLAs. The goal is improvement, not perfection.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Codex doesn't read `.agents/`** | AGENT-00 validates this before building infrastructure. Fallback: keep skills in repo root or embed in AGENTS.md. |
| Codex ignores CODEX.md safety rules | Add rules to AGENTS.md as backup; both agents read it. Accept that documentation cannot enforce like hooks. |
| Codex runs destructive command anyway | **Accepted risk** — documentation is best-effort. Optional wrapper scripts (AGENT-01b) provide enforcement if environment allows. |
| Skill migration breaks existing workflows | Use stub files in `.claude/prompts/` with redirect instructions (no symlinks — Windows/CI safe) |
| Manifest becomes stale | AGENT-04b adds CI validation; PRs fail if manifest references missing files |
| Learnings/status files cause git conflicts | Gitignored by AGENT-03b; ephemeral local-only files |
| Learnings accumulate indefinitely | Manual cleanup documented in README; no auto-delete (too complex) |
| Reflection becomes busywork | Make it optional; trigger on significant sessions only |
| Orchestration only works same-machine | Document limitation explicitly; don't promise distributed orchestration |
| Orchestration adds complexity | Document as optional; single-agent workflows still work |

## Rollback Plan

If the `.agents/` migration causes problems:

1. **Immediate**: Stub files in `.claude/prompts/` still work — agents can follow redirects or ignore them
2. **Short-term**: Restore **original** skill files (not stubs) to `.claude/prompts/` from git history
   - Use: `git checkout <commit-before-migration> -- .claude/prompts/plan-feature.md .claude/prompts/build-feature.md`
3. **Full rollback**:
   - `git rm -r .agents/`
   - Restore original `.claude/prompts/` files from commit before migration (replaces stubs with originals)
   - Revert changes to `AGENTS.md`, `CODEX.md`, `CLAUDE.md`, `.claude/config.json`
   - Remove AGENT-04b CI validation step

**Decision point**: If AGENT-00 reveals Codex cannot read `.agents/`, abort Phase 2+ and keep skills in `.claude/prompts/`. Safety rules (Phase 1) can still proceed in AGENTS.md.

## Notes

### Why `.agents/` Instead of `.claude/`?

The `.claude/` directory is Claude Code-specific. OpenAI's Codex may not read it reliably. A neutral `.agents/` directory:
- Signals agent-agnostic intent
- Works for future agents (Gemini-CLI, etc.)
- Separates concerns (Claude Code settings vs shared skills)

### Backward Compatibility

During migration:
1. Keep stub files in `.claude/prompts/` that redirect to `.agents/skills/`
   - Example stub content: `# Moved to .agents/skills/workflows/plan-feature.md`
2. Update documentation to reference new locations
3. Remove stubs after confirming both agents use `.agents/` paths reliably

**Why stubs instead of symlinks:**
- Symlinks don't work reliably on Windows
- Some CI environments don't preserve symlinks
- Stub files work everywhere and are self-documenting

### Recursive Self-Improvement

The ultimate goal is agents that can:
1. Identify gaps in their skills while working
2. Record learnings in structured format
3. Propose skill updates for human review
4. Apply approved updates to improve future sessions

This creates a flywheel: better skills → better work → better learnings → better skills.

---

## Decisions

| Decision | Choice | Rationale | Date | Owner |
|----------|--------|-----------|------|-------|
| Directory naming | `.agents/` (hidden) | Signals "tooling infrastructure" not user content; **confirmed viable** via AGENT-00 test (Codex reads hidden dotfolders) | 2026-01-20 | DevEx |
| Manifest runtime model | Catalog, not loader | Agents consult manifest manually; no automatic injection. Keeps system simple and debuggable. | 2026-01-20 | DevEx |
| Backward compat strategy | Stub files | Symlinks fail on Windows/CI; stubs are self-documenting and universally portable | 2026-01-20 | DevEx |
| Learnings location | Gitignored ephemeral | May contain sensitive task details; templates live in `skills/`, outputs live in `learnings/` | 2026-01-20 | DevEx |
| CI validator implementation | Node script (js-yaml) | Repo is Node-based; avoids shell dependency on yq; can reuse existing CI image | 2026-01-20 | DevEx |
| Wrapper script adoption | Best-effort | Codex environment may not allow PATH modification; document as optional hardening | 2026-01-20 | DevEx |
| Config auto-load scope | README + manifest only | Individual skills loaded on-demand; keeps initial context small | 2026-01-20 | DevEx |

**Pending decisions** (to be resolved during execution):
- ~~Whether `.agents/` should become `agents/` (non-hidden) based on AGENT-00 findings~~ → **RESOLVED**: Keep `.agents/` (hidden); Codex confirmed to read it successfully

---

## Governance

| Phase | Owner | Reviewers | Notes |
|-------|-------|-----------|-------|
| 0-2 (Core) | DevEx | Security (for safety rules) | Safety rules require Security sign-off |
| 3 (Progressive) | DevEx | — | Internal tooling |
| 4-6 (Exploratory) | DevEx | — | Defer until core is stable |

**Skill update process:**
1. Agent proposes update in session learnings (`.agents/learnings/`)
2. Human reviews and creates PR with proposed changes
3. PR requires DevEx approval for skill changes
4. Merged changes go live immediately

**Reflection redaction rules:**
- No customer data, secrets, tokens, API keys
- No internal URLs or incident identifiers
- No PII (names, emails, etc.)
- Sanitize before committing any learning to a PR

---

## Quick Reference

| Task ID | Description | Priority | Effort | Phase |
|---------|-------------|----------|--------|-------|
| AGENT-00 | Verify Codex file discovery | 🔴 Critical | Low | 0 |
| AGENT-01 | Extend CODEX.md safety (AGENTS.md has basics) | 🔴 Critical | Low | 1 |
| AGENT-02 | Safety rationale doc (depends on 03) | 🔴 Critical | Low | 1 |
| AGENT-03 | Create .agents/ structure | 🟡 High | Medium | 2 |
| AGENT-03b | File policies + .gitignore + .gitkeep | 🟡 High | Low | 2 |
| AGENT-03c | Update .claude/config.json | 🟡 High | Low | 2 |
| AGENT-04 | Skill manifest | 🟡 High | Medium | 2 |
| AGENT-04b | Manifest validation in CI (Node/js-yaml) | 🟡 High | Low | 2 |
| AGENT-05 | Migrate core skills (stub files) | 🟡 High | Medium | 2 |
| AGENT-06 | Codex skill reference | 🟡 High | Low | 2 |
| AGENT-07 | Trigger-based loading (human-readable) | 🟢 Medium | Medium | 3 |
| AGENT-08 | Troubleshooting skills | 🟢 Medium | Medium | 3 |
| AGENT-09 | Load more context protocol | 🟢 Medium | Low | 3 |
| AGENT-10 | Reflection workflow | 🟢 Medium | Low | 4 (exp) |
| AGENT-11 | Learnings directory | 🟢 Medium | Low | 4 (exp) |
| AGENT-12 | Reflection prompt | 🟢 Medium | Low | 4 (exp) |
| AGENT-13 | Controller/worker docs | 🔵 Lower | Medium | 5 (exp) |
| AGENT-14 | Conflict prevention | 🔵 Lower | Medium | 5 (exp) |
| AGENT-15 | Status protocol | 🔵 Lower | Medium | 5 (exp) |
| AGENT-16 | Expand rationale (non-git rules) | 🔵 Lower | Medium | 6 |
| AGENT-17 | Pre-action checklists | 🔵 Lower | Low | 6 |
| AGENT-18 | Domain skill extraction pattern | 🔵 Lower | Medium | 6 |
| AGENT-01b | Wrapper script for enforcement (optional) | 🔵 Lower | Medium | 6 |

**(exp)** = Exploratory phase; value uncertain until tested
