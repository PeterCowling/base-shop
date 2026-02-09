---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Created: 2026-02-09
Last-updated: 2026-02-09
Feature-Slug: cabinet-system
Related-Plan: docs/plans/cabinet-system-plan.md
Business-Unit: BOS
---

# Cabinet System — Fact-Find Brief

## Scope

### Summary

Evolve the `/ideas-go-faster` skill from a single-skill sweep into a multi-agent "Cabinet" system — a composite "team of rivals" idea factory where multiple expert lenses independently generate ideas, Munger+Buffett gatekeep and assign first priorities, Drucker+Porter re-prioritize against business plans, and a parallel technical cabinet reviews the codebase. The system introduces structured attribution, confidence gating (ideas vs data gaps vs hunches), persona fidelity testing, and a Q&A-seeded knowledge base for plans and profiles that is maintained as a byproduct of operating.

### Goals

1. **Composite ideation**: Multiple expert lenses (Musk, Bezos, Marketing, Sales, China-facing, Code-review) independently generate ideas — not averaging viewpoints, but preserving competing framings
2. **Attribution**: Full provenance tracking — who originated, who contributed, who decided, and why
3. **Confidence gating**: Only "presentable ideas" reach the filter stage; low-confidence items become Data Gap Proposals; hunches die quietly
4. **Multi-stage pipeline**: Composite generation → Confidence gate → Munger/Buffett filter + first priority → Work-up → Drucker/Porter plan-weighted prioritization → Fact-finding → Kanban execution
5. **Technical code-review cabinet**: Parallel expert group reviewing the codebase and originating improvement ideas (Fowler, Beck, Kim, Gregg, Schneier, etc.)
6. **Persona fidelity**: Storable, testable, improvable expert personas with regression tests and continuous improvement loop
7. **Business tooling analogs**: Linting (missing fields), typechecking (consistency), testing (hypothesis tests), observability (confidence trends)
8. **Knowledge system**: People Profiles + Strategy/Plans Registries seeded by Q&A, maintained as byproduct of operating, versioned like a code repo

### Non-goals

- Building a literal multi-agent runtime (no new TypeScript, no LLM orchestration layer in Phase 0)
- Creating real LLM personas that independently run (all lenses execute within a single Claude Code session)
- Replacing the existing kanban pipeline (Cabinet feeds INTO the pipeline, doesn't replace it)
- Production ML models for forecasting
- Automated scheduling (Phase 0 remains Pete-triggered)

### Constraints & Assumptions

- Constraints:
  - Must work within Claude Code's skill system (SKILL.md files, prompt-only)
  - Single Claude Code session per invocation (no concurrent agents at runtime)
  - Agent API as primary data store (D1 is source of truth)
  - Phase 0: Pete triggers, system executes autonomously
- Assumptions:
  - Expert lenses are implemented as prompt sections within skill files, not separate processes
  - A single orchestrator skill can invoke sub-skills (precedent: `improve-guide` orchestrating `improve-en-guide` + `improve-translate-guide`)
  - The current agent API can be extended with new fields (attribution, confidence) but this is implementation work, not a prerequisite for Phase 0

---

## Gap Analysis: Current State vs Cabinet System

### What Exists Today

The current `/ideas-go-faster` skill (730 lines, just rewritten) provides:

| Capability | Current Implementation | Evidence |
|---|---|---|
| Business process audit | MACRO framework (Measure, Acquire, Convert, Retain, Operate) | `.claude/skills/ideas-go-faster/SKILL.md:83-152` |
| Constraint diagnosis | One constraint per business, evidence-required, confidence-scored | `SKILL.md:222-255` |
| Intervention ordering | Elon Musk 5-step algorithm (strict ordering) | `SKILL.md:20-32` |
| Idea generation | Single-lens (Musk framework only), 3-5 interventions per business | `SKILL.md:257-285` |
| Idea pipeline | Two-stage: raw ideas → auto-work-up top 3 to cards | `SKILL.md:311-391` |
| Plan integration | Read plans from filesystem, compare to reality | `SKILL.md:396-435` |
| Profile integration | Read people profiles from filesystem, use for allocation | `SKILL.md:412-425` |
| Forecasting | Prose trajectory statements per business | `SKILL.md:438-468` |
| Attribution | None — ideas are tagged `sweep-generated` and `sweep-auto` but no originator tracking | `SKILL.md:326, 367` |
| Confidence gating | Scoring rubric (Impact/Confidence/Time-to-signal/Effort/Risk) but no hunch/data-gap/idea classification | `SKILL.md:268-285` |
| Expert lenses | One lens only (Musk) | `SKILL.md:20-32` |

### What the Cabinet System Requires

| Capability | Cabinet Requirement | Gap Size |
|---|---|---|
| **Composite ideation** | 6+ expert lenses generating independently | LARGE — only 1 lens exists |
| **Attribution** | Full provenance: originator, contributors, decision log per idea | LARGE — no attribution in data model |
| **Confidence gating** | Three tiers: Presentable Idea / Data Gap Proposal / Hunch | MEDIUM — scoring exists but no tier classification |
| **Munger+Buffett filter** | Kill/hold/promote decisions with inversion analysis | LARGE — no gatekeeping stage exists |
| **Drucker+Porter prioritization** | Plan-weighted re-prioritization after work-up | LARGE — plan comparison exists but not as a distinct stage |
| **Technical code-review cabinet** | 12+ technical expert personas reviewing repo | LARGE — no code-review personas exist |
| **Persona fidelity** | Storable personas with regression tests | LARGE — no persona definitions exist |
| **Idea Dossier format** | Provenance, confidence ledger, rivalry record | LARGE — ideas are free-form markdown |
| **Business tooling** | Lint/typecheck/test/observability for business ideas | LARGE — no business validation framework |
| **Knowledge system** | Q&A-seeded, byproduct-maintained, versioned registries | MEDIUM — plan/profile schemas exist but nothing is populated |
| **Orchestrator skill** | Cabinet Secretary coordinating multi-stage pipeline | MEDIUM — single-skill architecture exists, needs expansion |
| **Multi-stage pipeline** | 6 stages with gates between them | MEDIUM — 2 stages exist (raw → work-up) |

### Gap Detail: Expert Lenses

**Current state:** One lens (Elon Musk 5-step algorithm embedded in constitution)

**Cabinet requires 6 composite idea generators + 1 technical cabinet:**

| Lens | Expert(s) | What They Generate | Exists? |
|---|---|---|---|
| Feasibility/constraint | Elon Musk | Shortest credible path, bottleneck removal | YES (embedded in constitution) |
| Customer-backwards | Jeff Bezos | Problem/who/why-now, press-release narrative | NO |
| Marketing/positioning | Hopkins, Ogilvy, Reeves, Lafley | USP, proof, positioning, testability | NO |
| Sales mechanics | Patterson, Ellison, Chambers | Route-to-revenue, pricing, deal mechanics | NO |
| Sourcing/quality | Cook, Fung, Ohno/Toyoda | Supplier feasibility, quality risk, relationships | NO |
| Technical code-review | Fowler, Beck, Kent, Kim, Gregg, Schneier, etc. | Repo improvements, architecture, testing, security | NO |

**Plus 2 filter/prioritization stages:**

| Stage | Expert(s) | What They Do | Exists? |
|---|---|---|---|
| First filter | Munger + Buffett | Kill/hold/promote with inversion, opportunity cost, circle of competence | NO |
| Plan-weighted priority | Drucker + Porter | Re-prioritize against objectives, strategy, competitive posture | NO |

### Gap Detail: Data Model

**Current idea schema (from `businessOsIdeas.server.ts`):**

```typescript
{
  Type: "Idea" | "Opportunity",
  ID: string,
  Business: string,
  Status: "raw" | "worked" | "converted" | "dropped",
  Tags: string[],
  content: string  // free-form markdown
}
```

**Cabinet requires (minimum new fields):**

| Field | Purpose | In Current Schema? |
|---|---|---|
| `Originator` | Which lens generated the idea | NO |
| `Contributors` | Who else added substance | NO |
| `Confidence-Tier` | presentable / data-gap / hunch | NO |
| `Confidence-Score` | Numerical from scoring rubric | NO (in markdown only) |
| `Decision-Log` | Munger/Buffett decision, Drucker/Porter decision | NO |
| `Rivalry-Record` | Best argument for/against/alternative | NO |
| `Pipeline-Stage` | Which stage of the 6-stage pipeline | NO (only inbox/worked) |
| `Evidence-Ledger` | Structured claims + evidence + unknowns | NO (free-form markdown) |

**Architectural question:** Should these be schema-level fields in D1, or structured sections within the markdown `content` field?

### Gap Detail: Skill Architecture

**Current pattern:** Single skill (`.claude/skills/ideas-go-faster/SKILL.md`) does everything in one invocation.

**Cabinet requires:**
- An orchestrator skill that dispatches to sub-processes
- Expert lens definitions (either inline in the orchestrator or as separate files)
- A multi-stage pipeline with gates between stages

**Precedent in the repo:** `improve-guide` orchestrates `improve-en-guide` + `improve-translate-guide`. This proves parent/child skill architecture works.

**Key constraint:** All "expert lenses" execute within a single Claude Code session. They are prompt sections that structure the agent's thinking, not separate LLM calls. The "composite" effect comes from the agent systematically stepping through each lens, not from parallel execution.

**Implementation options:**

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A) Single monolithic skill** | One massive SKILL.md with all lenses, gates, and stages | Simple, no orchestration needed | Very long (2000+ lines), hard to maintain, can't invoke sub-lenses selectively |
| **B) Orchestrator + lens files** | Cabinet Secretary SKILL.md + lens definitions in `_shared/cabinet/` | Modular, maintainable, selective invocation | Needs careful prompt architecture, more files |
| **C) Orchestrator + sub-skills** | Cabinet Secretary invokes `/cabinet-musk`, `/cabinet-bezos`, etc. | Maximum modularity, each lens is a standalone skill | Many new skill directories, heavier per invocation |
| **D) Hybrid: Orchestrator + lens library + sub-skills for heavy stages** | Secretary SKILL.md, lens definitions in `_shared/`, Munger/Buffett and Drucker/Porter as separate skills | Balance of modularity and simplicity | Moderate complexity |

### Gap Detail: Persona Fidelity System

**Current state:** No persona definitions, no regression tests, no fidelity scoring.

**Cabinet requires per expert:**

| Component | Purpose | Exists? |
|---|---|---|
| Principles & heuristics | Decision rules the expert applies | NO (only Musk algorithm exists as implicit example) |
| Signature questions | Questions the expert characteristically asks | NO |
| Failure modes | How the expert goes wrong | NO |
| Domain boundaries | Circle of competence constraints | NO |
| Preferred artifacts | What the expert produces | NO |
| Tone constraints | Communication style | NO |
| Fidelity score | Confidence in persona accuracy | NO |
| Regression tests | Scenario tests with expected behavior | NO |
| Continuous improvement | Prediction accuracy tracking, false positive/negative rates | NO |

**Scale of work:** 18+ expert personas to define (6 composite generators × 1-5 sub-experts each, plus 2 filter experts, plus 12 technical experts). Even with brief definitions, this is substantial content.

### Gap Detail: Knowledge System

**Current state:**
- Business plans: schema defined (`update-business-plan/SKILL.md`) but NO plans exist
- People profiles: schema defined (`update-people/SKILL.md`) but NO profiles exist
- Maturity model: exists and is comprehensive (`business-maturity-model.md`)
- Business catalog: exists (`businesses.json` — 4 businesses)

**Cabinet requires:**
- Plans and profiles populated (Q&A seeded)
- Maintained as byproduct of operating (sweep updates trigger plan/profile updates)
- Versioned with diffable changes and attributable decisions
- Q&A interface for initial seeding

**Gap:** The schemas exist but nothing is populated. The Cabinet system needs these as inputs — the current ideas-go-faster skill already flags missing plans/profiles as critical findings. The Cabinet system amplifies this dependency.

---

## Key Modules / Files Affected

| File/Area | Role | Change Type |
|---|---|---|
| `.claude/skills/ideas-go-faster/SKILL.md` | Current sweep skill | REPLACE with Cabinet Secretary orchestrator |
| `.claude/skills/_shared/cabinet/` | Expert lens definitions (new) | CREATE |
| `.claude/skills/_shared/cabinet/persona-*.md` | Per-expert persona definitions (new) | CREATE |
| `.claude/skills/cabinet-filter/SKILL.md` | Munger+Buffett filter skill (new, optional) | CREATE |
| `.claude/skills/cabinet-prioritize/SKILL.md` | Drucker+Porter prioritization skill (new, optional) | CREATE |
| `.claude/skills/cabinet-code-review/SKILL.md` | Technical code-review cabinet (new) | CREATE |
| `docs/business-os/strategy/<BIZ>/plan.user.md` | Business plans (must be bootstrapped) | CREATE |
| `docs/business-os/people/people.user.md` | People profiles (must be bootstrapped) | CREATE |
| Agent API (ideas schema) | Attribution + confidence fields | EXTEND (future) |

---

## Patterns & Conventions Observed

- **Skill orchestration precedent:** `improve-guide` → `improve-en-guide` + `improve-translate-guide` (parent dispatches to child skills)
- **Shared resources pattern:** `_shared/card-operations.md` and `_shared/stage-doc-operations.md` — reusable helpers referenced by multiple skills
- **Frameworks-as-personas:** The repo already uses frameworks as implicit personas (MACRO = business auditor, maturity model = strategic evaluator, confidence rubric = evidence assessor). The Cabinet system makes this explicit.
- **Prompt-only architecture:** All skills are SKILL.md files with no TypeScript. The Cabinet system must follow this constraint.
- **Agent API is source of truth:** D1 database, not markdown files. Skills use the API for CRUD operations.

---

## Questions

### Resolved

- Q: Can skills invoke other skills?
  - A: Yes. Precedent: `improve-guide` invokes `improve-en-guide` and `improve-translate-guide`. `plan-feature` auto-invokes `build-feature`.
  - Evidence: `.claude/skills/improve-guide/SKILL.md:43`, `.claude/skills/plan-feature/SKILL.md:725`

- Q: Can expert lenses run independently within a single session?
  - A: Yes, but sequentially, not in parallel. A single Claude Code session processes one prompt at a time. "Composite generation" means the agent systematically steps through each lens one by one, not parallel LLM calls.
  - Evidence: Claude Code architecture — single session, single model.

- Q: Is the current data model extensible for attribution?
  - A: Yes for markdown `content` field (can add structured sections). The D1 schema would need migration for new top-level fields, but Phase 0 can use markdown-in-content.
  - Evidence: Ideas already have free-form `content` field. The sweep already puts structured data (scores, evidence) in markdown content.

- Q: Do business plans and people profiles need to exist before the Cabinet system works?
  - A: Not strictly — the current skill already handles missing plans/profiles gracefully. But the Cabinet system's Drucker/Porter stage and task assignment realism depend heavily on them. They should be bootstrapped in parallel or as a prerequisite.
  - Evidence: `ideas-go-faster/SKILL.md:396-425` handles missing plans/profiles.

### Open (User Input Needed)

- Q: **How many expert lenses in Phase 0?**
  - Why it matters: 18+ expert personas is a lot of content to write and maintain. Should Phase 0 start with a subset (e.g., Musk + Bezos + Munger/Buffett only) and expand incrementally?
  - Default assumption: Start with 4-6 core lenses + filter stage. Add marketing/sales/sourcing/code-review lenses in Phase 1. Low risk — phased approach.

- Q: **Single skill vs multi-skill architecture?**
  - Why it matters: A single monolithic SKILL.md will be 2000+ lines. Multiple smaller skills are more maintainable but add orchestration complexity. Option B (orchestrator + lens files in `_shared/cabinet/`) or Option D (hybrid) seem strongest.
  - Default assumption: Option D — orchestrator SKILL.md + persona definitions in `_shared/cabinet/` + separate skills for heavy stages (filter, code-review). Medium risk — needs careful prompt architecture.

- Q: **Attribution in data model vs in content?**
  - Why it matters: Schema-level fields (D1 migration) enable querying and filtering. Content-level attribution (structured markdown) is simpler to implement but harder to query. Phase 0 probably uses content-level; Phase 1 migrates to schema.
  - Default assumption: Phase 0 uses structured markdown in the `content` field. Phase 1 adds D1 fields. Low risk.

- Q: **Should the code-review cabinet run as part of every sweep, or as a separate invocation?**
  - Why it matters: The code-review cabinet has a fundamentally different input (the codebase) than the business cabinet (API data + plans). Running them together makes sweeps very long. Running them separately means two invocations.
  - Default assumption: Separate skill (`/cabinet-code-review`) invoked independently. The business sweep can recommend code-review when software-heavy ideas are generated. Low risk.

- Q: **How deep should persona definitions go in Phase 0?**
  - Why it matters: Full persona specs (principles, signature questions, failure modes, domain boundaries, tone constraints, fidelity scores, regression tests) for 18+ experts is weeks of work. Minimal specs (principles + 3-5 signature questions + domain boundaries) could be done in days.
  - Default assumption: Phase 0 uses minimal persona specs. Fidelity scoring and regression tests are Phase 1. The system needs to run before it can be calibrated. Low risk.

- Q: **Idea Dossier format — how structured?**
  - Why it matters: The spec describes a rich dossier format (provenance, confidence ledger, rivalry record). This is the core artifact. If it's too heavy, the system creates bureaucracy; if too light, it loses the team-of-rivals effect.
  - Default assumption: Start with the minimum sections (Provenance, Confidence Tier, Key Evidence, Best Argument For/Against) and expand based on experience. Low risk.

- Q: **Should Munger/Buffett and Drucker/Porter be separate skills or inline stages?**
  - Why it matters: Separate skills allow independent invocation and testing. Inline stages keep the pipeline compact but harder to debug/iterate on individual stages.
  - Default assumption: Inline stages in Phase 0 (keeps it to one invocation). Extract to separate skills if the orchestrator SKILL.md exceeds ~1000 lines. Low risk.

- Q: **How are the business "tooling" analogs (lint/typecheck/test) implemented?**
  - Why it matters: These could be checklists in the skill prompt (cheapest), structured validation functions (needs TypeScript), or separate skills. The spec describes them as systematic but doesn't define implementation.
  - Default assumption: Phase 0 implements as checklist sections in the Idea Dossier template. The orchestrator verifies each dossier passes the "lint" checks before routing onward. Low risk.

---

## Confidence Inputs (for /plan-feature)

- **Implementation:** 65%
  - Strong: Skill orchestration pattern exists (improve-guide precedent). Single SKILL.md architecture proven at 900+ lines (plan-feature). Expert framework embedding proven (Musk algorithm in ideas-go-faster).
  - Weak: No persona definition pattern exists. Scale of content creation (18+ expert personas) is unprecedented. Multi-stage pipeline with gates hasn't been done in this repo. Attribution requires either content-level convention or D1 schema changes.
  - What would raise to 80%: Write 2-3 persona definitions and test them in a dry-run sweep. Validate the orchestrator can step through lenses sequentially without losing coherence or context.

- **Approach:** 70%
  - Strong: Clear user direction on philosophy (team of rivals, confidence gating, attribution). The 10-section spec is extremely detailed. MACRO framework and Musk algorithm prove the pattern works.
  - Weak: The spec describes a large system. Phasing is not yet defined. Risk of over-engineering in Phase 0 (building the full cabinet when 4 lenses would suffice). The relationship between Cabinet output and existing kanban pipeline needs clarification.
  - What would raise to 80%: Define explicit Phase 0 scope (which lenses, which stages, minimal dossier format). Validate with a hand-run example: manually walk one business through all stages and check whether the output is materially better than current single-lens sweep.

- **Impact:** 85%
  - Strong: The current single-lens sweep is demonstrably limited (only Musk perspective, no customer validation, no marketing/sales thinking). Multi-lens ideation should produce more diverse, better-tested ideas. Confidence gating prevents low-quality ideas from consuming review bandwidth.
  - Weak: Complexity may slow sweeps from <5 minutes to 15-20 minutes. More output to review (multiple dossiers, decision logs). Risk that expert personas feel like theater rather than adding genuine analytical value.
  - What would raise to 90%: Run a comparative test — same business state, current sweep vs Cabinet sweep — and verify Cabinet produces materially different/better recommendations.

- **Testability:** 50%
  - Strong: Persona regression tests are part of the spec (scenario tests with expected outputs). Business tooling analogs (lint/typecheck) are inherently testable.
  - Weak: Output quality is highly subjective ("does this sound like Munger?"). No baseline data for prediction accuracy. Skill is prompt-only — can't unit test. Persona fidelity scoring doesn't have clear benchmarks.
  - What would raise to 70%: Define 5 scenario tests with expected expert outputs. Define measurable quality dimensions (e.g., "every dossier has at least one steelman argument against").

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Skill system (SKILL.md files, prompt-only, no TypeScript)
  - Agent API as data store (fail-closed)
  - Existing kanban pipeline (Cabinet feeds in, doesn't replace)
  - Existing skill naming conventions
- Rollout expectations:
  - Phase 0: Minimal viable cabinet (subset of lenses, inline stages, content-level attribution)
  - Phase 1: Full lens library, separate filter/prioritization skills, D1 schema extensions
  - Phase 2: Persona fidelity scoring, regression tests, continuous improvement loop
- Observability:
  - Decision logs in dossiers (who decided what and why)
  - Sweep reports show which lenses contributed which ideas
  - Confidence trends tracked across sweeps

---

## Suggested Task Seeds (Non-binding)

1. **Define Phase 0 scope** — Which lenses, stages, and dossier format constitute the minimum viable cabinet? This is a DECISION task.

2. **Design the Idea Dossier schema** — Define the markdown template for dossiers with provenance, confidence ledger, and rivalry record sections. This is the core artifact that makes the system real.

3. **Write persona definitions for Phase 0 lenses** — Minimum: principles, signature questions, domain boundaries. Start with Musk (already exists), Bezos, Munger/Buffett (the filter pair).

4. **Write the Cabinet Secretary orchestrator skill** — Replaces ideas-go-faster SKILL.md. Dispatches to lenses, enforces confidence gate, routes dossiers through filter and prioritization stages.

5. **Bootstrap business plans** — The Cabinet system needs plans as inputs. Bootstrap BRIK and PIPE plans via `/update-business-plan`.

6. **Bootstrap people profiles** — Same dependency. Bootstrap via `/update-people`.

7. **Design business linting checklist** — Automated checks for missing/inconsistent fields in dossiers.

8. **Write 3 persona regression test scenarios** — Define expected outputs for Musk, Bezos, and Munger given a known business state. These become the "CI" for the cabinet.

9. **Design the code-review cabinet skill** — Separate skill for technical experts reviewing the codebase.

10. **Comparative test: Single-lens sweep vs Cabinet sweep** — Run both against current business state and compare output quality.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None — open questions have safe defaults. The most important decision (Phase 0 scope) can be made during planning.
- Recommended next step: Proceed to `/plan-feature cabinet-system`
