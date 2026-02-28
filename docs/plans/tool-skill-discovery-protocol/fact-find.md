---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: tool-skill-discovery-protocol
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/tool-skill-discovery-protocol/plan.md
Dispatch-ID: IDEA-DISPATCH-20260227-0055
Trigger-Source: docs/business-os/startup-loop/ideas/trial/queue-state.json
---

# Tool Skill Discovery Protocol — Fact-Find Brief

## Scope

### Summary

Five `tool-` / `tools-` prefixed skills exist in `.claude/skills/` (four with a `tools-` or `tool-` directory prefix plus `frontend-design/` which has a `tools-ui-frontend-design` invocation name). Two of the five are listed in AGENTS.md; three are absent. No index or manifest lets an agent find all available tool skills without scanning the directory. There is no guidance in CLAUDE.md or AGENTS.md on when to look for a tool skill versus an `lp-*` skill. One skill (`tools-web-breakpoint/`) has a directory name that differs from its SKILL.md frontmatter `name` (`tools-ui-breakpoint-sweep`), creating an invocation ambiguity. This fact-find determines what must be built to close these gaps: a naming convention, a required SKILL.md metadata format, an index file, pointer language in AGENTS.md, and decision criteria for when to create a tool skill versus a startup-loop skill.

### Goals

- Define the canonical naming convention for tool skills (prefix, casing, location)
- Define the required SKILL.md frontmatter and top-of-file metadata for token-efficient agent discovery
- Determine whether a lightweight index file should exist (and if so, where and what it contains)
- Specify how AGENTS.md/CLAUDE.md should point agents to the index so no directory scan is needed
- Produce clear decision criteria distinguishing tool skills from startup-loop skills
- Generate concrete planning tasks to implement all of the above, including backfilling existing skills

### Non-goals

- Redesigning the existing `lp-*` skill system or startup loop workflow
- Moving tool skill directories to a different location in the repo
- Writing new tool skills (that is follow-on work, not this plan)
- Changing how Claude Code auto-discovers skills (that behaviour is platform-level)

### Constraints & Assumptions

- Constraints:
  - AGENTS.md is the canonical runtime runbook for all agents; changes there must remain readable and not bloat the skills list section
  - `.claude/skills/` is the established root for all skills; no relocating directories
  - Claude Code auto-discovers SKILL.md files by scanning `.claude/skills/*/SKILL.md`; the standard must work within that constraint, not against it
  - Any index must be a lightweight text/markdown file — JSON is acceptable but agent consumption must be a single read with no parsing tooling required
- Assumptions:
  - The five existing tool skills (`tool-process-audit`, `tools-bos-design-page`, `tools-ui-contrast-sweep`, `tools-web-breakpoint` / `tools-ui-breakpoint-sweep`, `tools-ui-frontend-design` / `frontend-design`) are the full current inventory
  - Future tool skills will continue to live under `.claude/skills/` in the same directory structure
  - Agents have access to read any file in the repo; the constraint is token cost, not access

## Outcome Contract

- **Why:** Ad-hoc tool skills are not discoverable by future agents without a directory scan, which is expensive in a large monorepo context. Three of five existing tool skills are not listed in AGENTS.md. One skill has a directory name that differs from its invocation name, creating ambiguity. Without a naming convention or metadata standard, agents cannot efficiently identify which tool skill matches their need or when to look for one.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A tool-skill discovery protocol exists: naming convention documented (including the directory/invocation-name distinction rule), SKILL.md metadata standard defined, index file maintained at a known path, AGENTS.md pointer added, and all five existing tool skills backfilled to comply. Future agents can locate the right tool skill with a single index read, not a directory scan.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/tool-process-audit/SKILL.md` — the oldest tool skill; has frontmatter `name: tool-process-audit`, `description`, and `operating_mode: ANALYSIS + RECOMMENDATIONS`; body has an Inputs table and Relationship to Other Skills section; no `trigger_conditions` frontmatter field or output contract table; NOT in AGENTS.md
- `.claude/skills/tools-bos-design-page/SKILL.md` — has frontmatter `name: tools-bos-design-page` and `description` only (no `operating_mode`); body contains an explicit inputs table; listed in AGENTS.md
- `.claude/skills/tools-ui-contrast-sweep/SKILL.md` — has frontmatter `name: tools-ui-contrast-sweep`, `description`, `operating_mode`; has a formal Inputs table; has a "Relationship to Other Skills" section; NOT in AGENTS.md
- `.claude/skills/tools-web-breakpoint/SKILL.md` — directory name is `tools-web-breakpoint` but frontmatter `name: tools-ui-breakpoint-sweep` (invocation name differs from directory name); has `description`, `operating_mode`; has Inputs table and Relationship to Other Skills section; NOT in AGENTS.md
- `.claude/skills/frontend-design/SKILL.md` — directory name is `frontend-design` but frontmatter `name: tools-ui-frontend-design`; the tools-* prefix lives in the invocation name, not the directory; has `name` and `description` only (no `operating_mode`); listed in AGENTS.md

### Key Modules / Files

- `/Users/petercowling/base-shop/AGENTS.md` (lines 122–189) — the skills manifest embedded in AGENTS.md; lists ~65 skills by name, description, and SKILL.md path; two tool skills are listed (`tools-bos-design-page` at line 180 and `tools-ui-frontend-design` at line 136); three are absent: `tool-process-audit`, `tools-ui-contrast-sweep` (invocation name for `tools-ui-contrast-sweep/`), `tools-ui-breakpoint-sweep` (invocation name for `tools-web-breakpoint/`)
- `/Users/petercowling/base-shop/CLAUDE.md` — contains no reference to tool-* skills at all; the word "tool" does not appear in the context of skill discovery
- `/Users/petercowling/base-shop/.claude/skills/_shared/discovery-index-contract.md` — defines a discovery index at `docs/business-os/_meta/discovery-index.json` for BOS card/stage-doc state, NOT for skills; confirms a precedent for index files but scoped to a different domain
- `/Users/petercowling/base-shop/.claude/skills/lp-do-fact-find/SKILL.md` (AGENTS.md line 160) — correctly listed; shows the pattern of how lp-* skills are listed
- `/Users/petercowling/base-shop/.claude/skills/tools-ui-contrast-sweep/SKILL.md` (line 11–17) — has "Relationship to Other Skills" section cross-linking `tools-web-breakpoint`, `lp-design-qa`, `meta-user-test`, `lp-do-build`; shows that tool skills are already aware of each other informally

### Patterns & Conventions Observed

- **Name prefix inconsistency:** `tool-` (singular) vs `tools-` (plural). Current inventory: `tool-process-audit` uses singular; the four `tools-` skills use plural. No convention specifies which is correct.
- **Directory name / invocation name split:** Two skills have a mismatch between the directory name and the SKILL.md `name` field or AGENTS.md listing: `tools-web-breakpoint/` has `name: tools-ui-breakpoint-sweep`; `frontend-design/` is listed in AGENTS.md as `tools-ui-frontend-design`. The directory name is not always the canonical invocation name — a rule is needed.
- **Frontmatter coverage varies:** `tool-process-audit`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` (tools-web-breakpoint/) have `name` + `description` + `operating_mode`. `tools-bos-design-page` and `tools-ui-frontend-design` (frontend-design/) have `name` + `description` only (no `operating_mode`). None of the five has a `trigger_conditions`, `inputs`, or `example_invocation` frontmatter field.
- **Inputs are in body, not frontmatter:** All five skills use a prose/table section in the body for inputs, not a machine-readable frontmatter field. An agent must read the full body to understand inputs — no token-efficient summary is available from frontmatter alone.
- **Relationship sections exist for two skills but not all:** `tools-ui-contrast-sweep` and `tools-web-breakpoint` have an explicit "Relationship to Other Skills" section. The other three do not.
- **AGENTS.md listing pattern:** Each lp-* skill entry is one line: `` - `name`: description. (file: path) ``. The same format is used for both listed tool skills. This is the agent-facing discovery surface for skills that are not auto-discovered by Claude Code via directory scan.
- **Operating mode values observed:** `ANALYSIS + RECOMMENDATIONS` (`tool-process-audit`), `AUDIT` (`tools-ui-contrast-sweep`, `tools-web-breakpoint` / `tools-ui-breakpoint-sweep`). `tools-bos-design-page` and `tools-ui-frontend-design` do not have `operating_mode` in their frontmatter. Not defined in any shared schema.

### Data & Contracts

- Types/schemas/events:
  - No schema file exists for SKILL.md frontmatter fields. The format is convention-only, derived by reading existing SKILL.md files.
  - No JSON schema or validator for the skills directory exists.
- Persistence:
  - Each skill is a static file; no database or index is maintained.
- API/contracts:
  - Claude Code auto-discovers SKILL.md files at `.claude/skills/*/SKILL.md` — this is platform behaviour, not configurable.
  - AGENTS.md "Available skills" section is the human-maintained agent-facing index.

### Dependency & Impact Map

- Upstream dependencies:
  - Any agent reading AGENTS.md to discover skills (all agents on every session start)
  - Operators invoking tool skills directly (e.g., `/tool-process-audit`)
- Downstream dependents:
  - All future agents that need to find and invoke tool skills
  - Any skill that cross-references another tool skill (e.g., `tools-ui-contrast-sweep` references `tools-web-breakpoint`)
  - The coverage-scan skill (`lp-coverage-scan`) — may eventually reference tool skills in coverage gap analysis
- Likely blast radius:
  - AGENTS.md skills list section (additive change — add missing skills, add index pointer)
  - All five existing SKILL.md files (backfill missing frontmatter fields: `trigger_conditions`, `related_skills`, and `operating_mode` where absent)
  - One new file: the tool-skills index (e.g., `.claude/skills/tools-index.md`)
  - Optionally CLAUDE.md (add pointer — low priority, AGENTS.md is the canonical source)

### Test Landscape

Not investigated: this is a documentation/convention change with no executable code. There are no test files covering SKILL.md structure or AGENTS.md content.

### Recent Git History (Targeted)

- `.claude/skills/` — recent commits show ongoing skill creation (lp-coverage-scan, lp-do-worldclass, lp-do-assessment-14, lp-do-build Codex offload extensions) but no commits touching any of the five tool skills in the period reviewed. No naming standard commit exists.
- `AGENTS.md` — last modified 2026-02-23; most recent skill entries were additive (new lp-* skills listed). No tool skill was added to the list in this period.

## Questions

### Resolved

- Q: Should the naming prefix be `tool-` or `tools-`?
  - A: Standardize on `tools-` (plural). Four of five existing skills already use it (as invocation names); it reads as a category name ("tools") rather than a type annotation ("tool something"). `tool-process-audit` is the lone outlier and should be noted in the spec as a legacy exception — renaming the directory is a separate decision and not required by this plan (directory renames break operator muscle memory).
  - Evidence: Inventory of `.claude/skills/` directory; observed naming of four of five skills using `tools-` prefix in their invocation name.

- Q: Should the index be a Markdown file or JSON?
  - A: Markdown (`.claude/skills/tools-index.md`). Agents consume it with a single Read call, no parsing needed. JSON would require either parsing or the agent to read it as prose anyway. Markdown is also human-readable for operators. The BOS `discovery-index.json` is a different use case (machine-generated, script-produced).
  - Evidence: `.claude/skills/_shared/discovery-index-contract.md` shows JSON used for script-generated indexes; the tool skill index is human-maintained and human-read.

- Q: What metadata must appear in the frontmatter (not just the body) for token-efficient discovery?
  - A: Five fields are necessary and sufficient: `name` (invocation handle), `description` (one line: what it does and when to use it), `operating_mode` (AUDIT | ANALYSIS | GENERATE | INTERACTIVE — signals what the skill produces), `trigger_conditions` (comma-separated keywords or situations that should prompt using this skill), `related_skills` (comma-separated names of skills this is commonly paired with or supersedes). These five fields allow an agent reading only the frontmatter to decide whether to load the full SKILL.md. The body contains the full workflow.
  - Evidence: Review of all five existing SKILL.md files; the token cost problem is that agents must read entire bodies to understand trigger conditions; frontmatter fields let the index file stay minimal.

- Q: How should AGENTS.md be updated — add individual entries for each unlisted tool skill, or add a section pointer?
  - A: Both. Add individual entries for the three missing tool skills (same format as existing entries: `` - `invocation-name`: description. (file: path) ``) AND add a brief pointer at the top of the Available Skills section noting that a tool-skills index exists at `.claude/skills/tools-index.md` for diagnostic/utility skills. Currently two tool skills are already listed (`tools-bos-design-page`, `tools-ui-frontend-design`); three are missing (`tool-process-audit`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`). This follows the progressive-loading principle already established in AGENTS.md: list the skills, then point to detail. The index itself gives more context per skill than the one-line AGENTS.md entry.
  - Evidence: AGENTS.md line 117: "Skills live in `.claude/skills/<name>/SKILL.md`. Claude Code auto-discovers them; Codex reads them directly." — confirms the AGENTS.md list is the fallback discovery surface for agents that do not auto-scan.

- Q: What are the decision criteria for tool-* versus lp-* or startup-loop skills?
  - A: A skill belongs in `tools-*` if ALL of the following are true: (1) it is invoked on-demand for a specific diagnostic, generative, or utility task rather than as a step in the startup loop; (2) it produces an artifact or analysis output that is not a loop artifact (not a plan, fact-find, briefing, or stage-doc); (3) it can be called from any context (inside or outside a loop run) without needing loop state; (4) it is ad-hoc in nature — it cannot be made deterministic as a standing loop step. If (3) or (4) fails, the skill belongs in `lp-*` or the `startup-loop` namespace. The canonical example: `tools-ui-contrast-sweep` is called on demand before launch, not on a weekly cadence — it is a tool. `lp-launch-qa` is called at a specific loop stage with defined inputs — it is an lp skill.
  - Evidence: Operator-stated: "ad-hoc processes that cannot be made deterministic should become tool-* skills." Comparison of `tools-ui-contrast-sweep` (on-demand, no loop state) vs `lp-launch-qa` (stage-gated, loop-integrated).

- Q: Should `tools-ui-frontend-design` (listed in AGENTS.md as `tools-ui-frontend-design` but stored at `frontend-design/`) be considered part of this standard?
  - A: Yes, include it in the index and apply the same metadata standard during backfill. The directory name `frontend-design` is a legacy exception — the invocation name `tools-ui-frontend-design` follows the `tools-` convention. Note the path exception in the spec.
  - Evidence: AGENTS.md line 136: `` - `tools-ui-frontend-design`: ... (file: `.claude/skills/frontend-design/SKILL.md`) ``.

- Q: Where should the index file live?
  - A: `.claude/skills/tools-index.md`. It lives inside the skills directory where it is co-located with what it indexes, and agents that have loaded `.claude/skills/` context have it nearby. AGENTS.md will point to it by path.
  - Evidence: Co-location principle; AGENTS.md already points to SKILL.md files by absolute-relative path.

### Open (Operator Input Required)

- Q: Should `tool-process-audit` be renamed to `tools-process-audit` (directory rename) as part of this plan?
  - Why operator input is required: directory renames break any existing operator or CI references to the old path. The operator has muscle memory for the current name and may have external references.
  - Decision impacted: whether the spec says the `tool-` outlier must be renamed, or whether it is documented as a legacy exception.
  - Decision owner: operator (Peter)
  - Default assumption (if any) + risk: Default is to leave directory name unchanged and document it as a legacy exception. Risk: the inconsistency persists and future agents may wonder why one skill uses singular.

## Confidence Inputs

- Implementation: 92%
  - Evidence: The deliverables are entirely documentation and convention files — SKILL.md frontmatter additions, index file creation, AGENTS.md additions. All five existing SKILL.md files have been read; their current state is confirmed. No code changes required. No build, typecheck, or CI gate applies.
  - What raises to >=80: already there — implementation path is read/write on known files.
  - What raises to >=90: confirmation of `tool-process-audit` rename decision (open question above).

- Approach: 88%
  - Evidence: The proposed approach (frontmatter standard + index + AGENTS.md pointer + decision criteria) matches the operator-stated need precisely. The pattern of having both an AGENTS.md entry and a more detailed index is established by AGENTS.md's own "Progressive Context Loading" table (lines 243–256).
  - What raises to >=80: already there.
  - What raises to >=90: close the rename question (will tighten the spec to remove the fork).

- Impact: 85%
  - Evidence: The problem is well-documented — three of five tool skills are absent from AGENTS.md. The fix is additive with no regression risk. Token efficiency gain is structural: instead of a directory scan, an agent reads one index file (~20 lines).
  - What raises to >=80: already there.
  - What raises to >=90: confirm operator finds the proposed index format sufficient (single read, markdown).

- Delivery-Readiness: 94%
  - Evidence: All files to be modified or created are identified. No external dependencies. No approvals required. Can be executed by a single build agent in one session.
  - What raises to >=80: already there.
  - What raises to >=90: close the rename question so the TASK list is unambiguous.

- Testability: 80%
  - Evidence: Correctness can be verified by: (1) reading AGENTS.md and confirming all five tool skills are listed; (2) reading `.claude/skills/tools-index.md` and confirming all five entries are present with required fields; (3) reading each SKILL.md frontmatter and confirming five required fields are present. These are deterministic checks — `lp-do-factcheck` can run them post-build.
  - What raises to >=80: already there.
  - What raises to >=90: add an explicit acceptance-criteria row per task in plan.md.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| AGENTS.md skills list grows too long and becomes a cognitive burden | Low | Moderate | The index solves this: AGENTS.md entries remain one-liners; full detail lives in the index. No new section headers needed. |
| Frontmatter standard not applied consistently in future skill creation | Medium | Moderate | Add a one-paragraph "How to create a tool skill" note to AGENTS.md or the index itself. A future lp-do-factcheck run can audit compliance. |
| `tool-process-audit` rename creates broken references | Low (if rename deferred) | Low | Default plan is to defer rename; document as legacy exception. |
| tools-index.md drifts out of sync as new skills are added | Medium | Low | Note in index and AGENTS.md that it must be updated when a new tool skill is created; add to `meta-reflect` coverage criteria or operator checklist. |
| `tools-ui-frontend-design` (stored at `frontend-design/`) confuses the naming spec | Low | Low | Document the path exception explicitly in both the index and the spec. |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Inventory of existing tool skills (five total confirmed) | Yes | None | No |
| AGENTS.md current coverage of tool skills (two listed, three missing) | Yes | None | No |
| Directory name vs invocation name split (`tools-web-breakpoint` / `tools-ui-breakpoint-sweep`; `frontend-design` / `tools-ui-frontend-design`) | Yes | None | No |
| CLAUDE.md current coverage of tool skills | Yes | None | No |
| Frontmatter field analysis across all five SKILL.md files | Yes | None | No |
| Naming convention inconsistency (`tool-` vs `tools-`) | Yes | None | No |
| Index file precedent in repo (`_shared/discovery-index-contract.md`) | Yes | None | No |
| Impact on AGENTS.md progressive-loading section | Yes | None | No |
| Decision criteria: tool-* vs lp-* distinction | Yes | None | No |
| `tools-ui-frontend-design` path exception | Yes | None | No |
| Test / validation path post-build | Yes | None — lp-do-factcheck can verify compliance | No |

## Planning Constraints & Notes

- Must-follow patterns:
  - AGENTS.md skills list entries must use the established one-liner format: `` - `name`: description. (file: path) ``
  - Index file must be a single Read — no pagination, no tooling required
  - SKILL.md frontmatter fields must not break Claude Code's current auto-discovery (which reads frontmatter for `name` and `description` only)
- Rollout/rollback expectations:
  - All changes are additive (new file, new lines in existing files, new frontmatter fields). Rollback is trivially `git revert`.
- Observability expectations:
  - Post-build: run `lp-do-factcheck` against plan.md acceptance criteria to confirm all SKILL.md files have required frontmatter fields and that the index contains all five entries.

## Suggested Task Seeds (Non-binding)

- TASK-01 (IMPLEMENT): Write the tool-skill metadata standard and naming convention spec — either as a standalone doc at `.claude/skills/tools-standard.md` or as a section added to an existing reference doc. Covers: prefix convention, required frontmatter fields (5 fields defined in Resolved Q3), operating_mode vocabulary, decision criteria for tool-* vs lp-*, path exception documentation for `tools-ui-frontend-design`.
- TASK-02 (IMPLEMENT): Create `.claude/skills/tools-index.md` — one entry per tool skill with the five frontmatter summary fields. Initial entries: `tool-process-audit`, `tools-bos-design-page`, `tools-ui-contrast-sweep` (dir: `tools-ui-contrast-sweep/`), `tools-ui-breakpoint-sweep` (dir: `tools-web-breakpoint/`), `tools-ui-frontend-design` (dir: `frontend-design/`). Each entry must show both the invocation name and the directory path when they differ.
- TASK-03 (IMPLEMENT): Backfill SKILL.md frontmatter for all five tool skills — add `operating_mode`, `trigger_conditions`, `related_skills` to each file where missing. Do not remove or modify existing content.
- TASK-04 (IMPLEMENT): Update AGENTS.md — add the three missing tool skills to the Available Skills list using their canonical invocation names (`tool-process-audit`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`); add a one-line pointer to `tools-index.md` at the top of the Available Skills section.
- TASK-05 (INVESTIGATE): Decide whether `tool-process-audit` should be renamed to `tools-process-audit`. Record the decision in the standard doc. If rename is accepted, add a TASK-06 to execute it and update all references.
- CHECKPOINT: Run `lp-do-factcheck` to verify all SKILL.md files have required frontmatter, index is complete, and AGENTS.md entries are correct.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `lp-do-factcheck` (post-build verification)
- Deliverable acceptance package:
  - `.claude/skills/tools-index.md` exists and lists all five tool skills with canonical invocation names and directory paths
  - All five SKILL.md files have `name`, `description`, `operating_mode`, `trigger_conditions`, `related_skills` in frontmatter
  - AGENTS.md lists all five tool skills by their canonical invocation name (three previously missing ones added)
  - AGENTS.md contains a pointer to `tools-index.md`
  - Naming convention spec exists (either standalone or embedded in index or AGENTS.md) and covers: prefix convention, directory/invocation-name split rule, operating_mode vocabulary
  - Decision on `tool-process-audit` rename is recorded in the spec
- Post-delivery measurement plan:
  - Future session: agent asks "what tool skills are available for contrast auditing?" — expected: one index read surfaces `tools-ui-contrast-sweep` without directory scan
  - lp-do-factcheck on the index file periodically to confirm it remains in sync with the actual directory

## Evidence Gap Review

### Gaps Addressed

- Confirmed all five existing tool skill directories and their SKILL.md content by direct read
- Confirmed which skills are listed vs absent in AGENTS.md by grepping and reading
- Confirmed CLAUDE.md has no tool-skill references
- Confirmed no existing index file exists for tool skills
- Confirmed naming inconsistency by direct directory listing
- Confirmed the pattern of AGENTS.md one-liner entries and progressive loading tables

### Confidence Adjustments

- Implementation confidence elevated to 92% (from initial 85%) after confirming that all deliverables are documentation-only with no code or build changes
- Delivery-Readiness elevated to 94% after confirming no external dependencies or approval paths
- Testability held at 80% — structural verification is possible via factcheck but no automated CI enforcement mechanism exists for SKILL.md compliance

### Remaining Assumptions

- `tools-ui-frontend-design` is assumed to belong in the tool-skills catalog based on its `tools-` prefix invocation name; if the operator considers it a core design system skill (not a tool), it should be excluded from the index
- The `_shared/discovery-index-contract.md` index at `docs/business-os/_meta/discovery-index.json` is confirmed to be a separate domain (BOS card state) and is not the right location for the skills index

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (one open question on rename — deferred by default, does not block planning)
- Recommended next step: `/lp-do-plan tool-skill-discovery-protocol --auto`
