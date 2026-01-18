<!-- docs/product-pipeline/taobao-amazon-margin-pipeline-plan.md -->

China Sourcing → EU Multi-Channel Capital Return Pipeline

Type: Plan
Status: Active
Domain: Commerce / Sourcing / Market Intelligence / Capital Analytics / Ops Enablement
Last-reviewed: 2025-12-22
Relates-to charter: (planned) docs/product-pipeline/product-pipeline-charter.md

Note: This plan exceeds 350 lines to keep the full end-to-end pipeline in one view. Follow-up: split into docs/product-pipeline/{scope,stages,architecture,testing}.md once scope is locked.

Primary goal: allocate capital and operational bandwidth to the highest-quality opportunities by ranking candidates on return on capital over time, with explicit controls for market/velocity, listing/IP/platform eligibility, safety/compliance, shipping/hazmat, quality, supplier terms, effort, and execution capacity.

This system supports two overlapping initiatives:

FLIP: source existing products (e.g., Taobao/China supply) and sell primarily on Amazon EU

CUSTOMIZE: customize off-the-shelf products (branding/packaging/minor changes) and sell on Amazon EU + owned channels (website)

A third initiative is explicitly out-of-scope:

DEVELOP: new product development in China (too complex for this pipeline). This pipeline must still generate a structured handoff package when a concept is ready to graduate.

0. Why this plan exists

Rate limits, operator attention, and capital constraints mean we cannot “scan everything.” The system must therefore:

pre-select and prioritize what enters evaluation (so we don’t waste scrape budget)

avoid re-evaluating the same failures too frequently

turn “analysis” into running, testable software deployed to Cloudflare (not just written code)

0.1 Placement and delivery order

This pipeline ships as a dedicated app inside this monorepo (path: apps/product-pipeline).
It has its own Cloudflare Pages project (name: product-pipeline), Worker API, D1 database, R2 buckets, and queues.
It does not integrate into existing apps beyond shared design tokens/components and core utilities.
Plan for repo-style isolation (app, packages, CI, deploy) so it can be extracted later without rework.
This app launches before Base-Shop v1.

0.2 Implementation progress (repo audit 2025-12-22)

Completed in repo (apps/product-pipeline + queue-worker + @acme/pipeline-engine)

- App + infra: dedicated Next.js app with Cloudflare Pages + Worker bindings (wrangler.toml), queue worker for Stage M, D1 migrations for leads/candidates/stage_runs/launches/logistics lanes/velocity priors/artifacts, and audit log + CSV exports.
- Core CRUD: Leads/Candidates APIs with fingerprinting, triage fields, duplicate linking, exports, and audit log feeds; Activity API exposes logs.
- Stages implemented: P (triage + dedupe + promotion budget + cooldown checks), A/B/C/D/K/N/R/S endpoints with cooldown enforcement; K engine shipped as @acme/pipeline-engine with sensitivities; Scenario Lab uses approx vs exact recompute; Stage X cooldown API.
- Stage M path: queue producer with per-site budgets, queue worker fetches HTML, parses Amazon/Taobao search/listing HTML, stores artifacts to R2, updates stage_runs and candidate status.
- Launch loop: launch plan CRUD, Stage L actuals ingestion from CSV, Stage K recompute from actuals, velocity prior insertion, and scale/kill decisions.
- UI footprint: pages for Leads/Candidates/Scenario Lab/Launches/Activity/Exports wired to APIs; basic HUD cards for Portfolio, Suppliers, Logistics lanes.

Partial/remaining gaps vs plan

- Data acquisition: Stage M runner now supports Playwright headful capture, human-gate prompt with playbook macros, HTML+PNG artifacts, scroll/wait controls, basic playbooks (Amazon/Taobao selectors + cookie accepts), session reuse/rotation, capture-profile allowlisting, and runner heartbeat status UI; still missing full operator login macros, session rotation policy enforcement across accounts, and richer assisted-capture playbooks per marketplace.
- Evidence gating: Stage S is manual risk inputs; no automated compliance/hazmat/package checks or artifact gating/checklist enforcement yet.
- Portfolio solver: Portfolio page is static copy; no constraint-based recommendation/selection engine or cash/capacity/effort optimizer.
- Supplier ops: Supplier view is static; no supplier scorecards, terms history, or negotiation task loops feeding Stage N.
- Scheduling: jobs run on-demand; no maturity-aware scheduler enforcing per-stage throughput beyond Stage P/M daily limits.

1. Outcomes and non-goals
   1.1 Outcomes

For each evaluated candidate (SKU or SKU family), the system produces:

Return + capital metrics (time-based, batch-aware)

peak cash outlay (€)

payback time (breakeven) (days)

sell-through time (to target %) (days)

capital-days (integral of capital tied up)

profit per capital-day

annualized return approximation (base + low/high bands)

Market + velocity outputs (by channel and marketplace)

competition score + flags

velocity estimate (low/base/high) and confidence

ramp assumptions (SCOUT) or measured (PILOT/VERIFY)

Feasibility outputs

safety/compliance risk + required artifacts (evidence level)

shipping feasibility + hazmat classification

matching confidence and bundle normalization (FLIP)

listing/IP/platform eligibility risk (Amazon)

packaging/label readiness and ops complexity (CUSTOMIZE)

Supplier + terms outputs

payment terms / MOQ tiers / incoterms assumptions + history

negotiation tasks and term-improvement impact on cashflow and return

Operational outputs

Decision Card (advance/hold/reject + why)

Launch Plan Card (pilot size, channel split, stop-loss rules)

Compliance & Quality checklist (phased by maturity)

Portfolio outputs (when enabled)

recommended “next set” under constraints (cash + capacity + effort)

1.2 Non-goals (explicit)

Fully automating “new product development” (DEVELOP) end-to-end

Unbounded crawling at web scale (“100,000 products/day”)

Bypassing platform protections (CAPTCHAs, bot challenges, stealth)

Relying on official or third-party APIs for Amazon/Taobao data (the pipeline must work without them)

1.3 Scope commitment (explicit)

This project delivers the full end-to-end pipeline described in Stages P through L, including negotiation, productization, portfolio allocation, and pilot learning.
No stage is deferred to another system or a later phase.

2. Scaling philosophy

This system must start from zero and scale realistically.

2.1 Maturity levels

Every run is evaluated under a maturity_level that controls rigor and burden:

M0 (Bootstrap): manual intake permitted; conservative assumptions; minimal artifact management

M1 (Repeatable): structured DB state; decision cards; basic evidence storage; standard checklists

M2 (Scaled): portfolio-aware allocation; supplier scorecards; richer artifact gating; dashboards/alerts

M3 (Institutional): RBAC, audit-grade logs, compliance calendar, incident playbooks, continuous improvement loops

2.2 Administrative burden gating

High-burden controls activate only after merit is demonstrated:

DISCOVER → TRIAGE: cheap signals only

SCOUT: conservative return bands, feasibility gates

VERIFY: documents, measurements, quotes, eligibility confirmation, QC plan

PILOT: real-world velocity/returns/quality outcomes

SCALE: deeper compliance posture, supplier redundancy, portfolio constraints

3. Funnel: how products enter evaluation (pre-selection + selection)

We explicitly separate Leads (cheap) from Candidates (expensive).

3.1 Funnel levels

Level 0: Universe

Everything on Taobao/China supply + Amazon EU + competitor sites.

Level 1: Leads

Lightweight records created from repeatable lead sources.

Goal: generate hundreds to a few thousand leads/week.

Level 2: Candidates

Leads promoted into full evaluation stages.

Goal: evaluate dozens to a few hundred candidates/week deeply.

3.2 Lead sources (repeatable; budgeted)

Selection cannot rely on luck. Leads must come from defined sources with weekly budgets:

Amazon-first gap scans (primary)

Start from Amazon demand/landscape, then source supply in China.

Adjacency mining (high reliability)

Variants and complements of products we already understand operationally.

Approved supplier catalogs (targeted)

Periodic scan of trusted suppliers’ catalogs/new arrivals/best sellers.

CUSTOMIZE “pain-led” discovery

Repeated complaint themes from Amazon reviews and competitor positioning gaps.

Each lead must record:

lead_source (one of the above)

source_context (query/category/supplier campaign name)

created_by (operator/system)

created_at

3.3 Throughput budgets (hard limits, maturity- and headcount-gated)

To respect rate limits and operator attention, define stage budgets tied to maturity_level and staffing. Budgets must be configurable and enforced by the job scheduler.

Example starting targets (adjust only when staffing is in place):

M0 (1-2 operators)

lead_ingest_per_day: 20-80

triage_scans_per_day: 20-80

candidate_promotions_per_day: 3-10

deep_eval_per_day: 3-8

M1 (3-5 operators)

lead_ingest_per_day: 80-250

triage_scans_per_day: 60-200

candidate_promotions_per_day: 10-25

deep_eval_per_day: 8-20

M2 (6-10 operators)

lead_ingest_per_day: 250-800

triage_scans_per_day: 200-600

candidate_promotions_per_day: 25-60

deep_eval_per_day: 20-50

M3 (10+ operators)

lead_ingest_per_day: 800-2000

triage_scans_per_day: 600-1500

candidate_promotions_per_day: 60-150

deep_eval_per_day: 50-120

3.4 Operator capacity plan (required)

Throughput increases require staffing and training in place (intake, market scan, compliance/QC, negotiation). If staffing is not in place, default to M0 budgets regardless of maturity_level.

4. Guardrails: Ethical extraction + account isolation
   4.1 Allowed automation

Headless/headed browser automation for content available through normal browsing

Manual operator login in a real browser context where required

Evidence snapshots stored for audit/debug

If blocked by challenges:

stop automation for that site

move items to ON_HOLD with reason

use Human Intake instead of escalation tactics

4.2 Not allowed

CAPTCHA bypass

stealth/evasion to defeat detection

breaking access controls

4.3 Account isolation (critical)

Automated browsing/extraction must not use any account that is operationally critical (e.g., primary selling account or primary purchasing account). Use least-privilege, dedicated accounts intended for data collection, and default to Human Intake where automation is unreliable.

4.4 Non-API acquisition strategy (aggressive but safe)

We will not use external APIs. Data collection uses normal browsing sessions with strict guardrails:

human-in-the-loop capture: operators navigate and trigger capture; automation only reads DOM/HTML after a human action

request budgets: per-site daily caps, per-account caps, and minimum spacing between requests; low concurrency; stop on any challenge

cache-first: capture once, store HTML/snapshots in R2, parse offline, and re-use until TTL expires

query shaping: focus on narrowly scoped searches and top-N results; avoid deep crawl trees

evidence-first: store screenshots/HTML for every capture to support audits and offline parsing

fail closed: if a site blocks or degrades, switch to manual intake and mark ON_HOLD

Aggressive coverage comes from broad query coverage and disciplined scheduling, not from bypassing protections.

5. Core data model (Lead vs Candidate + dedupe + caching)
   5.1 Key entities

Lead: lightweight record; may have 1–2 URLs and minimal extracted signals

Candidate: promoted Lead, eligible for full pipeline stages

SKU / SKU Family: normalized sellable product representation

Supplier + SupplierTerms: performance + negotiated terms history

MarketplaceObservation: per Amazon marketplace (DE/FR/…)

Channel: AMAZON_EU, DTC_WEB

Artifacts: evidence + compliance + QC docs

Run / Job: immutable stage execution record with inputs/outputs

5.2 Product fingerprinting and deduplication (required)

To avoid re-evaluating near-duplicates, create a stable product_fingerprint for Leads and Candidates:

normalized title tokens (language-agnostic normalization)

coarse category guess

price band

key attributes if visible (material, dimensions)

optional future: image similarity hash (if captured)

Rules:

if a new Lead matches an existing fingerprint above threshold:

link it as duplicate_of

inherit cooldown/recheck policy where appropriate

avoid re-running expensive stages unless there is a clear new signal

5.3 Caching and TTL by field group

Cache must be explicit, per group, to avoid over-refreshing:

Source price/spec TTL (Taobao/supplier price tiers, variants)

Market snapshot TTL (Amazon search top-N signals)

Eligibility signal TTL (category gating hints, IP risk signals)

Shipping quote TTL (if verified quotes exist)

Velocity prior TTL (pilot outcomes never expire; market priors do)

6. Pipeline stages overview (now includes pre-selection + failure caching)

Stages are designed to be idempotent jobs that can run at fixed points.

Stage P — Pre-selection / Triage (Lead → Candidate) (new, mandatory)

hard filters, cheap market sniff test, dedupe, triage scoring

outputs a Priority Queue of candidates

Stage A — Naive economics (sanity check only)

quick reject obvious non-starters

Stage M — Market & velocity (multi-channel)

Amazon market scan → velocity bands

DTC signals via inference (ad activity + proxies), conservative by design

Stage S — Safety & feasibility

safety/compliance, shipping/hazmat, matching (FLIP), IP/eligibility, packaging readiness, delay penalties, success probability

Stage N — Negotiation & terms (task loop)

triggered for high-potential items failing on peak cash/payback; attempts to improve terms before rejection

Stage D — Productization (CUSTOMIZE only)

one-time costs, asset readiness, sampling loops, customization lead time

Stage B — Landed + fulfillment economics

landed cost + outflow schedule parameters (supports deposit/balance schedules)

Stage C — Unit contribution + sale cash parameters

channel-specific unit contribution and payout/refund timing

Stage K — Capital timeline & returns

simulate cashflow over time; compute return metrics; compute sensitivities (“Greeks”) for fast what-if

Stage R — Risk + effort + ranking (+ optional portfolio allocation)

hard-stop gates, risk score, effort score, return ranking; capacity-aware selection

Stage L — Launch experiments + learning loop

launch plan, ingest actuals, update priors, scale/kill decisions

Stage X — Cooldown / Recheck Policy (cross-cutting)

reason-coded failure caching, cooldown windows, recheck triggers, and “do not re-evaluate too quickly” enforcement

7. Stage P: Pre-selection / Triage (Lead → Candidate)

This is the primary answer to “we cannot chew through 100,000 products/day.”

7.1 Inputs (minimal)

lead source, query context, source URL(s)

rough price band (if visible)

minimal text fields (title/keywords)

optional operator notes

7.2 Hard filters (cheap rejects)

Applied without deep scraping:

Category capability filters (maturity-aware allowlist/denylist)

Hazard keyword filters (batteries, magnets, liquids, kids/toys, medical claims, etc.)

Deal-breaker heuristics

bulky-light likelihood (if dims or category suggests)

fragile-heavy likelihood

extremely low ticket (fees dominate)

extremely high ticket (capital + returns risk)

Known operational sinkholes

excessive variants

unclear included items (for FLIP)

“likely gated” categories (heuristic)

Stage P outputs explicit reason codes for rejects/holds.

7.3 Cheap “opportunity sniff test” (rate-limit friendly)

Run a minimal scan to decide whether to spend deeper evaluation budget:

Amazon (one marketplace) search results only

top N prices + review counts + brand dominance + sponsored density

Source listing minimal

price tier, MOQ, basic spec hints

7.4 TriageScore (prioritization-only)

Compute triage_score (0–100) to order evaluation, not to make final decisions:

Components (example):

DemandHintScore

CompetitionEaseScore

PriceHeadroomScore

FeasibilityLikelihoodScore

StrategicFitScore (adjacent to existing playbooks/suppliers/categories)

EffortPenaltyScore (expected burden)

Output:

triage_score

triage_band: high|medium|low

triage_reasons[] (top 3 drivers)

recommended action:

PROMOTE_TO_CANDIDATE

HOLD_FOR_MANUAL_REVIEW

REJECT_WITH_COOLDOWN

7.5 Promotion rules (Lead → Candidate)

Only promote if:

passes hard filters, and

triage score meets threshold within daily promotion budget

Promoted items enter the Candidate Priority Queue, not the general INBOX.

8. Failure caching, cooldowns, and re-evaluation policy (tightened)

If a product fails, we must not re-evaluate too quickly.

8.1 Required fields on HOLD/REJECT

Every failure must record:

failure_reason_code (enumerated)

failure_severity: permanent | long_cooldown | short_cooldown

recheck_after_date

what_would_change (one-line)

snapshot of assumptions used (scenario pack + version)

linkage to duplicate fingerprints (inheritance where appropriate)

8.2 Suggested cooldown policy (configurable)

Permanent (never auto-recheck)

prohibited category by policy

hard IP block signals

structurally shipping-infeasible class

counterfeit indicators

Long cooldown (90–365 days)

brand-dominated market

competition too intense

structural economics fail under conservative assumptions

effort too high for current maturity level

Short cooldown (7–30 days)

scrape blocked / login challenged

missing dims/weight/specs

pricing volatility requires refresh

quote expired / negotiation pending

8.3 Recheck triggers (override cooldown)

Cooldown can be overridden only if a trigger changed:

category capability expanded (maturity level change)

new supplier terms negotiated (Stage N outcome)

verified dimensions/weight provided

new marketplace/channel selected

significant market shift detected (manual trigger or scheduled quarterly scan)

9. Stage K math (explicit, testable definitions)

Stage K must be deterministic and testable.

9.1 Core definitions (discrete time)

Let time be discretized into equal steps (default: 1 day).

CF_t: net cashflow on day t

C*t = Σ*{i=0..t} CF_i: cumulative cash position

I_t = max(0, -C_t): invested capital (cash tied up)

Capital-Days:

CapitalDays = Σ\_{t=0..T} I_t \* Δt (with Δt=1 day)

This integrates only the negative cash balance (capital tied up).

9.2 Payback vs sell-through (no ambiguity)

Stage K must output both:

PaybackDays_Breakeven: first t where C_t ≥ 0

SellThroughDays_Target: first t where units sold ≥ sell_through_target_pct \* Q

9.3 Profit and unsold handling

Define:

NetCashProfit = C_T + SalvageValue_T

Where salvage is conservative and configurable:

default SCOUT can be 0, or a conservative fraction of landed cost for unsold units at horizon.

9.4 Canonical outputs

Per candidate, per batch size Q, per scenario band:

PeakCashOutlayEur = max_t I_t

CapitalDaysEurDays

PaybackDays_Breakeven (nullable)

SellThroughDays_Target (nullable)

NetCashProfitEur

ProfitPerCapitalDay

AnnualizedCapitalReturnRate ≈ ProfitPerCapitalDay \* 365

9.5 Sensitivities (“Greeks”) for fast UI

Compute and store local sensitivities around the base scenario:

ΔReturn/ΔPrice

ΔReturn/ΔFreight

ΔReturn/ΔLeadTime

ΔReturn/ΔVelocity

ΔReturn/ΔAdsOrCAC

These are used to keep Scenario Lab instant at scale.

9.6 Stage K engine implementation requirements (no shortcuts)

Stage K is a first-class engine, not a spreadsheet. Requirements:

deterministic, pure-function core with full cashflow traces per scenario

fixed-point or decimal money math (avoid floating point drift)

scenario pack versioning and immutable inputs stored with every run

batch compute for list ranking + exact recompute on demand

sensitivities computed via finite differences with documented step sizes

exportable engine state for audits and offline verification

package layout: implement as packages/pipeline-engine with a small worker adapter; keep compute separate from UI

Open-source acceleration candidates: decimal.js or big.js for money math, date-fns for schedules, d3-array for quantiles, zod for schema validation.

10. UI/UX requirements (expanded to include Lead → Candidate selection)

The UI is a first-class product requirement. “It runs in the cloud” is part of done.

10.1 Primary screens

Leads

Lead Inbox (by source)

Triage view (Stage P results)

Duplicate linking review

Candidates

Ranked list (SCOUTED/finalized)

Candidate detail with stage rail and evidence

Compare view

Scenario Lab

what-if controls with instant approximation + on-demand exact recompute

ranking delta view

Portfolio

cash + capacity + effort planning

recommended next set under constraints

Launches

launch plan cards

actuals ingestion + variance vs model

Suppliers & Terms

supplier scorecards

terms history + negotiation tasks (Stage N)

Artifacts

evidence snapshots

compliance/QC vault + checklists

Activity

audit log, overrides, stage transitions

10.2 Lead selection UX (critical)

To avoid random evaluation:

Lead Inbox must support:

filtering by lead source and query context

quick dedupe visualization (“likely duplicate of X”)

triage score sorting

bulk actions:

“Run Triage (Stage P)”

“Promote top N to Candidates”

“Reject with cooldown reason”

Triage view must show:

hard filter outcomes and reason codes

minimal market sniff signals

“why score is high/low”

what would make it promotable

10.3 Candidate list UX (analysis-first)

default sort: effort-adjusted return score (base), descending

allow sorting by:

risk-adjusted annualized return

peak cash (ascending)

payback days (ascending)

profit/capital-day

velocity (base)

effort score (ascending)

row-at-a-glance includes:

return band, peak cash, payback

velocity + confidence

top risk and top effort driver chips

stage status + next recommended action

data freshness

10.4 Scenario Lab UX (performance-aware)

Scenario Lab must use a two-tier model:

Tier 1 (instant): apply stored sensitivities to approximate deltas across lists

Tier 2 (exact): recompute Stage K precisely for selected candidates/top N impacted

UI must clearly label “Approx” vs “Exact.”

10.5 Gamified, highly visual UX (3D-first overlay)

Goal: make the product-pipeline feel like a trading sim where operators “fly” through opportunities, while keeping Stage P→L truth visible and auditable.

Theme and scene framing

- Command Deck (default view): Leads/Candidates rendered as ships/cards on a 3D starmap; maturity level = unlocked sectors; effort/risk shown as “heat” and “armor”; cooldowns shown as “frozen” hexes.
- Scenario Lab → Simulation Chamber: physics-ish 3D dials for price/freight/velocity; “approx” vs “exact” rendered as holo vs solid panels; rerun pulses a ripple through affected nodes.
- Portfolio → War Room: cash, capacity, and effort shown as resource bars; recommended picks animate into slots; stop-losses as shields that can be toggled.
- Launches → Mission Log: pilot outcomes animate as trajectory lines; variance shows as turbulence; scale/kill decisions stamp the card.

Game loop structure (maps to maturity levels)

- M0 tutorial path: narrative onboarding that grants “scanner access” after Stage P is run on 5 leads; single-player, low visual load.
- M1 missions: daily “triage runs” (run Stage P on N leads), “promotion sorties” (promote top K), and “lookup raids” (Stage M jobs) with streak bonuses (operator XP, not coins).
- M2 expeditions: timed “portfolio builds” with resource caps; Scenario Lab combos (chain 3 what-ifs to reveal hidden sensitivity chips); supplier negotiation runs unlock “term upgrade” badges.
- M3 control: audit-grade overlays; RBAC shows as squad roles; achievements shift to reliability (zero failed cooldown attempts in a week).

Entity mapping (consistent nouns and visuals)

- Leads = signals/beacons; TriageScore drives beacon brightness; duplicates snap together with a magnetic effect.
- Candidates = ships/cards; stage rail shows as modules attached; risk/effort chips are “status lights”; evidence crates (R2 assets) hoverable with screenshots as holograms.
- Suppliers = stations; terms history visualized as concentric rings with better rings glowing.
- Markets = sectors; velocity bands shown as orbit speeds; IP/compliance risk as radiation fields.

Interactions and controls

- 3D navigation: orbit controls with keyboard arrows/WASD; mini-map radar for zoomed-out context; ctrl+click to lasso select Leads/Candidates for bulk actions.
- Actions are tactile: drag a lead beacon onto the “Gate” to trigger Stage P; drag top candidates into “Priority Queue slots”; drop artifacts onto checklist slots to satisfy compliance.
- Scenario Lab: knobs/sliders with haptic-like easing; instant mode = shimmering approximation; exact recompute = solidifying panel and data pulse to impacted cards.
- Cooldowns: frozen cards with countdown rings; recheck triggers appear as “intel drops” that can thaw the card.

Feedback and rewards (aligned to real work, not gambling)

- Operator XP tied to completed, compliant actions (triage batches, evidence uploads, enforced cooldowns).
- Achievements/badges: “Steady Hands” (0 cooldown violations), “Signal Booster” (triage accuracy), “Term Whisperer” (Stage N improvements), “Simulator Ace” (Scenario Lab coverage).
- Dashboards show streaks and reliability; no loot boxes or random rewards.

Tech stack guidance (visual but performant)

- 3D: Three.js with react-three-fiber + @react-three/drei; postprocessing for glow/heat; use instancing for large point clouds (Leads).
- UI shell: Next.js/React (existing), with layered Canvas panels per scene; fall back to 2D canvas/SVG on low-power devices (progressive degradation).
- Motion: Framer Motion for UI chrome; GSAP or react-spring for HUD transitions; keep animation budgets <10ms/frame, and cap particle counts per maturity level.
- Audio cues (subtle): soft chime on successful stage run, low thud on reject, hover whispers on evidence hover (muted by default; per-user toggle).

Instrumentation and guardrails

- FPS and GPU budget indicator in HUD; auto-switch to low-visual mode if <45fps sustained.
- All actions still write to audit log; visuals are a layer over the true state; “Show raw” toggle exposes classic table view for accessibility and debugging.
- Accessibility: colorblind-safe palette options; keyboard-first controls; motion-reduction toggle disables camera moves and uses static cards.

Implementation slices (map to milestones)

- Milestone 0-1: establish Command Deck shell with 3D starmap and card hover states; low-poly, no heavy effects.
- Milestone 2: drag-to-Stage-P gate, triage beacon effects, duplicate magnetization; basic streak counter.
- Milestone 3: Simulation Chamber visuals for Amazon lookup returns (evidence crates as popups), budget bars as resources.
- Milestone 4: Scenario Lab instant vs exact holo/solid panels; sensitivity ripples.
- Milestone 5: cooldown freeze/shatter effects; intel drops for recheck triggers.
- Milestone 6: Mission Log trajectories for pilot actuals; scale/kill stamps.

10.6 Gamified prep backlog (naming + assets + instrumentation)

Canonical stage naming (use in UI, achievements, copy, and telemetry)

- Stage P — Pre-selection/Triage → “Gate Scan” (Lead → Candidate)
- Stage A — Naive economics → “Reality Check”
- Stage M — Market & velocity → “Market Sweep”
- Stage S — Safety & feasibility → “Safety Shield”
- Stage N — Negotiation & terms → “Negotiation Bay”
- Stage D — Productization → “Forge”
- Stage B — Landed + fulfillment → “Landing Bay”
- Stage C — Unit contribution & payout timing → “Payout Rail”
- Stage K — Capital timeline & returns → “Capital Run”
- Stage R — Risk + effort + ranking → “Command Rank”
- Stage L — Launch experiments & learning → “Mission Log”
- Stage X — Cooldown/recheck → “Cryo Cooldown”

Copy + UX guardrails

- Replace “Stage <letter>” labels in UI chrome with the canonical names; keep the letter as a chip for operators who know the pipeline (e.g., “Gate Scan (P)”).
- Use the same names in achievements/badges and mission text to avoid cognitive dissonance.
- Add a glossary modal linking canonical names to pipeline definitions; include keyboard shortcut (?).

Asset + theme prep

- Icon kit per stage (line + filled) with matching 3D glyphs; export to SVG + GLTF; design for low-poly readability.
- FX palette per stage (e.g., Gate Scan = scan sweep; Safety Shield = radial shield; Cryo Cooldown = frost shader) with perf budget notes.
- Sound cues mapped per stage (soft, minimal); define “quiet mode” and per-user toggles.
- HUD tokens: resource bars, streak meters, cooldown rings; ensure colorblind-safe variants.

Instrumentation readiness

- Telemetry events include canonical stage name, letter, scene (Command Deck/Simulation Chamber/etc.), GPU mode (high/low), FPS bucket, and motion preference.
- Add “raw view” toggle usage metrics to ensure accessibility path is used/tested.
- Log failed cooldown attempts and thaw triggers to power “Steady Hands” achievement.

Content and localization

- Provide short tooltips (<=60 chars) and longer popovers (<=200 chars) for each canonical name.
- Keep strings in a single namespace so visual themes can change without recoding copy.
- Validate translations keep metaphors coherent (no literal sci-fi if locale prefers neutral).

11. Reference architecture (Cloudflare-first, scraper-runner hybrid)

A practical constraint: headless browser automation is not a natural fit inside Cloudflare Workers. The plan must therefore support a hybrid runtime while keeping the UI and system-of-record on Cloudflare.

11.0 Repo placement (new app inside monorepo)

App: apps/product-pipeline (dedicated Next.js/React app).
It ships with its own Cloudflare Pages project (product-pipeline) and Worker API.
It reuses shared design tokens/components and platform helpers only; no runtime coupling to existing apps.

11.1 Recommended components

Frontend: Cloudflare Pages (static)

API: Cloudflare Workers (TypeScript)

DB: Cloudflare D1 (SQLite-compatible)

Evidence storage: Cloudflare R2 (snapshots, artifacts, exports)

Job queue: Cloudflare Queues (or Durable Objects as a coordinator)

11.2 Scraper Runner (operator/controlled runtime)

A separate service (local machine or controlled VM) runs Playwright and:

pulls scrape jobs from Cloudflare queue/API

performs extraction (with manual login and operator-gated capture when required)

uploads results + evidence refs back to the API

This keeps the UI deployed and usable while respecting real-world scraping constraints.

12. Testable implementation stops (running system milestones)

These are fixed points where the system must run in practice, not just exist in code.

Each milestone from 0 onward must have:

a Cloudflare-deployed UI

working API endpoints

a “smoke test script” (manual steps + automated checks)

a small fixture dataset (so it can be demoed anytime)

Milestone -1 — App bootstrap (monorepo + Cloudflare project)

Goal: the new app exists as a deployable unit in this repo.

Must be true

apps/product-pipeline created with shared design tokens wired

dedicated Cloudflare Pages project (product-pipeline) and Worker bindings defined

CI workflow added for the app (build + deploy)

Smoke test

build locally, deploy preview, open base URL

Milestone 0 — Deployed UI shell (Cloudflare)

Goal: you can open a deployed web app.

Must be true

UI deployed to Cloudflare Pages

navigation exists: Leads, Candidates, Scenario Lab (placeholders allowed as pages, but not fake “TODO” content)

authentication strategy decided (even if minimal; e.g., single-user access control)

Smoke test

open URL, navigate between pages, see version/build info

Milestone 1 — System-of-record + CRUD (Leads and Candidates)

Goal: state is real, persistent, and visible.

Must be true

Cloudflare Worker API + D1 database deployed

create/read/update Leads and Candidates from UI

audit log records create/update actions

export selected rows to CSV

Smoke test

add 10 leads in UI

promote 1 lead to a candidate manually

confirm persistence after refresh

Milestone 2 — Stage P running (Pre-selection / Triage)

Goal: selection becomes deliberate and budgeted.

Must be true

UI can trigger Stage P on a set of leads

Stage P writes hard filter outcomes, triage score, and promotion recommendation

daily promotion budget enforced

dedupe fingerprinting runs and flags duplicates

Smoke test

ingest 50 leads

run Stage P

promote top 10 to candidates

verify duplicates are linked and not re-promoted

Milestone 3 — Amazon lookup runs end-to-end (real extraction path)

Goal: “look up something on Amazon” works in practice.

Must be true

Candidate detail view has “Run Amazon Lookup” action

action enqueues a job with per-site request budgets and operator-gated capture

Scraper Runner executes and returns:

top-N search snapshot OR listing lookup result

evidence stored in R2 and linked in UI

Stage M outputs are computed and displayed

Smoke test

click “Run Amazon Lookup”

wait for job completion status to update

view extracted market snapshot + evidence links

Milestone 4 — Stage K return engine + Scenario Lab (instant + exact)

Goal: return-based ranking is real and explorable at scale.

Must be true

Stage K computes return metrics for candidates

engine uses deterministic math and scenario pack versioning

list ranks by return metrics

Scenario Lab:

instant approximate deltas using sensitivities

exact recompute on demand for selected candidates

Smoke test

compute Stage K for 50 candidates

change freight slider: list reorders instantly (approx)

run exact recompute for top 10; values update to exact

Milestone 5 — Failure caching + cooldown enforcement

Goal: the system stops re-evaluating the same failures too quickly.

Must be true

failures record reason codes, severity, recheck date, what-would-change

job scheduler respects cooldowns automatically

UI highlights “cooldown active” and why

Smoke test

reject 10 candidates with different reason codes

attempt to re-run Stage M/S/K; system blocks appropriately and explains

Milestone 6 — Pilot loop (Stage L) closes the learning cycle

Goal: model improves from actuals.

Must be true

create launch plan cards

ingest actuals via CSV

variance view updates velocity priors and recalculates returns

scale/kill decision recorded

Smoke test

ingest a pilot actuals file for 1 candidate

observe velocity prior change and updated return bands

13. Automated testing requirements (so milestones stay true)
    13.0 Test maturity plan (interim -> full)

Phase 0: fixture-only unit tests for Stage P/K and parsers

Phase 1: offline E2E using stored snapshots and a mocked runner

Phase 2: staging E2E with live runner, strict quotas, manual trigger

Phase 3: full Cloudflare E2E suite including Amazon lookup, still rate-limited and gated

    13.1 Stage job tests (deterministic)

Stage K math fixtures (capital-days, payback, sell-through)

Stage P triage score fixtures

cooldown policy fixtures

13.2 End-to-end tests (Playwright, Phase 3 target)

UI loads on Cloudflare URL

create lead → run Stage P → promote to candidate

run Amazon lookup (can be mocked in CI using stored snapshots)

scenario lab approximation and exact recompute for a small set

13.3 Snapshot fixtures (for scraping stability)

store a set of HTML snapshots in R2 (or repo for dev) and validate parsers against them

allow “offline mode” demos using fixtures when live sites are unavailable

Appendix A — Failure reason codes (starter set)

prohibited_category

hazmat_likely_unverified

shipping_infeasible_structural

hard_ip_block

soft_ip_requires_manual_review

missing_dims_weight

market_brand_dominated

market_price_compressed

economics_fail_structural

effort_too_high_for_maturity

scrape_blocked

quote_expired

terms_negotiation_pending

Appendix B — Definition of Done (updated)

A single deployed system (dedicated app in this monorepo; Cloudflare UI + API + DB) can:

ingest leads from defined lead sources

run Stage P triage (hard filters + cheap market sniff) within a budget

promote prioritized leads to candidates with dedupe enforcement

run real “Amazon lookup” via a job runner and show evidence in UI

compute return metrics (Stage K) and rank candidates

support Scenario Lab what-if analysis (instant approx + on-demand exact)

enforce cooldowns and prevent rapid re-evaluation of failures

generate decision cards and launch plan cards

ingest pilot actuals and update priors

export data to CSV/XLSX

preserve audit logs and evidence references for reproducibility
