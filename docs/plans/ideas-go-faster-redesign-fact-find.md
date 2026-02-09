---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Created: 2026-02-09
Last-updated: 2026-02-09
Feature-Slug: ideas-go-faster-redesign
Related-Plan: docs/plans/ideas-go-faster-redesign-plan.md
Business-Unit: BOS
---

# Ideas-Go-Faster Skill Redesign — Fact-Find Brief

## Scope

### Summary

Redesign the `/ideas-go-faster` skill from a kanban board health checker into a radical business growth process auditor. The current skill counts WIP, finds aging cards, and diagnoses lane bottlenecks — that's housekeeping, not growth. The redesigned skill should audit the business machine itself: identifying missing processes, broken feedback loops, unmeasured outcomes, and stalled growth levers. It should maintain and use business plans and people profiles as living inputs to idea generation, task allocation, progress tracking, and forecasting.

### Goals

1. **Push tasks**: Identify missing or broken business processes that block growth and aggressively generate actionable tasks to fix them
2. **Maintain business plans**: Read, compare-to-reality, and update business plans as part of each sweep cycle
3. **Maintain people profiles**: Read and update people profiles for realistic task allocation
4. **Generate ideas at the intersection of plans + profiles**: Ambitious but realistic — what we want to achieve vs what we can do
5. **Track progress against plan targets**: Each sweep compares current state to targets. On track or drifting?
6. **Forecast**: Based on velocity, capacity, and targets — where will we be in 30/60/90 days?

### Non-goals

- WIP management (Pete handles this daily — the skill should not duplicate)
- Card-level backlog grooming (split/merge/reorder individual cards)
- Kanban lane health metrics as a primary output (signals only, not the point)
- Building a full forecasting infrastructure (that's a separate initiative — this skill should define what it *needs* from forecasting, not build it)

### Constraints & Assumptions

- Constraints:
  - Phase 0: Pete-triggered only, no automated scheduling
  - Single-file SKILL.md (prompt-only, no TypeScript modules)
  - Must work with existing Business OS agent API endpoints
  - Must remain read-only by default (write only when explicitly creating ideas/updating plans)
- Assumptions:
  - Business plans will be bootstrapped before or during first sweep (currently zero plans exist)
  - People profiles will be bootstrapped similarly (currently only auth data exists)
  - The skill can call `/update-business-plan` and `/update-people` as sub-invocations or incorporate their logic

---

## Repo Audit (Current State)

### The Current Skill: What It Does

**File:** `.claude/skills/ideas-go-faster/SKILL.md` (626 lines)

The current skill is a **kanban flow analyzer**:
1. Ingests snapshot via agent API (businesses, people, cards, ideas, stage docs)
2. Computes flow signals (WIP by lane, blocked ratio, aging hotspots, capacity vs load)
3. Diagnoses a single primary bottleneck from 7 categories
4. Generates 3-10 interventions scored on Impact/Confidence/Time-to-signal/Effort/Risk
5. Writes sweep report to `docs/business-os/sweeps/<date>-sweep.user.md`
6. Optionally creates draft ideas via API (`--create-ideas` flag)
7. Reflects against previous sweep

**What it does NOT do:**
- Audit business processes (marketing, sales, analytics, feedback loops)
- Read or update business plans
- Read or update people profiles
- Compare current state to strategic targets
- Forecast anything
- Think about customer acquisition, revenue, or growth

### Business Plans: Designed But Empty

**Expected location:** `docs/business-os/strategy/<BUSINESS>/plan.user.md`
**Current state:** **ZERO plans exist.** The directory structure and businesses.json catalog exist, but no plan files.

**What exists:**
- `docs/business-os/strategy/businesses.json` — 4 businesses defined (PLAT, BRIK, BOS, PIPE)
- `docs/business-os/strategy/business-maturity-model.md` — L1/L2/L3 progression framework
- `.claude/skills/update-business-plan/SKILL.md` — Full spec for plan schema and update workflow

**Plan schema (from update-business-plan skill):**
- Strategy (current focus, priorities with status/outcome/impact projections)
- Risks (severity, source, impact, mitigation)
- Opportunities (evidence, value proposition, effort, recommendation)
- Learnings (append-only log: what worked, what didn't, process improvements)
- Metrics (KPI name, current → target, measurement source, target date)
- Dual-audience format: `.user.md` (narrative) + `.agent.md` (structured)

**Critical gap:** The plan schema has a Metrics section but no plans exist to populate it. No revenue targets, no growth metrics, no strategic KPIs anywhere in the system.

### People Profiles: Designed But Empty

**Expected location:** `docs/business-os/people/people.user.md`
**Current state:** **No profiles exist.** Only auth data.

**What exists:**
- `docs/business-os/people/users.json` — 3 users (Pete, Cristiana, Avery) with auth fields only
- `.claude/skills/update-people/SKILL.md` — Full spec for people profile schema
- Agent API (`/api/agent/people`) — Returns hardcoded `maxActiveWip: 3` for all users

**People schema (from update-people skill):**
- Roles, responsibilities, business affiliations
- Current projects (card IDs)
- Technical skills, domain knowledge, process skills
- Knowledge gaps, resource gaps
- Current workload, capacity percentage
- Availability windows

**Critical gap:** No skills tracking, no availability data, no capability-to-requirement matching.

### Business Context: The Four Businesses

| Business | Stage | Revenue | Analytics | Key Blocker |
|----------|-------|---------|-----------|-------------|
| **Brikette (BRIK)** | L2→L3 | Active (hostel bookings) | **ZERO** — no GA, no Search Console, no conversion tracking | Can't measure if 168 guides are working |
| **Product Pipeline (PIPE)** | Pre-L1 | **Zero revenue** | Market scraping only | No Amazon account, no fulfillment, no first product |
| **XA** | L1 | Unclear if selling | None visible | Blocked on guide infrastructure (PLAT-OPP-0003) |
| **Platform (PLAT)** | Infrastructure | N/A | Telemetry exists but **disabled** | Article gen pipeline still in idea phase |

### Analytics & Measurement Infrastructure

**What EXISTS:**
- `packages/platform-core/src/analytics/` — Multi-provider analytics system (GA, file-based, console)
- `packages/telemetry/` — Client-side telemetry with PII stripping (disabled by default)
- `apps/brikette/src/lib/analytics/` — Trending service (Count-Min Sketch), unique visitors (HyperLogLog)
- `apps/brikette/src/lib/metrics/smoothed-metrics.ts` — EWMA, Holt double exponential smoothing
- `packages/lib/src/math/forecasting/` — EWMA, SimpleExponentialSmoothing, HoltSmoothing
- `packages/lib/` — Statistics (OnlineStats, Histogram, correlation), probabilistic data structures, financial math
- `apps/prime/src/lib/owner/` — Business scorecard, KPI aggregator, activation funnel
- `apps/product-pipeline/` — Stage K capital return engine, velocity priors, launch actuals

**What's MISSING:**
- No Google Analytics / Plausible integration on any live site
- No Search Console integration (can't measure SEO performance)
- No conversion funnel tracking (bookings, purchases)
- No marketing attribution (UTM, channel performance)
- No customer feedback collection (NPS, reviews, surveys)
- No revenue metrics visible (occupancy, ADR, RevPAR for Brikette)
- No time-series database for historical analysis
- No A/B testing infrastructure

### Forecasting Capability

**Existing primitives (in `@acme/lib`):**
- EWMA (exponentially weighted moving average)
- Holt smoothing (double exponential — level + trend)
- Moving averages (simple, exponential, weighted)
- Statistics utilities (correlation, percentiles, z-scores)
- Count-Min Sketch with time decay (trending detection)
- Financial math (PV, FV, compound interest)

**What's missing for forecasting:**
- No time-series database (data stored in JSON files, daily aggregates)
- No data pipeline for automated ingestion
- No seasonal decomposition (no Holt-Winters, no ARIMA)
- No model training/serving infrastructure
- No development velocity tracking (no lane transition timestamps)
- No closed-loop learning (velocity priors are manual inputs)

**Product Pipeline has the strongest forecasting design:**
- Capital return calculations (peak outlay, payback day, profit per capital-day)
- Velocity priors driving sell-through forecasts
- Launch actuals CSV ingestion with sensitivity analysis
- But: zero products launched, so all theoretical

### The Draft Pack: Radical Stances Worth Preserving

The original draft at `~/Downloads/kanban-sweep-agent-draft/` contains aggressive anti-process-theater material:

**Constitution (keep verbatim):**
- "Do not propose roadmap work until you name the current constraint and the metric(s) that evidence it"
- "Do not optimize work that should not exist"
- "Prohibited behavior: Conflating activity with progress ('more tasks' ≠ 'more throughput')"
- "Prohibited behavior: Producing 'feature factory' outputs without tying to the constraint"

**Deletion-first playbook (keep and amplify):**
- "What would happen if we removed this step entirely?"
- "Which tasks exist only because a previous decision wasn't revisited?"
- "Is this requirement a proxy for fear/risk that could be handled differently?"

**Scoring rubric (keep):**
- `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
- If Risk >= 8: require staged rollout
- If Confidence <= 4: treat as discovery, not a build

### The Elon Musk Algorithm (guiding philosophy)

The 5-step algorithm, executed in strict order:

1. **Question every requirement** — Each must have a named owner (person, not department). All requirements are recommendations. Only physics is immutable.
2. **Delete parts and processes** — If you're not adding back at least 10% of what you deleted, you didn't delete enough.
3. **Simplify and optimize** — Only AFTER steps 1-2. Common mistake: optimizing something that shouldn't exist.
4. **Accelerate cycle time** — Every process can be sped up. Only after steps 1-3.
5. **Automate** — Last, never first. Only after you've questioned, deleted, simplified, and accelerated.

Core principles:
- **"The best part is no part. The best process is no process."**
- Each week, identify the single biggest problem. Micromanage that solution. Delegate everything else.
- Reason from first principles, not by analogy.
- Speed of iteration beats quality of iteration.
- Measure success by what you remove, not what you add.

### Related Skills (Integration Surface)

| Skill | Relationship to ideas-go-faster |
|-------|-------------------------------|
| `/update-business-plan` | Sweep should trigger plan updates; plans are primary input to sweep |
| `/update-people` | Sweep should trigger profile updates; profiles inform allocation |
| `/scan-repo` | Complementary — detects git changes; sweep audits business state |
| `/work-idea` | Sweep generates ideas; work-idea converts them to cards |
| `/fact-find` | Sweep identifies areas needing investigation; fact-find does the deep dive |
| `/propose-lane-move` | Sweep may recommend lane transitions for stale/blocked cards |
| `/plan-feature` | Sweep output feeds planning priorities |

---

## Questions

### Resolved

- Q: Should the skill manage WIP?
  - A: No. Pete manages WIP daily. The skill audits business processes, not the task board.
  - Evidence: User direction in this session.

- Q: Should the skill read kanban data at all?
  - A: Yes, but as signals that inform business process diagnosis — not as the primary output. Cards represent work-in-flight on business problems; their state reveals whether growth processes are being built.
  - Evidence: The card system tracks business initiatives (analytics setup, email autodraft, guide production). Card stagnation signals process stagnation.

- Q: Should business plans exist before the first sweep?
  - A: The skill should bootstrap initial plans if none exist, using the maturity model + card/idea data as inputs. This is a one-time operation.
  - Evidence: Zero plans currently exist. The update-business-plan skill already has create-from-template logic.

- Q: What forecasting is realistic in Phase 0?
  - A: Simple trend detection and gap-to-target projections. Not ML models. The skill should compare current state to plan targets, compute burn rate on objectives, and flag when trajectory misses targets. The math primitives (EWMA, Holt) exist in `@acme/lib`.
  - Evidence: Forecasting library exists but no time-series DB. Phase 0 should use markdown-based tracking with simple calculations.

- Q: Should the skill always create ideas, or require a flag?
  - A: Always create ideas (max 3-5). The `--create-ideas` permission flag is process theater. A radical skill acts on its findings.
  - Evidence: User direction — "we need to be aggressive."

### Open (User Input Needed)

- Q: Should the skill call `/update-business-plan` and `/update-people` as sub-skill invocations, or inline their logic?
  - Why it matters: Inlining keeps the skill self-contained but creates duplication. Sub-invocation is cleaner but adds complexity.
  - Default assumption: Inline the essential read/compare/update logic; recommend the full skill for deeper updates. Low risk.

- Q: What business metrics should the sweep track for Brikette in the absence of analytics infrastructure?
  - Why it matters: Without GA/Search Console, the sweep can only track proxy metrics (guide count, guide quality scores, card completion). It should probably flag "no analytics" as the #1 constraint every single sweep until it's fixed.
  - Default assumption: Flag missing analytics as a critical constraint. Track what's available (guide count, translation coverage, card velocity). Recommend analytics setup as the top priority. Low risk — this is the obvious right answer.

- Q: How should forecasting be presented in the sweep report?
  - Why it matters: Too complex → Pete ignores it. Too simple → not useful.
  - Default assumption: Per-business "trajectory statement" — e.g., "At current pace, Brikette will reach L3 by Q3 2026. PIPE will not launch in 2026 unless Amazon account is set up by March." One sentence per business, evidence-based. Low risk.

---

## Confidence Inputs (for /plan-feature)

- **Implementation:** 80%
  - Strong existing skill to refactor (626 lines of working SKILL.md)
  - Clear template from draft pack materials
  - Agent API endpoints exist for data access
  - Gap: Business plans and people profiles don't exist yet — first sweep will need bootstrap logic
  - What would raise to 90%: Bootstrap the first business plan manually as a reference template

- **Approach:** 85%
  - Clear user direction on philosophy (Elon Musk algorithm, business process auditor not kanban checker)
  - Strong draft pack materials for constitution, scoring, deletion-first
  - Existing skill ecosystem for integration (update-business-plan, update-people, work-idea)
  - Gap: Forecasting approach is still directional — need to decide on specific calculations
  - What would raise to 90%: Define the exact forecasting calculations and data sources

- **Impact:** 90%
  - High impact: This skill becomes the strategic thinking engine for all businesses
  - The current skill is demonstrably misaligned (auditing kanban health when the real problems are missing analytics, missing revenue tracking, stalled business launches)
  - Business plans and people profiles as living documents will compound value across all other skills
  - Gap: None significant — the need is clear

- **Testability:** 60%
  - The skill is prompt-only (SKILL.md) — no code to unit test
  - Can be validated by running it against current Business OS state and reviewing output quality
  - The evaluation rubric from the draft pack provides quality dimensions
  - What would raise to 80%: Define 3-5 test scenarios with expected outputs (e.g., "Given zero business plans, sweep should bootstrap and flag missing analytics as #1 constraint")

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Single SKILL.md file (consistent with all other skills)
  - Agent API as primary data source (not direct file reads for Business OS data)
  - Dual-audience output (.user.md sweep report)
  - Elon Musk 5-step algorithm as the ordering principle for all recommendations
- Rollout expectations:
  - Replace current SKILL.md entirely (not additive — this is a redesign)
  - First sweep should bootstrap missing business plans and people profiles
  - Sweep reports to `docs/business-os/sweeps/<date>-sweep.user.md` (same location, new format)
- Observability:
  - Self-evaluation checklist (simplified from 30-point rubric to pass/fail)
  - Reflection against previous sweep (trajectory tracking)

---

## Suggested Task Seeds (Non-binding)

1. **Write the new constitution** — Incorporate Elon Musk 5-step algorithm, draft pack anti-theater stances, and business process audit framing. This is the philosophical core.

2. **Define the Business Process Audit Framework** — Replace kanban flow signals with business process categories: Measure (can you see what's happening?), Acquire (are customers finding you?), Convert (are they buying?), Retain (are they coming back?), Operate (is the machine efficient?). Each category has diagnostic questions.

3. **Design the sweep workflow** — Ingest business plans + people profiles + card state → Audit each business against its plan targets → Identify the #1 constraint per business → Generate interventions using Musk algorithm ordering → Forecast trajectory → Write report.

4. **Design the sweep report template** — Business-focused, not kanban-focused. Per-business sections with: plan target vs actual, #1 constraint, recommended interventions, trajectory forecast. One-pager summary at top.

5. **Define forecasting approach** — Simple trajectory statements per business. "At current pace, X will/won't reach Y by Z." Based on plan targets, card completion rate, and observable outcomes.

6. **Write the SKILL.md** — Implement all of the above in a single prompt-only skill file.

7. **Bootstrap test** — Run the redesigned skill against current state. Verify it identifies missing analytics as Brikette's #1 constraint, missing launch prerequisites as PIPE's #1 constraint, etc.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None — open questions have safe defaults
- Recommended next step: Proceed to `/plan-feature ideas-go-faster-redesign`
