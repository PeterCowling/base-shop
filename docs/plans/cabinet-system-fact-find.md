---
Type: Fact-Find
Outcome: Planning          # doc intent: this fact-find exists to enable /plan-feature
Status: Ready-for-planning # 7 open Qs have safe defaults; 3 behavioral Qs resolved
Domain: Business-OS
Created: 2026-02-09
Last-updated: 2026-02-09
Feature-Slug: cabinet-system
Related-Plan: docs/plans/cabinet-system-plan.md
Business-Unit: BOS
---

# Cabinet System — Fact-Find Brief

> **Reading guide:** This document mixes three kinds of statement. Each is labeled:
>
> - **[FACT]** — Observable truth about the current system, with evidence
> - **[ASSUMPTION]** — Belief that has not yet been verified; may be wrong
> - **[PROPOSAL]** — Design decision or architectural choice for the Cabinet system; belongs to planning but included here for context
>
> Unlabeled statements in the System Context section are established facts about the existing system.

## Scope

### Summary

Evolve the `/ideas-go-faster` skill from a single-skill sweep into a multi-agent "Cabinet" system — a composite "team of rivals" idea factory where multiple expert lenses independently generate ideas, Munger+Buffett gatekeep and assign first priorities, Drucker+Porter re-prioritize against business plans, and a parallel technical cabinet reviews the codebase. The system introduces structured attribution, confidence gating (ideas vs data gaps vs hunches), persona fidelity testing, and a Q&A-seeded knowledge base for plans and profiles that is maintained as a byproduct of operating.

### Goals

*All goals are [PROPOSAL] — they define desired future state, not current state.*

1. **Composite ideation**: Multiple expert lenses (Musk, Bezos, Marketing, Sales, Sourcing/Quality, Code-review) independently generate ideas — not averaging viewpoints, but preserving competing framings
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

- Constraints: [FACT — these are hard boundaries of the current system]
  - Must work within Claude Code's skill system (SKILL.md files, prompt-only)
  - Single Claude Code session per invocation (no concurrent agents at runtime)
  - Agent API as primary data store (D1 is source of truth)
  - Phase 0: Pete triggers, system executes autonomously
- Assumptions: [ASSUMPTION — believed true but not yet verified]
  - Expert lenses are implemented as prompt sections within skill files, not separate processes
  - A single orchestrator skill can invoke sub-skills (precedent: `improve-guide` orchestrating `improve-en-guide` + `improve-translate-guide`)
  - The current agent API can be extended with new fields (attribution, confidence) but this is implementation work, not a prerequisite for Phase 0
  - Context window can hold orchestrator + all persona definitions + all business data without degradation (unverified — this is the highest-risk assumption)

---

## System Context (for readers without repo access)

This section explains the current system architecture and processes so that the gap analysis and proposed Cabinet system can be understood without reading any source code.

### What is Claude Code?

Claude Code is Anthropic's official CLI tool for Claude — an AI coding assistant that runs in the terminal. It can read files, edit code, run commands, search the web, and interact with APIs. It operates in a conversational loop: the user gives instructions, Claude Code reads the codebase, proposes changes, and the user approves or refines.

Claude Code has a **skill system**: reusable prompt files (`.claude/skills/<name>/SKILL.md`) that encode domain-specific workflows. When a user types `/<skill-name>` (e.g., `/fact-find`, `/build-feature`), the skill's prompt is loaded into Claude's context, giving it structured instructions for how to perform that task. Skills are **prompt-only** — they contain no executable code (no TypeScript, no Python). They are markdown files that shape Claude's behavior.

Skills can reference shared resources in `.claude/skills/_shared/` (reusable helpers like API calling conventions). Skills can also invoke other skills — for example, `improve-guide` orchestrates `improve-en-guide` and `improve-translate-guide` as sub-tasks. The largest skill is `plan-feature` at ~900 lines. The repo currently has 31 skills.

All skill execution happens within a single Claude Code session. There is no concurrent multi-agent runtime — when a skill says "step through each expert lens," that means Claude systematically works through each lens one at a time within one conversation.

### What is Business OS?

Business OS is a kanban-based project management system built as a Next.js application, deployed as a Cloudflare Worker at `https://business-os.peter-cowling1976.workers.dev`. Its database is Cloudflare D1 (SQLite-based), which is the **source of truth** for all business data — cards, ideas, people, stage documents.

Business OS exposes a REST **Agent API** at `/api/agent/` that Claude Code skills use to create and manage data. Authentication is via an `X-Agent-API-Key` header. The API follows a **fail-closed** rule: if any API call fails, the skill must stop and surface the error rather than falling back to writing files directly.

Business OS also has an **export job** that generates human-readable markdown files from the D1 database (e.g., `docs/business-os/cards/BRIK-ENG-0001.user.md`). These files are for reading/review only — skills must never write them directly.

### The Four Businesses

The system tracks four businesses, all currently owned by Pete (the sole team member in Phase 0):

| Code | Name | What It Is | Current Maturity |
|---|---|---|---|
| **BRIK** | Brikette | Multilingual hostel booking platform with 168+ travel guides across 18 locales. Revenue-generating, deployed to Cloudflare. | **L2** (Content Commerce), transitioning to L3 |
| **PIPE** | Product Pipeline | China sourcing to EU multi-channel commerce pipeline. Physical product retail. | **L1** (pre-launch, zero revenue, no Amazon seller account, no fulfillment validated) |
| **PLAT** | Platform | Shared infrastructure: `@acme/platform-core`, `@acme/design-system`, `@acme/ui`, `@acme/i18n`, auth, CMS. Supports all other businesses. | Infrastructure layer |
| **BOS** | Business OS | The kanban coordination system itself. Internal tooling for managing the other businesses. | Meta-coordination layer |

**Critical finding from the initial redesign fact-find** (2026-02-09, `docs/plans/ideas-go-faster-redesign-fact-find.md`):

[FACT] Despite Brikette having 168 guides, analytics is implemented but not active:
- Google Analytics: GA4 infrastructure is fully implemented (`apps/brikette/src/app/layout.tsx:102-119` — conditional script injection, `reportWebVitals.ts` — web vitals tracking, `BookPageContent.tsx:119-121` — `begin_checkout` conversion event). However, **no `GA_MEASUREMENT_ID` is configured** in any environment, so all tracking is disabled at runtime. The conditional `shouldLoadGA = IS_PROD && typeof GA_MEASUREMENT_ID === "string" && GA_MEASUREMENT_ID.length > 0` means GA never loads.
- No Search Console: no site verification files or meta tags found
- Conversion tracking: code exists (`gtag("event", "begin_checkout")`) but is unreachable without a configured GA measurement ID
- Net effect: the infrastructure exists but produces zero data — functionally equivalent to having no analytics

[FACT] Product Pipeline has zero revenue: no Amazon seller account, no fulfillment partner validated, no payment processing configured. Evidence: `businesses.json` shows PIPE at L1; no deployed storefront exists.

[FACT] XA (fashion e-commerce apps — exist in the monorepo at `apps/xa*` but are NOT one of the four tracked businesses in Business OS) is stuck at L1, blocked on guide infrastructure that Brikette has but XA has not adopted. Evidence: XA apps exist in `apps/` but have no guide/content system. XA is relevant to the Cabinet system only as context for the Sourcing/Quality lens (China supplier relationships) and as a potential future business to track.

[ASSUMPTION] Platform telemetry is disabled by default. No telemetry configuration code was found in `platform-core` during this audit — the claim originates from the initial redesign fact-find but could not be re-verified. If telemetry code exists, it is not in an obvious location.

**Bottom line:** No business in the portfolio has analytics *producing data* — Brikette has the infrastructure but no configuration. This is the primary motivation for the `improve-data` stance. The fix may be as simple as setting a `GA_MEASUREMENT_ID` environment variable.

### Business Maturity Model

Businesses progress through three maturity levels:

- **L1 — Catalog Commerce (Launch):** Functional storefront with products, cart, checkout. High customer acquisition cost (paid ads only, no organic). High support cost (fully manual). No reusable content assets.
- **L2 — Content Commerce (Growth):** Structured guides provide SEO-driven organic traffic and self-service support. Content is a compounding asset (unlike paid ads). 18-locale translation. AI-assisted content pipeline.
- **L3 — Integrated Operations (Maturity):** Data flows between apps. Same guide data powers website, email autodraft, guest portal, reception tools, chatbots. Operational dashboards. Cross-app analytics.

The model defines concrete "readiness thresholds" for each level (e.g., L2 requires "top 20 support questions have guides" and "organic traffic growing month-over-month").

### The Kanban Pipeline

Work items flow through a multi-stage pipeline managed by Business OS:

```
Raw Idea → Worked Idea → Card (Inbox) → Fact-finding → Planned → In progress → Done → Reflected
```

Each stage has a corresponding **Claude Code skill** that drives the transition:

| Transition | Skill | What Happens |
|---|---|---|
| Raw Idea → Worked Idea | `/work-idea` | Idea enriched with structured analysis, converted to a card |
| Card → Fact-finding | `/fact-find` | Evidence gathered about current state, blast radius, constraints |
| Fact-finding → Planned | `/plan-feature` | Implementation plan created with tasks, acceptance criteria, confidence scores |
| Planned → In progress | `/build-feature` | Tasks implemented via TDD, one at a time, with validation |
| In progress → Done | `/build-feature` | All tasks complete, proposes lane transition |
| Done → Reflected | Manual | Post-mortem captures learnings |
| (Any stage) | `/re-plan` | When confidence drops below 80%, investigate and update the plan |

**Confidence gating** is central: every task in a plan has a confidence score (0-100%). Tasks below 80% cannot be built — they must go through `/re-plan` first. This prevents building on uncertain foundations.

**Ideas** are the earliest-stage items. They have a simple schema:
- `Type`: "Idea" or "Opportunity"
- `ID`: e.g., `BRIK-OPP-0001`
- `Business`: which business this relates to
- `Status`: "raw", "worked", "converted", "dropped"
- `Tags`: array of strings
- `content`: free-form markdown

**Cards** are tracked work items with richer metadata (lane, priority, owner, due date, feature slug, plan link). Card IDs follow the format `<BUSINESS>-ENG-<SEQUENCE>` (e.g., `BRIK-ENG-0020`).

**Stage documents** track evidence and progress at each lifecycle phase. They are created via the Agent API and stored alongside cards.

### The Agent API

The REST API at `/api/agent/` provides these key endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/agent/ideas` | Create a new idea |
| `POST /api/agent/cards` | Create a card (returns `cardId`) |
| `GET /api/agent/cards/:id` | Read a card (returns entity + entitySha for concurrency) |
| `PATCH /api/agent/cards/:id` | Update a card (JSON Merge Patch, requires `baseEntitySha`) |
| `POST /api/agent/stage-docs` | Create a stage document for a card |
| `PATCH /api/agent/stage-docs/:cardId/:stage` | Update a stage document |
| `POST /api/agent/allocate-id` | Pre-allocate a card ID |
| `GET /api/agent/cards?business=BRIK` | List cards for a business |

All write operations use **optimistic concurrency** — you must provide a `baseEntitySha` (from the last read) when updating, and the API returns `409 Conflict` if the entity was modified by someone else since your read.

### How Skills Connect to Each Other

Skills form an interconnected ecosystem. The core **feature workflow** is a linear pipeline:

```
/fact-find → /plan-feature → /sequence-plan → /build-feature → /re-plan (if needed)
```

Each produces a specific artifact:
- `/fact-find` → `docs/plans/<slug>-fact-find.md` (evidence brief)
- `/plan-feature` → `docs/plans/<slug>-plan.md` (implementation plan with tasks)
- `/build-feature` → code changes, commits, plan updates
- `/re-plan` → updated plan with revised confidence scores

**Business OS coordination skills** operate alongside the feature workflow:
- `/ideas-go-faster` — business growth process auditor (the skill being evolved into the Cabinet system)
- `/scan-repo` — scans the codebase for changes and creates business-relevant ideas
- `/work-idea` — converts raw ideas into worked cards
- `/propose-lane-move` — proposes kanban lane transitions based on evidence
- `/update-business-plan` — updates business strategy documents
- `/update-people` — updates people/team profiles

**Content skills** handle guide management:
- `/improve-guide` → orchestrates `/improve-en-guide` + `/improve-translate-guide`

Skills reference each other's outputs. For example, `/ideas-go-faster` generates raw ideas that feed into `/work-idea`, which creates cards that feed into `/fact-find`, which produces briefs that feed into `/plan-feature`.

### What ideas-go-faster Does Today

The `/ideas-go-faster` skill was recently rewritten (730 lines) from a kanban board health checker into a business growth process auditor. In concrete terms, when invoked it:

1. **Reads all business data** via the Agent API — cards, ideas, business catalog, maturity model
2. **Reads business plans and people profiles** from the filesystem (if they exist — currently none do)
3. **Audits each business** against the MACRO framework — 31 diagnostic questions across 5 categories:
   - **Measure**: Do we have analytics? Can we measure what's working?
   - **Acquire**: How are we getting customers? What's the acquisition cost?
   - **Convert**: What's the conversion funnel? Where do people drop off?
   - **Retain**: Are customers coming back? What's the retention mechanism?
   - **Operate**: Are internal processes efficient? What's manual that should be automated?
4. **Diagnoses the #1 constraint** per business using the Elon Musk 5-step algorithm (Question every requirement → Delete unnecessary process → Simplify → Accelerate → Automate — in strict order)
5. **Generates 3-5 interventions** per business, scored by `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
6. **Creates raw ideas** via the Agent API (tagged `sweep-generated`)
7. **Auto-works-up the top 3 ideas** into cards with fact-find stage documents (tagged `sweep-auto`)
8. **Produces a sweep report** with constraint diagnosis, interventions, plan/profile gaps, and trajectory forecasts

**What it lacks** (and what the Cabinet system addresses):
- Only one analytical lens (Musk). No customer-backwards (Bezos), marketing, sales, sourcing, or technical perspectives.
- No attribution — ideas are tagged but not attributed to a specific analytical framework or reasoning chain.
- No confidence tiers — all ideas are treated equally regardless of how speculative they are.
- No gatekeeping — ideas go straight from generation to work-up without a kill/hold/promote filter.
- No plan-weighted prioritization — priorities are scored by formula but not evaluated against business strategy.
- No persona definitions — the Musk algorithm is embedded in the constitution but not formally defined as a testable persona.

### Business Plans and People Profiles

Two supporting data stores are defined but currently **completely empty**:

**Business Plans** (`docs/business-os/strategy/<BIZ>/plan.user.md`):
- Schema defined in the `/update-business-plan` skill
- Sections: Strategy (focus areas), Risks (active threats), Opportunities (validated ideas), Learnings (append-only log), Metrics (KPIs)
- Intended to be living documents updated after card reflections, repo scans, and strategic decisions
- **Current state: No plans exist for any business**

**People Profiles** (`docs/business-os/people/people.user.md`):
- Schema defined in the `/update-people` skill
- Sections: Roles, Responsibilities, Capabilities, Gaps, Availability
- Intended to track team capacity, skills, and allocation
- **Current state: No profiles exist**

Both the current `/ideas-go-faster` skill and the proposed Cabinet system depend on these as inputs. The current skill handles their absence gracefully (flags it as a critical finding). The Cabinet system amplifies this dependency because the Drucker/Porter prioritization stage needs business plans to weight priorities, and the task assignment stage needs people profiles to assess feasibility.

---

## Gap Analysis: Current State vs Cabinet System

### What Exists Today

The current `/ideas-go-faster` skill (730 lines, just rewritten) provides:

| Capability | Current Implementation | Evidence |
|---|---|---|
| Business process audit | MACRO framework — 31 diagnostic questions across Measure, Acquire, Convert, Retain, Operate (see System Context above) | `ideas-go-faster/SKILL.md` |
| Constraint diagnosis | One constraint per business, evidence-required, confidence-scored | `ideas-go-faster/SKILL.md` |
| Intervention ordering | Elon Musk 5-step algorithm (Question → Delete → Simplify → Accelerate → Automate, strict ordering) | `ideas-go-faster/SKILL.md` |
| Idea generation | Single-lens (Musk framework only), 3-5 interventions per business, scored by priority formula | `ideas-go-faster/SKILL.md` |
| Idea pipeline | Two-stage: raw ideas created via API → auto-work-up top 3 to cards with fact-find stage docs | `ideas-go-faster/SKILL.md` |
| Plan integration | Reads business plans from filesystem, compares stated strategy to observable reality | `ideas-go-faster/SKILL.md` |
| Profile integration | Reads people profiles from filesystem, uses for task allocation feasibility | `ideas-go-faster/SKILL.md` |
| Forecasting | Prose trajectory statements per business (where will this business be in 30/60/90 days?) | `ideas-go-faster/SKILL.md` |
| Attribution | None — ideas are tagged `sweep-generated` and `sweep-auto` but no originator tracking or reasoning chain | `ideas-go-faster/SKILL.md` |
| Confidence gating | Scoring rubric (`Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`) but no classification into tiers (idea vs data gap vs hunch) | `ideas-go-faster/SKILL.md` |
| Expert lenses | One lens only (Musk algorithm embedded in skill constitution) | `ideas-go-faster/SKILL.md` |

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
| **Confidence gate mechanism** | Enforceable "presentable idea" definition + Data Gap Proposal lifecycle | LARGE — no gate definition, no DGP entity |
| **Dedup / rival clustering** | Cluster similar ideas from multiple lenses before filtering | LARGE — no dedup mechanism exists |
| **Pipeline reconciliation** | Cabinet pipeline maps cleanly onto existing kanban pipeline | MEDIUM — two pipeline definitions coexist without explicit mapping |

### Gap Detail: Confidence Gate Mechanism

[FACT] The current system has a priority scoring formula but no enforceable gate between "idea generated" and "idea enters filter stage." All ideas generated by the sweep are treated as equally valid — there is no mechanism to classify items by confidence tier or to route low-confidence items differently.

[FACT] The existing kanban pipeline has confidence gating at the *task* level (80% threshold for building), but nothing at the *idea* level.

**What's missing:**

1. **"Presentable Idea" definition** — [PROPOSAL] A minimum completeness checklist that the orchestrator must verify before an idea can proceed to the Munger/Buffett filter:
   - Customer/user identified
   - Problem statement present
   - At least one feasibility signal (technical or commercial)
   - Evidence or reasoning chain (not just assertion)
   - Business alignment (relates to a known business or plan gap)

2. **Decision Gap Proposal lifecycle** — [PROPOSAL] When an idea fails the presentable threshold, it should become a structured Decision Gap Proposal with one of three gap types (data, timing, dependency):
   - What information/trigger/prerequisite is missing that prevented a full idea?
   - What would you need to learn/wait for/complete to make this presentable?
   - Where should this entity live?
     - [FACT] The current idea status enum is hard-coded as `raw|worked|converted|dropped` in a Zod schema (`IdeaStatusSchema` in `businessOsIdeas.server.ts:25`). Adding `data-gap` would require an API migration. The `/work-idea` skill hard-requires `Status: raw` at entry (`work-idea/SKILL.md:77`).
     - **Phase 0 decision: No new status values.** Decision Gap Proposals are stored as Idea entities with `Status: raw` and `Tags: ["decision-gap", "sweep-generated"]`. The `Confidence-Tier: data-gap|timing-gap|dependency-gap` field lives in the Dossier Header inside the `content` field. This avoids API migration and preserves `/work-idea` compatibility.
     - Phase 1 may add `decision-gap` as a status value if query/filter performance requires it.
   - Who picks up Decision Gap Proposals? They feed into the next sweep under `improve-data` stance as prioritized investigation targets (identified by `Tags` containing `decision-gap`).
   - How do they become presentable ideas later? When the gap is filled (e.g., analytics installed for data gaps, milestone reached for timing gaps, blocking card completed for dependency gaps), the next sweep can promote the DGP by updating its Dossier Header `Confidence-Tier` to `presentable` and removing the `decision-gap` tag.

3. **Hunch suppression** — [PROPOSAL] Items that fail both the presentable and data-gap thresholds are logged in the sweep report but not persisted as entities. They die quietly. This prevents noise accumulation.

### Gap Detail: Dedup / Rival Clustering

[FACT] With 6+ lenses generating independently, the system will produce duplicates, near-duplicates, and mutually exclusive rival proposals for the same opportunity. The current single-lens system does not face this problem.

**What's missing:**

[PROPOSAL] A **Cluster & Rivalry Merge** step between composite generation and the Munger/Buffett filter:

1. **Cluster similar ideas** — The orchestrator groups ideas that address the same problem/opportunity across lenses
2. **Create a single dossier per cluster** — The dossier preserves each lens's variant as a "variant proposal" with full attribution
3. **Record the rivalry** — Where lenses disagree (approach, priority, feasibility), this becomes the "rivalry record" inside the dossier
4. **Pass clusters to filter** — Munger/Buffett evaluate one dossier per cluster, not N duplicate ideas

Without this step, Munger/Buffett waste attention repeatedly killing the same idea expressed six different ways, and the system loses the valuable signal of *where lenses agree and disagree*.

**Canonical representation question:** [ASSUMPTION] A cluster is stored as a single Idea entity with structured content containing variant proposals by lens. Rivalry and agreement are explicit sections.

### Gap Detail: Pipeline Reconciliation

[FACT] Two pipeline definitions coexist in the system:

**Existing kanban pipeline** (what the system runs today):
```
Raw Idea → Worked Idea → Card (Inbox) → Fact-finding → Planned → In progress → Done → Reflected
```

**Proposed Cabinet pipeline** (what this brief describes):
```
Composite generation → Confidence gate → Cluster/dedup → Munger/Buffett filter → Work-up → Drucker/Porter priority → Fact-finding → Kanban execution
```

**The ambiguity:** The brief does not specify what entity type transitions at each stage, or where the Cabinet pipeline hands off to the kanban pipeline.

[PROPOSAL] Reconciliation — the Cabinet pipeline operates *before* the kanban pipeline:

| Cabinet Stage | Entity Type | Kanban Equivalent | Notes |
|---|---|---|---|
| Composite generation | Idea Candidates (in-memory during sweep) | — | Not yet persisted |
| Confidence gate | Idea Candidates → Presentable Ideas / Decision Gap Proposals / Hunches | — | Gate determines persistence |
| Cluster/dedup | Presentable Ideas → Clustered Dossiers | — | Merge similar ideas |
| Munger/Buffett filter | Dossiers → Kill / Hold / Promote | Raw Idea | Promoted dossiers become `Status: raw` ideas in D1 |
| Work-up | Raw Ideas → Worked Ideas | Worked Idea | Uses existing `/work-idea` skill |
| Drucker/Porter priority | Worked Ideas → P1-P5 priorities | — | Prioritizes BEFORE card creation (v2.1 stage reorder) |
| Card creation | P1-P3 Worked Ideas → Cards | Card (Inbox) | Only P1-P3 get cards; P4-P5 remain as worked ideas |
| Kanban execution | Cards flow through fact-find → plan → build | Fact-finding → Planned → In progress → Done | Uses existing feature workflow |

**Critical change from current behavior:** [PROPOSAL] The current `/ideas-go-faster` auto-works-up the top 3 ideas immediately (no filter stage). Under the Cabinet model, ideas must pass through Munger/Buffett *before* work-up. This means the auto-work-up behavior moves from Step 7-8 to after the filter stage.

**v2.1 stage reorder:** [PROPOSAL] Drucker/Porter now runs BEFORE card creation (Stage 5 before Stage 6). Worked ideas receive priorities from Drucker/Porter, then only P1-P3 become cards. This eliminates PATCH operations to update card priorities after creation. Cards are created once with correct final priority.

### Gap Detail: Expert Lenses

**Current state:** One lens (Elon Musk 5-step algorithm embedded in constitution)

**Cabinet requires 6 composite idea generators + 1 technical cabinet:**

| Lens | Expert(s) | What They Generate | Exists? |
|---|---|---|---|
| Feasibility/constraint | Elon Musk | Shortest credible path, bottleneck removal | YES (embedded in constitution) |
| Customer-backwards | Jeff Bezos | Problem/who/why-now, press-release narrative | NO |
| Marketing/positioning | Hopkins, Ogilvy, Reeves, Lafley | USP, proof, positioning, testability | NO |
| Sales mechanics | Patterson, Ellison, Chambers | Route-to-revenue, pricing, deal mechanics | NO |
| Sourcing/quality | Finder, Bridge, Mover | Product selection, China sourcing, negotiation, logistics, landed cost | YES (v2.0) |
| Technical code-review | Fowler, Beck, Kent, Kim, Gregg, Schneier, etc. | Repo improvements, architecture, testing, security | NO |

**Plus 2 filter/prioritization stages:**

| Stage | Expert(s) | What They Do | Exists? |
|---|---|---|---|
| First filter | Munger + Buffett | Kill/hold/promote with inversion, opportunity cost, circle of competence | NO |
| Plan-weighted priority | Drucker + Porter | Re-prioritize against objectives, strategy, competitive posture | NO |

### Gap Detail: Data Model

**Current idea schema** (from the Business OS API server code — `businessOsIdeas.server.ts`):

```typescript
// IdeaFrontmatterSchema (line 39)
{
  Type: "Idea" | "Opportunity",
  ID?: string,                    // optional
  Business?: string,              // optional
  Status?: "raw" | "worked" | "converted" | "dropped",  // optional
  "Created-Date"?: string,        // optional
  Tags?: string[],                // optional
  "Title-it"?: string,            // optional (Italian title)
}

// IdeaSchema extends IdeaFrontmatterSchema (line 54)
{
  ...IdeaFrontmatterSchema,
  content: string,                // required — free-form markdown
  "content-it"?: string,          // optional (Italian content)
  filePath: string,               // required — storage path
  fileSha?: string,               // optional — for concurrency
}
```

Note: Most frontmatter fields are optional. The required fields in the full schema are `Type`, `content`, and `filePath`. The `Status` field is the one relevant to the Cabinet system's confidence gating — and it is constrained to the four-value enum by a Zod schema (line 25).

**Cabinet requires (minimum new fields):**

| Field | Purpose | In Current Schema? |
|---|---|---|
| `Originator` | Which lens generated the idea | NO |
| `Contributors` | Who else added substance | NO |
| `Confidence-Tier` | presentable / data-gap / hunch | NO |
| `Confidence-Score` | Numerical from scoring rubric | NO (in markdown only) |
| `Impact-Type` | revenue / margin / capacity / risk-reduction / quality / velocity | NO |
| `Impact-Mechanism` | How the impact manifests (1 sentence) | NO |
| `Impact-Band` | $0-1k / $1k-10k / $10k-100k / $100k-1M / $1M+ or Low / Medium / High / Very-High | NO |
| `Impact-Confidence` | 0-100% confidence in impact estimate | NO |
| `Decision-Log` | Munger/Buffett decision, Drucker/Porter decision | NO |
| `Rivalry-Record` | Best argument for/against/alternative | NO |
| `Pipeline-Stage` | Which stage of the 6-stage pipeline | NO (only inbox/worked) |
| `Evidence-Ledger` | Structured claims + evidence + unknowns | NO (free-form markdown) |

**Architectural question:** Should these be schema-level fields in D1 (the SQLite database backing Business OS, which enables querying/filtering), or structured sections within the markdown `content` field (simpler to implement, harder to query)?

**[PROPOSAL] Parseable Attribution Format (Phase 0)**

If Phase 0 stores attribution in the `content` field, it must use **strict, machine-parseable markers** (not free-form prose) so that Phase 1 migration to D1 fields is reliable. Without strict markers, provenance data becomes unparseable — defeating the purpose of an attribution-centric system.

Proposed "Dossier Header" block at the top of every idea's `content` field:

```markdown
<!-- DOSSIER-HEADER -->
Originator-Lens: musk
Contributors: bezos, marketing
Confidence-Tier: presentable
Confidence-Score: 72
Pipeline-Stage: worked
Cluster-ID: BRIK-CLU-001
Rival-Lenses: sales, sourcing
<!-- /DOSSIER-HEADER -->

<!-- DECISION-LOG -->
## Munger
Verdict: promote
Rationale: Low downside, high optionality

## Buffett
Verdict: promote
Rationale: Within circle of competence

## Drucker
Verdict: P2
Rationale: Aligns with Q1 focus area

## Porter
Verdict: P2
Rationale: Strengthens differentiation
<!-- /DECISION-LOG -->

## Idea Body
...
```

**Dossier Header grammar rules:**

| Rule | Spec |
|---|---|
| Delimiters | `<!-- DOSSIER-HEADER -->` open, `<!-- /DOSSIER-HEADER -->` close. Same for `DECISION-LOG`. |
| Header fields | One per line. Format: `Key: value`. No multiline values. |
| Allowed characters in header values | `[a-z0-9_-,. ]` (lowercase alphanumeric, underscore, hyphen, comma, space, dot). No pipes, quotes, or newlines. |
| List values | Comma-separated, no spaces after commas allowed in parser (trim both). E.g., `Contributors: bezos, marketing` |
| Enum fields | `Confidence-Tier`: `presentable` / `data-gap` / `hunch`. `Pipeline-Stage`: `candidate` / `filtered` / `promoted` / `worked` / `prioritized`. Verdicts: `promote` / `hold` / `kill` or `P1`-`P5`. |
| Decision rationale | Lives in the `DECISION-LOG` block, not in the header. One `## Expert` section per decision-maker. `Verdict:` and `Rationale:` on separate lines. Rationale is free-text (multiline allowed within its section, terminated by next `##` or `<!-- /DECISION-LOG -->`). |
| Parsing | Header block: line-split → key-value split on first `:`. Decision block: section-split on `## ` → extract Verdict/Rationale per section. |

This separation keeps the header strictly machine-parseable (no free text) while allowing decision rationale to be expressive.

**[ASSUMPTION] Phase 1 minimal migration field set:** `Originator-Lens`, `Confidence-Tier`, `Pipeline-Stage`, `Cluster-ID` — the four fields needed to unlock filtering and reporting. Decision logs and rivalry records can remain in content longer.

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

**[PROPOSAL] Maintenance loop — what events trigger plan/profile updates:**

The brief states plans and profiles should be "maintained as a byproduct of operating," but does not define the triggers. Proposed update triggers:

| Event | What Gets Updated | Mechanism |
|---|---|---|
| After each Cabinet sweep | Plan: gaps/metrics sections (what's missing, what's measured) | Orchestrator calls `/update-business-plan` with sweep findings |
| After each card reflection (Done → Reflected) | Plan: learnings section. Profile: capabilities (skills learned), gaps (discovered needs) | `/session-reflect` or manual `/update-business-plan` + `/update-people` |
| After a large build completes | Profile: capabilities (what skills were exercised), responsibilities (ownership changes) | `/update-people` triggered by `/build-feature` completion |
| After supplier/partner interactions | Plan: risks, opportunities. Profile: domain knowledge | Manual `/update-business-plan` |
| Monthly review | Plan: full audit. Profile: full audit | Pete-triggered comprehensive review |

**Minimal plan/profile content to be useful for the Cabinet system:**
- **Business Plan minimum:** Current focus areas (top 3 priorities), known risks (top 3), target metrics (at least 1 per business)
- **People Profile minimum:** Current workload (cards in progress), primary skill areas, availability estimate

Without at least this minimum, the Drucker/Porter stage has nothing to weight against, and task assignment has no feasibility input.

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
| `.claude/skills/_shared/cabinet/lens-sourcing.md` | Finder/Bridge/Mover personas (startup China-to-EU sourcing) | DONE (v2.0) |
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

- **Skill orchestration precedent:** The `improve-guide` skill invokes `improve-en-guide` and `improve-translate-guide` as sub-tasks. This proves that a parent skill can dispatch to child skills within a single Claude Code session — critical for the Cabinet Secretary orchestrator pattern.
- **Shared resources pattern:** Reusable helper files in `.claude/skills/_shared/` (e.g., `card-operations.md` for API calling conventions, `stage-doc-operations.md` for stage document lifecycle) are referenced by multiple skills. The proposed Cabinet persona library would follow this same pattern.
- **Frameworks-as-personas:** The codebase already uses analytical frameworks as implicit personas — MACRO framework acts as a business auditor, the maturity model acts as a strategic evaluator, the confidence rubric acts as an evidence assessor. The Cabinet system makes this pattern explicit and formal.
- **Prompt-only architecture:** All skills are SKILL.md files containing instructions in markdown. No executable code (no TypeScript, no Python). The Cabinet system must follow this constraint — expert "personas" are prompt sections, not software agents.
- **Agent API is source of truth:** The D1 database (via REST API) is the canonical data store. Markdown files in the repo are generated exports for human reading. Skills must use the API for all create/read/update operations.

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

Decisions below were made by Pete during the initial Cabinet system design session (Claude Code session `624ba17a`, 2026-02-09). Verbatim quotes are from Pete's messages in that session.

- Q: **How many expert lenses in Phase 0?**
  - A: **All of them.** No phased subset — implement all 6 composite generators + filter + prioritization + code-review from the start.
  - Source: Pete, verbatim: "answer all of them"
  - Impact: [PROPOSAL] Significantly increases implementation scope. Every persona must be defined in depth before the system can run.

- Q: **Should the code-review cabinet run as part of every sweep, or as a separate invocation?**
  - A: **Integrated.** Code-review cabinet runs as part of the main sweep, not as a separate skill.
  - Source: Pete, verbatim: "Code-review cabinet - integrated"
  - Impact: [PROPOSAL] Single invocation covers all lenses including technical. Sweeps will be longer but comprehensive. See "Technical cabinet trigger conditions" in Open Questions for how to avoid wasted attention.

- Q: **How deep should persona definitions go in Phase 0?**
  - A: **In depth.** Full persona specs from the start — principles, signature questions, failure modes, domain boundaries, preferred artifacts, tone constraints.
  - Source: Pete, verbatim: "in depth"
  - Impact: [PROPOSAL] Substantial content creation work. Each of the 18+ expert personas needs a comprehensive definition.

- Q: **Cabinet "stance" mode — NEW CONCEPT (user-added)**
  - A: The cabinet has a **stance** parameter that shifts the focus of ALL expert lenses. The stance is not a filter — it changes what the lenses look for and prioritize.
  - Source: Pete, verbatim: "we need to have a 'stance' ability for the cabinet, whereupon the idea generators shift their interests — when the stance is 'improve data' the ideas should be more about filling gaps in current data i.e. improving plans, tools, people profiles etc.; when the stance is 'grow business', we should be more focused on developing the business"
  - Defined stances:
    - **`improve-data`** (default starting stance): All lenses focus on filling gaps in current data — improving business plans, tools, people profiles, measurement infrastructure, knowledge bases. Ideas should be about building the information foundation.
    - **`grow-business`**: All lenses focus on developing the business — customer acquisition, revenue growth, product development, market expansion. Ideas should be about business outcomes.
    - (Additional stances may be defined later)
  - Impact: [PROPOSAL] Every persona definition must describe how it behaves under each stance. The orchestrator must accept a stance parameter and propagate it to all lenses. This is a multiplier on persona definition complexity but makes the system significantly more useful.
  - [ASSUMPTION] The stance shifts the diagnostic questions each lens asks, not just the ranking of outputs. A Musk lens under `improve-data` asks "what's the constraint on our data quality?" while under `grow-business` it asks "what's the constraint on our revenue growth?" See "Stance boundary" in Open Questions for unresolved scope.

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

### Resolved (Defaults Adopted — 2026-02-09)

These were open questions whose defaults have been adopted as decisions. They can be revisited during planning if evidence contradicts them.

### Resolved (v2.1 Operational Decisions — 2026-02-09)

These decisions were made during the v2.1 operational design session and document concrete runtime behaviors, failure policies, and data flow mechanisms. They represent implementation-level decisions that inform the plan.

1. **API as business source-of-truth (v2.1 section 5)**
   - A: **`businesses.json` is no longer the source.** Stage 1 (preflight) fetches business catalog from `GET /api/agent/businesses`. If the API call fails, treat as fatal preflight failure. The sweep cannot proceed without business data.
   - Rationale: D1 is source of truth. Eliminates stale file reads and ensures sweep sees live business state.
   - Impact: [PROPOSAL] Orchestrator preflight includes business catalog fetch with failure handling. No fallback to JSON files.

2. **Existing Priority Set (v2.1 section 11)**
   - A: **Preflight collects existing open cards + prior sweep-generated items per business.** Sub-experts check against this set before proposing new ideas. If an opportunity is already covered by an open card or prior sweep item, log a Reaffirmation (supports existing priority) or Addendum (adds detail to existing item) instead of creating a new idea.
   - Rationale: Prevents duplicate work. Acknowledges that reaffirmation ("this still matters") is valuable signal even when not creating new cards.
   - Impact: [PROPOSAL] Preflight includes `GET /api/agent/cards?business=<BIZ>&status=open` and `GET /api/agent/ideas?tags=sweep-generated`. Each lens receives the existing set as context. Reaffirmations/Addendums are logged in sweep report but do not create new entities.

3. **Impact fields (v2.1 section 8)**
   - A: **Dossiers now include Impact-Type, Impact-Mechanism, Impact-Band, Impact-Confidence.** These fields feed into Drucker/Porter prioritization and global top-K selection.
   - Field definitions:
     - `Impact-Type`: revenue | margin | capacity | risk-reduction | quality | velocity
     - `Impact-Mechanism`: How the impact manifests (free text, 1 sentence)
     - `Impact-Band`: $0-1k | $1k-10k | $10k-100k | $100k-1M | $1M+ (for revenue/margin), or Low | Medium | High | Very-High (for other types)
     - `Impact-Confidence`: 0-100% (how confident in the impact estimate)
   - Rationale: Makes priority scoring transparent and defensible. Drucker/Porter can weight by plan alignment × impact band × impact confidence.
   - Impact: [PROPOSAL] Dossier Header grammar adds 4 impact fields. Lenses must estimate impact explicitly.

4. **Decision Gap Proposals renamed (v2.1 section 13)**
   - A: **"Data Gap Proposal" renamed to "Decision Gap Proposal" with three gap types.**
   - Gap-Type values:
     - `data`: Missing information prevents decision (requires VOI-Score: 0-100 measuring value of information)
     - `timing`: Decision is premature, needs calendar trigger (no VOI-Score required; uses Trigger field: date or milestone)
     - `dependency`: Decision blocked on another card/task (no VOI-Score required; uses Blocks field: card IDs)
   - Rationale: Not all gaps are data problems. Some ideas are right but premature. Broadening the concept makes the system more realistic.
   - Impact: [PROPOSAL] Dossier Header grammar adds `Gap-Type` and conditional `VOI-Score`/`Trigger`/`Blocks` fields. Confidence gate routes to DGP with appropriate type. Timing gaps stay in the backlog until trigger fires. Dependency gaps link to blocking cards.

5. **Two-phase failure policy (v2.1 section 2)**
   - A: **Fatal for preflight reads + analysis inputs. Best-effort for persistence with strict accounting.**
   - Phase 1 (Preflight + Analysis): All GET operations must succeed. Failures are fatal. Includes: business catalog, existing cards/ideas, plans, profiles, repo state.
   - Phase 2 (Persistence): POST/PATCH failures are logged but do not abort. Sweep report includes success/failure accounting per entity. Partial success is acceptable.
   - Rationale: Don't run analysis on incomplete data (garbage in, garbage out). But don't lose completed analysis work if persistence has transient failures. Fail-closed where it matters, best-effort where it's recoverable.
   - Impact: [PROPOSAL] Orchestrator has two error handling modes. Stage 1-5 use fail-fast. Stage 6-7 use try-catch with accounting.

6. **Stage reordering (v2.1 implied)**
   - A: **Drucker/Porter now runs BEFORE card creation (Stage 5 before Stage 6).** No PATCH calls needed to update priorities after card creation.
   - Old order: Filter → Work-up → Create cards → Drucker/Porter re-prioritizes via PATCH
   - New order: Filter → Work-up → Drucker/Porter prioritizes → Create cards with final priority
   - Rationale: Eliminates a whole class of PATCH operations. Cleaner data flow. Cards are created once with correct priority.
   - Impact: [PROPOSAL] Pipeline reconciliation section needs update. Stage 5 is Drucker/Porter (operates on worked ideas), Stage 6 is card creation (only for P1-P3).

7. **Card creation threshold (v2.1 implied)**
   - A: **Only P1-P3 get cards by default. P4-P5 are idea entities only.**
   - Rationale: Kanban board doesn't need low-priority speculative items cluttering Inbox. They remain as worked idea entities that can be promoted later.
   - Impact: [PROPOSAL] Stage 6 filters by priority before calling `POST /api/agent/cards`. P4-P5 remain as worked ideas with status=worked.

8. **Global top-K selection (v2.1 section 8)**
   - A: **Stage 7 selects top K globally (not per business) using Priority > Impact-Band > Impact-Confidence > Confidence-Score.**
   - Old approach (implied): Per-business top-N work-up
   - New approach: Global top-K selection across all businesses. If BRIK has 10 P1 ideas and PIPE has 0, all K slots can go to BRIK.
   - Rationale: Pete's attention is the constraint. Allocate to highest-value opportunities regardless of business boundary.
   - Impact: [PROPOSAL] Orchestrator collects all promoted dossiers, sorts globally, takes top K. The `/work-idea` invocations follow the global ranking.

9. **Technical cabinet triggers (v2.1 section 15)**
   - A: **Explicit file-based diff artifact at `docs/business-os/engineering/repo-diff.user.md`.** If technical cabinet is triggered but no diff artifact exists, skip code-review lenses with a note in sweep report.
   - Rationale: Don't waste technical cabinet attention re-analyzing unchanged code. The diff artifact is the signal that repo state changed meaningfully.
   - Impact: [PROPOSAL] Preflight checks for `repo-diff.user.md` existence. If technical trigger fires but no artifact, log "Technical cabinet: skipped (triggered but no diff artifact)" and proceed without code-review lenses.

10. **Traction mode for Drucker/Porter (v2.1 section — grow-business acceleration)**
   - A: **Under `grow-business` stance, Drucker/Porter activates traction mode for market-facing L1-L2 businesses (BRIK, PIPE).** Infrastructure businesses (PLAT, BOS) use standard Drucker/Porter.
   - Key behaviors:
     - P1 = within 7 days of starting work, produces market-facing output or real market test
     - P2 = within 14-30 days, enables or compounds traction
     - P1 cap: max 3 per business per sweep
     - Rigor Pack (5 components) mandatory for P1/P2: Objective & Contribution Card, Traction Test Card, Trade-off Statement, Evidence & Unknowns, Abandonment Note
     - Rigor Pack pre-populates fact-find stage doc (Stage 7), enabling fast-track execution
     - Reversibility rule: Munger/Buffett's downside assessment determines rigor level (bounded/reversible → Rigor Pack; cautious → Full Strategy Pack)
   - Rationale: Early-stage market-facing businesses need speed-to-traction, not heavy analysis. Rigor Pack ensures minimum viable rigor without becoming a delay mechanism. Reconciles with fact-find by making the Rigor Pack the fact-find doc for traction P1/P2.
   - Impact: [PROPOSAL] Stage 5 outputs Rigor Pack alongside Decision Log for traction-mode P1/P2. Stage 7 uses Rigor Pack as fact-find template instead of standard template. Weekly traction cadence documented as recommended rhythm.

- Q: **Stance boundary — which stages are stance-sensitive?**
  - A: **Generators are stance-sensitive. Gatekeepers are mostly stance-invariant. Prioritizers use stance as plan-weight emphasis.**
    - **Generators:** Stance-sensitive (they look in different directions based on stance)
    - **Munger/Buffett:** Stance-invariant (truth, downside, opportunity cost are stance-independent evaluation criteria — their job is to kill bad ideas regardless of what the stance wants)
    - **Drucker/Porter:** Stance is effectively "the plan emphasis" — stance shifts which plan targets are weighted more heavily, but does not override plan-level priorities
  - Rationale: This prevents incoherent priority arguments ("stance says this matters" vs "Munger says this is nonsense"). Gatekeepers evaluate truth; stance shapes search direction.

- Q: **Priority formula: Time-to-signal definition**
  - A: **Rename to `Signal-Speed` and define as a score (0-1 where 1 = fastest feedback).** The formula becomes: `Priority = (Impact × Confidence × Signal-Speed) / (Effort × (1 + Risk))`.
  - Rationale: [FACT] The current `ideas-go-faster/SKILL.md` does not define the unit or scale of `Time-to-signal`. If interpreted as literal duration, the formula is inverted (slower = higher priority). Renaming eliminates the ambiguity. The current SKILL.md should also be patched to use `Signal-Speed` for consistency.

- Q: **Technical cabinet trigger conditions**
  - A: **Integrated with skip logic.** "Integrated" (Pete's decision) defines the deployment model (part of the sweep), not the execution policy. The orchestrator checks trigger conditions before invoking technical lenses:
    - Run technical cabinet when any of: `/scan-repo` has detected meaningful diffs since last sweep, OR stance is `improve-data`, OR Pete explicitly requests it (e.g., `/ideas-go-faster --force-code-review`)
    - If no trigger fires, the orchestrator skips technical lenses and notes "Technical cabinet: skipped (no trigger)" in the sweep report.
  - Rationale: This preserves Pete's "integrated" intent while avoiding wasted attention on unchanged code.

---

## Confidence Inputs (for /plan-feature)

- **Implementation:** 60% *(revised up from 55% — v2.1 operational design provides concrete runtime behaviors, failure policies, and stage ordering)*
  - Strong: Skill orchestration pattern exists (improve-guide precedent). Single SKILL.md architecture proven at 900+ lines (plan-feature). Expert framework embedding proven (Musk algorithm in ideas-go-faster). Shared resource pattern (`_shared/`) supports modular persona files. Two-phase failure policy (fatal for preflight, best-effort for persistence) is well-defined. Stage reordering (Drucker/Porter before card creation) eliminates PATCH operations. Dedup mechanism (Existing Priority Set check) prevents duplicate work. Impact fields provide transparent priority justification.
  - Weak: ALL lenses from day one + in-depth personas = massive content creation scope (18+ expert personas with full specs under multiple stances). Multi-stage pipeline with gates hasn't been done in this repo. Parseable attribution format needs design before any implementation. Confidence gate mechanism needs "presentable idea" definition. Dedup/clustering (lens-level, not just vs existing) has no precedent in the repo. Stance system adds a multiplier to persona definitions. Context window pressure — loading orchestrator + all persona files + all data sources in one session (unverified).
  - What would raise to 80%: (1) Write 3 persona definitions (Musk, Bezos, Munger) with stance variants and test them in a dry-run. (2) Validate context window can hold orchestrator + persona library + business data without degradation. (3) Prototype the Dossier Header format and verify it round-trips (write → parse → extract fields). (4) Prototype dedup/clustering on a synthetic example with 3 lenses.

- **Approach:** 75% *(revised back up from 70% — stance boundary, priority formula, and tech cabinet triggers now resolved)*
  - Strong: Clear user direction — all lenses, in depth, integrated code-review, stance system with `improve-data` as default. The 10-section spec is extremely detailed. MACRO framework and Musk algorithm prove the pattern works. Stance concept elegantly solves "what should the system focus on" without needing separate skills. Pipeline reconciliation (Cabinet → Kanban handoff) is now explicitly mapped. Stance boundary resolved (generators sensitive, gatekeepers invariant). Priority formula fixed (`Signal-Speed` score, 0-1). Tech cabinet has trigger conditions.
  - Weak: Scope is very large. Risk that in-depth personas produce diminishing returns (20 lines of Hopkins principles may perform as well as 200). Dossier Header grammar defined but untested (round-trip parsing not verified). 7 remaining open questions use default assumptions.
  - What would raise to 85%: (1) Prototype Dossier Header round-trip (write → parse → extract). (2) Validate with a hand-run example under `improve-data` stance. (3) Confirm remaining open question defaults don't conflict.

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
  - Phase 0: Full cabinet — all lenses, in-depth personas, integrated code-review, stance system, content-level attribution (strict parseable Dossier Header format), inline stages. Starting stance: `improve-data`. Content-only fields are **temporary technical debt** with planned migration.
  - Phase 1: D1 schema migration for highest-value fields (`Originator-Lens`, `Confidence-Tier`, `Pipeline-Stage`, `Cluster-ID` — the minimum needed to unlock filtering and reporting). Persona fidelity scoring.
  - Phase 2: Remaining D1 fields (Decision-Log, Rivalry-Record). Additional stances. Regression test suite. Prediction accuracy tracking. Continuous improvement loop.
- Observability:
  - Decision logs in dossiers (who decided what and why)
  - Sweep reports show which lenses contributed which ideas
  - Confidence trends tracked across sweeps

---

## Suggested Task Seeds (Non-binding)

*Ordered gate-first: gating mechanisms and data dependencies before content creation.*

**Foundation layer (gates + data model):**

1. **Design the Idea Dossier schema + parseable attribution format** — Define the markdown template for dossiers with Dossier Header block (machine-parseable key-value attribution), confidence ledger, rivalry record, and decision log sections. This is the core artifact that makes every other stage real. Includes the "presentable idea" minimum completeness checklist.

2. **Design the Decision Gap Proposal lifecycle** — Define how items that fail the confidence gate are stored (Phase 0: Idea entity with `Status: raw` + `Tags: ["decision-gap"]` + Dossier Header `Confidence-Tier: data-gap|timing-gap|dependency-gap` with appropriate conditional fields: VOI-Score for data gaps, Trigger for timing gaps, Blocks for dependency gaps), picked up by next `improve-data` sweep, and promoted when gaps are resolved. Without this, the confidence gate has no "else" branch.

3. **Design the dedup / rival clustering mechanism** — Define how the orchestrator clusters similar ideas from multiple lenses into a single dossier with variant proposals, and how rivalry/agreement is recorded. Without this, the filter stage drowns in duplicates.

4. **Design the stance system + stance boundary** — Define how `improve-data` and `grow-business` stances propagate to each lens, each filter stage, and the orchestrator. Resolve: generators are stance-sensitive; Munger/Buffett mostly stance-invariant; Drucker/Porter stance = plan emphasis shift. Fix the priority formula (Time-to-signal definition).

5. **Bootstrap business plans** — The Cabinet system needs plans as inputs for Drucker/Porter. Bootstrap BRIK, PIPE, PLAT, BOS plans via `/update-business-plan` with at least minimum content (top 3 priorities, top 3 risks, at least 1 metric per business).

6. **Bootstrap people profiles** — Same dependency. Bootstrap via `/update-people` with at least minimum content (current workload, primary skills, availability).

**Content layer (personas):**

7. **Write in-depth persona definitions: Composite generators** — Full specs for all 6 idea-generating lenses (Musk, Bezos, Marketing, Sales, Sourcing, Code-review sub-cabinet) with stance-specific behavior. Principles, signature questions, failure modes, domain boundaries, preferred artifacts, tone.

8. **Write in-depth persona definitions: Gatekeepers and prioritizers** — Full specs for Munger+Buffett (filter) and Drucker+Porter (plan-weighted prioritization) with stance-specific behavior (noting stance boundary from task 4).

9. **Write in-depth persona definitions: Technical code-review cabinet** — Full specs for all technical experts (Fowler, Beck, Martin, Kim, Gregg, Schneier, etc.) with stance-specific behavior and trigger conditions (when to run vs skip).

**Integration layer (orchestrator + validation):**

10. **Write the Cabinet Secretary orchestrator skill** — Replaces ideas-go-faster SKILL.md. Accepts stance parameter. Implements full pipeline: composite generation → confidence gate → cluster/dedup → Munger/Buffett filter → work-up → Drucker/Porter priority. Reads persona definitions from `_shared/cabinet/`. Enforces parseable Dossier Header format.

11. **Design business linting/typechecking/testing checklists** — Business tooling analogs that systematically validate dossiers before routing.

12. **Write persona regression test scenarios** — Define expected outputs per lens per stance given a known business state. These become the "CI" for the cabinet.

13. **Validation run: Cabinet sweep under `improve-data` stance** — Run the full cabinet against current business state and verify output quality. Compare to single-lens sweep output to validate improvement.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Open questions: 7 remain in "Open (User Input Needed)" — all have documented default assumptions that are safe to proceed with. None block planning; all can be confirmed or overridden during `/plan-feature`.
- Resolved in this revision: Stance boundary, priority formula (`Signal-Speed`), technical cabinet triggers, data-gap lifecycle (content-only, no new status values), dossier header grammar.
- Recommended next step: Proceed to `/plan-feature cabinet-system`
