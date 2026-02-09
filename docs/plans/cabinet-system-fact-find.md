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
| `.claude/skills/ideas-go-faster/SKILL.md` | Current sweep skill | REPLACE with Cabinet Secretary orchestrator (accepts `--stance` parameter) |
| `.claude/skills/_shared/cabinet/` | Expert lens definitions library (new) | CREATE |
| `.claude/skills/_shared/cabinet/lens-musk.md` | Musk persona (feasibility/constraint) | CREATE |
| `.claude/skills/_shared/cabinet/lens-bezos.md` | Bezos persona (customer-backwards) | CREATE |
| `.claude/skills/_shared/cabinet/lens-marketing.md` | Hopkins/Ogilvy/Reeves/Lafley personas (positioning/proof) | CREATE |
| `.claude/skills/_shared/cabinet/lens-sales.md` | Patterson/Ellison/Chambers personas (route-to-revenue) | CREATE |
| `.claude/skills/_shared/cabinet/lens-sourcing.md` | Cook/Fung/Ohno/Toyoda personas (supply/quality) | CREATE |
| `.claude/skills/_shared/cabinet/lens-code-review.md` | Fowler/Beck/Kim/Gregg/Schneier etc. (technical cabinet) | CREATE |
| `.claude/skills/_shared/cabinet/filter-munger-buffett.md` | Munger+Buffett gatekeeping persona | CREATE |
| `.claude/skills/_shared/cabinet/prioritize-drucker-porter.md` | Drucker+Porter plan-weighted prioritization persona | CREATE |
| `.claude/skills/_shared/cabinet/stances.md` | Stance definitions and per-lens behavior modifications | CREATE |
| `.claude/skills/_shared/cabinet/dossier-template.md` | Idea Dossier format with provenance/confidence/rivalry | CREATE |
| `docs/business-os/strategy/<BIZ>/plan.user.md` | Business plans (must be bootstrapped) | CREATE |
| `docs/business-os/people/people.user.md` | People profiles (must be bootstrapped) | CREATE |
| Agent API (ideas schema) | Attribution + confidence fields | EXTEND (Phase 1) |

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

### Resolved (User Decisions — 2026-02-09)

- Q: **How many expert lenses in Phase 0?**
  - A: **All of them.** No phased subset — implement all 6 composite generators + filter + prioritization + code-review from the start.
  - Evidence: User direction: "answer all of them."
  - Impact: Significantly increases implementation scope. Every persona must be defined in depth before the system can run.

- Q: **Should the code-review cabinet run as part of every sweep, or as a separate invocation?**
  - A: **Integrated.** Code-review cabinet runs as part of the main sweep, not as a separate skill.
  - Evidence: User direction: "Code-review cabinet - integrated."
  - Impact: Single invocation covers all lenses including technical. Sweeps will be longer but comprehensive.

- Q: **How deep should persona definitions go in Phase 0?**
  - A: **In depth.** Full persona specs from the start — principles, signature questions, failure modes, domain boundaries, preferred artifacts, tone constraints.
  - Evidence: User direction: "in depth."
  - Impact: Substantial content creation work. Each of the 18+ expert personas needs a comprehensive definition.

- Q: **Cabinet "stance" mode — NEW CONCEPT (user-added)**
  - A: The cabinet has a **stance** parameter that shifts the focus of ALL expert lenses. The stance is not a filter — it changes what the lenses look for and prioritize.
  - Evidence: User direction: "we need to have a 'stance' ability for the cabinet, whereupon the idea generators shift their interests."
  - Defined stances:
    - **`improve-data`** (default starting stance): All lenses focus on filling gaps in current data — improving business plans, tools, people profiles, measurement infrastructure, knowledge bases. Ideas should be about building the information foundation.
    - **`grow-business`**: All lenses focus on developing the business — customer acquisition, revenue growth, product development, market expansion. Ideas should be about business outcomes.
    - (Additional stances may be defined later)
  - Impact: Every persona definition must describe how it behaves under each stance. The orchestrator must accept a stance parameter and propagate it to all lenses. This is a multiplier on persona definition complexity but makes the system significantly more useful.
  - Design implication: The stance shifts the diagnostic questions each lens asks, not just the ranking of outputs. A Musk lens under `improve-data` asks "what's the constraint on our data quality?" while under `grow-business` it asks "what's the constraint on our revenue growth?"

### Open (User Input Needed)

- Q: **Single skill vs multi-skill architecture?**
  - Why it matters: With ALL lenses + code-review integrated + in-depth personas, a single SKILL.md will be very large (3000+ lines). The alternative is an orchestrator + persona files in `_shared/cabinet/`.
  - Default assumption: Option D — orchestrator SKILL.md + persona definitions in `_shared/cabinet/` + all stages inline. The orchestrator reads persona files as needed. Medium risk — needs careful prompt architecture.

- Q: **Attribution in data model vs in content?**
  - Why it matters: Schema-level fields (D1 migration) enable querying and filtering. Content-level attribution (structured markdown) is simpler to implement but harder to query.
  - Default assumption: Phase 0 uses structured markdown in the `content` field. Phase 1 adds D1 fields. Low risk.

- Q: **Idea Dossier format — how structured?**
  - Why it matters: The spec describes a rich dossier format (provenance, confidence ledger, rivalry record). This is the core artifact.
  - Default assumption: Implement the full format from the spec (provenance, confidence ledger, rivalry record). Given the "in depth" direction, no reason to start minimal.

- Q: **Should Munger/Buffett and Drucker/Porter be separate skills or inline stages?**
  - Why it matters: Separate skills allow independent invocation. Inline keeps it compact.
  - Default assumption: Inline stages (keeps single invocation). Low risk.

- Q: **How are the business "tooling" analogs (lint/typecheck/test) implemented?**
  - Why it matters: Implementation format matters given the "in depth" direction.
  - Default assumption: Checklist sections in the Idea Dossier template, verified by the orchestrator. Low risk.

- Q: **How many stances should be defined initially?**
  - Why it matters: Each stance multiplies persona definition work (every lens needs stance-specific behavior).
  - Default assumption: Start with 2 stances (`improve-data`, `grow-business`). Add more as patterns emerge. The starting stance is `improve-data`.

- Q: **What triggers a stance change?**
  - Why it matters: Should the stance be a parameter to the skill invocation (e.g., `/ideas-go-faster --stance=grow-business`), or should it be stored as state that persists across sweeps?
  - Default assumption: Parameter to the invocation, defaulting to `improve-data`. No persistent state. Low risk.

---

## Confidence Inputs (for /plan-feature)

- **Implementation:** 60%
  - Strong: Skill orchestration pattern exists (improve-guide precedent). Single SKILL.md architecture proven at 900+ lines (plan-feature). Expert framework embedding proven (Musk algorithm in ideas-go-faster). Shared resource pattern (`_shared/`) supports modular persona files.
  - Weak: ALL lenses from day one + in-depth personas = massive content creation scope (18+ expert personas with full specs under multiple stances). Multi-stage pipeline with gates hasn't been done in this repo. Attribution requires content-level convention. Stance system adds a multiplier to persona definitions (each lens under each stance). Context window pressure — loading orchestrator + all persona files + all data sources in one session.
  - What would raise to 80%: Write 3 persona definitions (Musk, Bezos, Munger) with stance variants and test them in a dry-run. Validate context window can hold orchestrator + persona library + business data without degradation.

- **Approach:** 75%
  - Strong: Clear user direction — all lenses, in depth, integrated code-review, stance system with `improve-data` as default. The 10-section spec is extremely detailed. MACRO framework and Musk algorithm prove the pattern works. Stance concept elegantly solves "what should the system focus on" without needing separate skills.
  - Weak: Scope is very large. Risk that in-depth personas produce diminishing returns (20 lines of Hopkins principles may perform as well as 200). The stance multiplier on persona definitions could make the system unwieldy. Unclear how stance interacts with the Munger/Buffett filter (does stance affect their criteria too?).
  - What would raise to 85%: Define the stance mechanism precisely (how does it propagate to each stage?). Validate with a hand-run example under `improve-data` stance.

- **Impact:** 88%
  - Strong: Multi-lens ideation with stance control is a significant upgrade. `improve-data` stance directly addresses the #1 finding from the ideas-go-faster redesign (no analytics, no plans, no profiles). Full technical cabinet integrated means repo improvements are systematically identified. Confidence gating prevents noise.
  - Weak: Complexity may slow sweeps to 20-30 minutes. Volume of output may overwhelm review. Expert personas need fidelity to be useful — low-fidelity personas add noise, not signal.
  - What would raise to 90%: Comparative test showing Cabinet under `improve-data` stance identifies gaps the current single-lens sweep misses.

- **Testability:** 50%
  - Strong: Persona regression tests are part of the spec. Business tooling analogs (lint/typecheck) are inherently testable. Stance gives a clear axis to test against (same business state, different stances → different idea focus).
  - Weak: Output quality is highly subjective. No baseline data. Persona fidelity scoring doesn't have clear benchmarks. Stance behavior is hard to test (how do you verify a lens "shifted its interests" correctly?).
  - What would raise to 70%: Define 5 scenario tests per stance with expected expert outputs. Define measurable quality dimensions (e.g., "under improve-data stance, >70% of ideas relate to measurement/data gaps").

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Skill system (SKILL.md files, prompt-only, no TypeScript)
  - Agent API as data store (fail-closed)
  - Existing kanban pipeline (Cabinet feeds in, doesn't replace)
  - Existing skill naming conventions
- Rollout expectations:
  - Phase 0: Full cabinet — all lenses, in-depth personas, integrated code-review, stance system, content-level attribution, inline stages. Starting stance: `improve-data`.
  - Phase 1: D1 schema extensions for attribution, persona fidelity scoring, continuous improvement loop
  - Phase 2: Additional stances, regression test suite, prediction accuracy tracking
- Observability:
  - Decision logs in dossiers (who decided what and why)
  - Sweep reports show which lenses contributed which ideas
  - Confidence trends tracked across sweeps

---

## Suggested Task Seeds (Non-binding)

1. **Design the Idea Dossier schema** — Define the markdown template for dossiers with full provenance, confidence ledger, rivalry record, and decision log sections. This is the core artifact that makes the system real.

2. **Design the stance system** — Define how `improve-data` and `grow-business` stances propagate to each lens, each filter stage, and the orchestrator. Define what each lens looks for under each stance.

3. **Write in-depth persona definitions: Composite generators** — Full specs for all 6 idea-generating lenses (Musk, Bezos, Marketing, Sales, China-facing, Code-review sub-cabinet) with stance-specific behavior. Principles, signature questions, failure modes, domain boundaries, preferred artifacts, tone.

4. **Write in-depth persona definitions: Gatekeepers and prioritizers** — Full specs for Munger+Buffett (filter) and Drucker+Porter (plan-weighted prioritization) with stance-specific behavior.

5. **Write in-depth persona definitions: Technical code-review cabinet** — Full specs for all technical experts (Fowler, Beck, Martin, Kim, Gregg, Schneier, etc.) with stance-specific behavior.

6. **Write the Cabinet Secretary orchestrator skill** — Replaces ideas-go-faster SKILL.md. Accepts stance parameter. Dispatches to all lenses, enforces confidence gate, routes dossiers through filter and prioritization stages. Reads persona definitions from `_shared/cabinet/`.

7. **Design business linting/typechecking/testing checklists** — Business tooling analogs that systematically validate dossiers before routing.

8. **Bootstrap business plans** — The Cabinet system needs plans as inputs. Bootstrap BRIK, PIPE, PLAT, BOS plans via `/update-business-plan`.

9. **Bootstrap people profiles** — Same dependency. Bootstrap via `/update-people`.

10. **Write persona regression test scenarios** — Define expected outputs per lens per stance given a known business state. These become the "CI" for the cabinet.

11. **Validation run: Cabinet sweep under `improve-data` stance** — Run the full cabinet against current business state and verify output quality.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None — open questions have safe defaults. The most important decision (Phase 0 scope) can be made during planning.
- Recommended next step: Proceed to `/plan-feature cabinet-system`
