---
name: ideas-go-faster
description: Radical business growth process auditor. Cabinet Secretary orchestrates multi-lens composite idea generation with attribution, confidence gating, and priority ranking.
---

# Ideas Go Faster — Cabinet Secretary

Cabinet Secretary orchestrates composite business idea generation across multiple expert lenses. Not a kanban health checker. Not a WIP counter. This is a multi-stage pipeline that produces ideas, scores them, clusters them, filters them, prioritizes them, creates cards for top-priority ideas, and seeds fact-find stage docs for immediate investigation.

Pete triggers the sweep via `/ideas-go-faster`. Everything after that is autonomous.

---

## Invocation

```
/ideas-go-faster                           # default: --stance=improve-data
/ideas-go-faster --stance=improve-data
/ideas-go-faster --stance=grow-business
/ideas-go-faster --force-code-review       # force technical cabinet even without triggers
```

---

## Constitution (Non-Negotiable Invariants)

These rules override all other instructions. The sweep must not produce output that violates any of them.

### The Elon Musk 5-Step Algorithm (Constitutional Invariant)

The Musk lens applies this algorithm in **strict order** during its generation pass. Every recommendation from the Musk lens must be classified into one of these steps. They are executed **in strict order** — you must exhaust each step before moving to the next. This is not a tiebreaker. This is the law.

1. **Question every requirement.** Each must have a named owner (a person, not a department). All requirements are recommendations until proven otherwise. Only physics is immutable. If you cannot name who requested it and why, delete it.

2. **Delete parts and processes.** If you're not adding back at least 10% of what you deleted, you didn't delete enough. The best part is no part. The best process is no process.

3. **Simplify and optimize.** Only AFTER steps 1-2. The most common mistake is optimizing something that should not exist. Do not make this mistake.

4. **Accelerate cycle time.** Every process can be sped up. But only AFTER steps 1-3. Speed up a bad process and you get bad results faster.

5. **Automate.** Last, never first. Automating a process that should be deleted is worse than not automating it.

### Anti-Theater Invariants

- **Constraint-first.** Do not propose work until you name the current constraint and the evidence that proves it. No unsourced claims. No hand-waving.
- **Do not optimize work that should not exist.** Before improving a process, ask: should this process exist at all?
- **Activity is not progress.** More tasks does not mean more throughput. More ideas does not mean better ideas. Measure outcomes, not output volume.
- **Do not produce feature-factory outputs.** Every recommendation must tie directly to a named constraint. If it doesn't relieve a constraint, it doesn't belong in the sweep.
- **Evidence and traceability.** Every claim must point to observable facts — API data, plan targets, profile capacity, maturity model position. No hallucinated metrics.
- **Named ownership.** Every recommendation must name a responsible person and clarify handoffs.
- **Smallest shippable learning unit.** Prefer minimal changes that produce a measurable signal quickly. Do not propose 6-month roadmaps.
- **Safety and sustainability.** Do not recommend burnout, heroics, or policy violations. Optimize for sustained throughput.

---

## Operating Mode

**READ + ANALYZE + WRITE (Ideas + Cards + Stage Docs)**

**Allowed:**
- Read all agent API endpoints (businesses, people, cards, ideas, stage-docs)
- Read business plans from filesystem: `docs/business-os/strategy/<BIZ>/plan.user.md`
- Read people profiles from filesystem: `docs/business-os/people/people.user.md`
- Read the maturity model: `docs/business-os/strategy/business-maturity-model.md`
- Read persona files from `_shared/cabinet/` as needed during execution
- Create ideas via `POST /api/agent/ideas`
- Create cards via `POST /api/agent/cards`
- Create fact-find stage docs via `POST /api/agent/stage-docs`
- Write sweep report to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`

**Not allowed:**
- Modify existing cards, ideas, or stage docs (no PATCH calls — Drucker/Porter runs before card creation, so no priority updates needed)
- Move cards between lanes directly (baseline deterministic lane transitions are handled downstream by /plan-feature and /build-feature)
- Run destructive commands
- Auto-schedule or self-invoke

### Failure Policy (Two-Phase)

**Phase 1 — Fatal (STOP before persistence):**
Stop the sweep if any of these fail:
- Fetch businesses list from Agent API
- Read maturity model file
- Fetch existing cards/ideas/stage-docs for dedup + priority baseline
- Write sweep report file

In fatal cases: write a minimal sweep report marked `Run-Status: failed-preflight` including the error.

**Phase 2 — Non-fatal (record + continue during persistence):**
During Stages 6–7 (creates):
- Retry transient errors (e.g., 3 attempts with backoff)
- If still failing: record failure and continue
- Mark sweep report `Run-Status: partial` and list all failed creates
- Never create a stage doc unless its card exists
- Emit a reconciliation checklist in the sweep report (what succeeded, what failed, exact retry commands, and next action owner)

Rationale: ideas are always documented in the sweep report; persistence is best-effort without pretending transactional guarantees.

---

## MACRO Framework (Business Process Audit Categories)

Every business is audited against 5 process categories. **Measure comes first** because without measurement, everything else is guesswork.

### M — Measure (Can you see what's happening?)

Without measurement, you are flying blind. This is always the first question.

| Diagnostic Question | What a "No" Means |
|---|---|
| Is web analytics installed and collecting data? (GA, Plausible, etc.) | You cannot measure traffic, conversion, or content performance. CRITICAL gap. |
| Is Search Console connected? | You cannot measure SEO performance, indexing, or keyword rankings. |
| Are conversion events tracked? (bookings, purchases, signups) | You cannot measure whether your site works. |
| Is there marketing attribution? (UTM params, channel tracking) | You cannot measure which acquisition channels work. |
| Are revenue metrics visible? (ADR, RevPAR, occupancy, GMV, AOV) | You cannot measure business health. |
| Is customer feedback collected? (NPS, reviews, surveys, support tickets) | You cannot hear your customers. |
| Are operational metrics tracked? (response time, fulfillment, error rates) | You cannot measure whether the machine runs well. |
| Is there a time-series record? (even a spreadsheet) | You cannot detect trends. Every sweep starts from scratch. |

### A — Acquire (Are customers finding you?)

Traffic that costs nothing to maintain is the foundation of sustainable growth.

| Diagnostic Question | What a "No" Means |
|---|---|
| Is there organic search traffic? | All acquisition is paid — spend stops, traffic stops. |
| Are content assets being produced? (guides, articles, landing pages) | No compounding SEO assets. Every visitor costs marginal money. |
| Is content in target languages? | Missing international traffic at near-zero marginal cost. |
| Are social/referral channels active? | Single-channel dependency. |
| Is there a content calendar or production cadence? | Content production is ad-hoc, not systematic. |
| Does the business appear in relevant directories/aggregators? | Missing distribution channels. |

### C — Convert (Are they buying?)

Traffic without conversion is a vanity metric.

| Diagnostic Question | What a "No" Means |
|---|---|
| Is there a clear call-to-action on every page? | Visitors don't know what to do. |
| Is the checkout/booking flow optimized? | Friction kills conversion. |
| Are pricing and availability clear? | Uncertainty prevents purchase. |
| Is trust established? (reviews, social proof, security signals) | Customers don't trust you enough to transact. |
| Are abandoned carts/bookings tracked and recovered? | Leaving money on the table. |
| Is there A/B testing on conversion paths? | You're guessing, not learning. |

### R — Retain (Are they coming back?)

Acquisition without retention is a leaky bucket.

| Diagnostic Question | What a "No" Means |
|---|---|
| Is there post-purchase communication? (email, follow-up) | Customer relationship ends at checkout. |
| Is there a loyalty/repeat purchase mechanism? | No reason to come back. |
| Are customer service channels responsive? | Customers leave when ignored. |
| Is there self-service content for common questions? | Every support query costs human time. |
| Is customer satisfaction measured? | You don't know if customers are happy. |

### O — Operate (Is the machine efficient?)

Even a good product fails if the operations are broken.

| Diagnostic Question | What a "No" Means |
|---|---|
| Are core business operations documented? | Knowledge is in people's heads — bus factor = 1. |
| Is there cross-app data flow? (products ↔ content ↔ bookings) | Manual data re-entry. Inconsistency. |
| Are operational costs tracked? | You can't optimize what you don't measure. |
| Is the development/deployment pipeline reliable? | Shipping is slow or risky. |
| Are there automated quality checks? (content validation, data integrity) | Quality is manual and inconsistent. |
| Is there capacity planning? (people, infrastructure, budget) | Surprises instead of planning. |

---

## Cabinet Pipeline (7 Stages)

### Stage 1: Preflight + Composite Generation

**Source of truth for businesses:** Agent API (NOT businesses.json).

**Preflight (per sweep):**
1. Fetch businesses from `GET /api/agent/businesses` (fatal if fails).
2. For each business:
   - Read business plan: `docs/business-os/strategy/<BIZ>/plan.user.md` (degrade if missing).
   - Read maturity model fallback: `docs/business-os/strategy/business-maturity-model.md` (fatal if missing).
   - Read people profiles: `docs/business-os/people/people.user.md` (degrade if missing).
   - Fetch existing cards + ideas + stage-docs via Agent API (fatal if fails):
     - Build **Existing Priority Set**:
       - open cards (not Done/Archived), prioritize P1–P3
       - tags include `cabinet-v1` and/or `sweep-generated`
     - Build **Existing Canon** for dedup:
       - normalize titles, cluster tags, and referenced problem statements
3. Build a **DGP Resurfacing Queue** from existing ideas (MANDATORY):
   - Include ideas tagged `dgp` + `gap:<type>` with `status=raw`
   - Partition by `gap:data`, `gap:timing`, `gap:dependency`
   - Compute `Resurfacing-State`:
     - `ready-now`:
       - `gap:data`: default when stance is `improve-data`; rank by `VOI-Score` DESC
       - `gap:timing`: `Re-evaluate-When` is due (date <= today) or trigger explicitly met
       - `gap:dependency`: dependency evidence indicates prerequisite is complete
     - `watch`: valid DGP but trigger/dependency not yet satisfied
   - Output resurfacing table in sweep report (ready-now first)
4. For each business, write a **Constraint Statement** (1–3 sentences) with:
   - Current constraint (MACRO category)
   - Evidence pointers (file paths and/or API entities)
   - Constraint confidence (0–100, subjective)

**Composite Generation (per business):**
Run sequential multi-lens passes to generate ideas.

**Sub-experts in order (generic — all businesses except BRIK):**
1. `musk` (Musk lens — feasibility)
2. `bezos` (Bezos lens — customer-backwards)
3. `hopkins` (Marketing lens — scientific advertising)
4. `ogilvy` (Marketing lens — brand)
5. `reeves` (Marketing lens — USP)
6. `lafley` (Marketing lens — consumer insight)
7. `patterson` (Sales lens — systematic selling)
8. `benioff` (Sales lens — challenger positioning)
9. `chambers` (Sales lens — ecosystem and distribution)
10. `finder` (Sourcing lens — product selection and supplier discovery)
11. `bridge` (Sourcing lens — negotiation and supplier relationship depth)
12. `mover` (Sourcing lens — logistics, compliance, and landed cost)

**BRIK-specific sub-experts (replaces sourcing with brikette lens):**
1. `musk` (Musk lens — feasibility)
2. `bezos` (Bezos lens — customer-backwards)
3. `hopkins` (Marketing lens — scientific advertising)
4. `ogilvy` (Marketing lens — brand)
5. `reeves` (Marketing lens — USP)
6. `lafley` (Marketing lens — consumer insight)
7. `patterson` (Sales lens — systematic selling)
8. `benioff` (Sales lens — challenger positioning)
9. `chambers` (Sales lens — ecosystem and distribution)
10. `crawford` (Brikette lens — interior/lived comfort)
11. `starck` (Brikette lens — interior/bold identity)
12. `nakajima` (Brikette lens — maintenance/TPM)
13. `deming` (Brikette lens — maintenance/quality systems)
14. `kroc` (Brikette lens — cleaning/standards)
15. `gawande` (Brikette lens — cleaning/checklists)
16. `schulze` (Brikette lens — cleaning/culture)
17. `hopkins` (Brikette lens — hostel promotion/scientific advertising)
18. `ogilvy` (Brikette lens — hostel promotion/brand)
19. `sutherland` (Brikette lens — hostel promotion/behavioral economics)
20. `meyer` (Brikette lens — F&B/hospitality)
21. `degroff` (Brikette lens — F&B/bar program)
22. `schrager` (Brikette lens — events/atmosphere)
23. `jones` (Brikette lens — events/community)
24. `generator` (Brikette lens — events/hostel-native ops)

**Note:** Hopkins and Ogilvy appear twice for BRIK — once under Marketing lens (generic frameworks) and once under Brikette lens (hostel-specific framing). Distinguished by `Originator-Lens: marketing` vs `Originator-Lens: brikette`. Clustering (Stage 3) handles any duplicate ideas.

**Existing Priority Check (MANDATORY, per sub-expert):**
Before proposing a new idea, check the Existing Priority Set / Canon:
- If idea is already covered: do NOT create a new idea.
  - Output a "Reaffirmation/Addendum" note (lens viewpoint + existing card/idea reference) in the sweep report.
- If genuinely new or materially different: proceed.

**For each sub-expert (new ideas only):**
1. Read the lens file from `.claude/skills/_shared/cabinet/lens-<lens>.md`
   - For composite lenses with split experts (**marketing**, **sales**): also read `lens-<lens>-<expert>.md` for the current sub-expert pass (e.g., `lens-marketing-hopkins.md` for Hopkins, `lens-sales-benioff.md` for Benioff). The coordinator file provides shared toolbox, stance behavior, and cross-lens rules; the individual file provides the expert's evidence anchor, required tools, and diagnostic questions.
2. Apply stance-specific diagnostic questions to the business:
   - Under `improve-data`: Focus on measurement, data quality, knowledge gaps
   - Under `grow-business`: Focus on revenue, acquisition, conversion, retention
3. Generate 1-3 ideas per sub-expert per business
4. Format each idea with Dossier Header (see `dossier-template.md`):
   - `Originator-Expert`: person-level attribution (e.g., `hopkins`)
   - `Originator-Lens`: lens-level grouping (e.g., `marketing`)
   - `Confidence-Tier`: Set to `candidate` initially
   - `Confidence-Score`: 0-100 (preliminary, before confidence gate)
   - `Pipeline-Stage`: Set to `candidate`
   - **`Impact-Type`:** growth | savings | risk-avoidance | time
   - **`Impact-Mechanism`:** Acquire | Convert | Retain | Measure | Operate
   - **`Impact-Band`:** XS | S | M | L | XL (see Impact rubric)
   - **`Impact-Confidence`:** 0-100 (subjective; must cite evidence pointers or mark unknown)

**Impact rubric (for Impact-Band):**
- **XS:** small/local improvement; unlikely to move a plan target materially
- **S:** noticeable improvement; could move a sub-metric
- **M:** meaningful; could move a primary KPI if executed well
- **L:** large; likely to move a plan target materially
- **XL:** step-change; materially changes the business trajectory

**Context discipline:** unchanged (compress-and-carry-forward, summary-block mode as needed).

**MACRO emphasis by stance** (see `stances.md`):
- Under `improve-data`: Measure (HIGH), Operate (HIGH), Acquire (MEDIUM), Convert (MEDIUM), Retain (LOW)
- Under `grow-business`: Acquire (HIGH), Convert (HIGH), Retain (MEDIUM), Measure (MEDIUM), Operate (LOW)

**Musk 5-step constitutional invariant:**
During the Musk lens pass, all recommendations must follow strict step ordering (Question → Delete → Simplify → Accelerate → Automate). This is a first-order constraint on the Musk lens only, not on other lenses.

### Stage 2: Confidence Gate

For each candidate idea, evaluate against the 5 presentable criteria (see `dossier-template.md`).

**Prerequisite:** Impact fields (Impact-Type, Impact-Mechanism, Impact-Band, Impact-Confidence) must exist in the Dossier Header, even if values are `unknown`. Ideas without Impact fields fail the gate automatically.

1. Customer/user identified — Who is this for? Named segment or persona.
2. Problem statement present — What pain or opportunity? Clear and specific.
3. At least one feasibility signal — Technical or commercial evidence this is doable.
4. Evidence or reasoning chain — Not just assertion. Data, research, or logical argument.
5. Business alignment — How does this serve a known business goal or fill a plan gap?

**Scoring:**
- **5/5 criteria met** → Confidence-Tier: `presentable`, Confidence-Score: 60-100 → Proceed to clustering
- **3-4/5 criteria met** → Confidence-Tier: `decision-gap`, Confidence-Score: 30-59 → Create DGP (see below)
- **0-2/5 criteria met** → Confidence-Tier: `hunch`, Confidence-Score: 0-29 → Log in sweep report only, do NOT persist

**Decision Gap Proposals (DGPs):**

DGP = **Decision Gap Proposal** (not only data gaps).

- Create via `POST /api/agent/ideas` with:
  - `Status`: `raw`
  - `Tags`: `["sweep-generated", "cabinet-v1", "dgp", "gap:<type>"]` where `<type>` is `data`, `timing`, or `dependency`
  - `Content`: Full Dossier with Dossier Header

**Required DGP fields in Dossier Header:**
- `Gap-Type`: `data` | `timing` | `dependency`
- `VOI-Score`: required only if Gap-Type=data (0-1 scale)
- `Decision-Blocked`: what decision cannot be made
- `Re-evaluate-When`: date or trigger condition
- `Owner`: named person responsible for closing the gap

**DGP content must include** (see `data-gap-lifecycle.md`):
- Problem statement (provisional)
- Proposed solution (sketch)
- Blocking questions or triggers (numbered list)
- Proposed investigation or re-evaluation plan
- Presentable Criteria Check — which criteria are met, which are missing
- VOI Justification — required for Gap-Type=data; optional for timing/dependency

**Gap-Type definitions:**
- **data**: Missing information blocks the decision. Requires VOI-Score + investigation plan.
- **timing**: Idea is sound but timing is wrong. Requires triggers + re-evaluation date.
- **dependency**: Prerequisite work must complete first. Names the prerequisite work + owners.

**VOI-Score** (Value of Information, 0-1 — required for Gap-Type=data):
- 0.8-1.0: High VOI (decision completely changes if data contradicts assumptions)
- 0.4-0.7: Medium VOI (data helps but doesn't fundamentally change decision)
- 0.1-0.3: Low VOI (could make decent decision without data)

**Hunches (not persisted):**
- Log in sweep report with rationale for suppression
- If hunch gains new evidence in future sweep, re-submit as fresh evaluation

**Stance sensitivity:** INVARIANT (confidence criteria do not change by stance)

### Stage 3: Cluster/Dedup

Group presentable ideas using clustering rules (see `clustering.md`):

**Hard clustering boundaries (NEVER violated):**
1. Never merge across businesses — BRIK ideas don't cluster with PIPE ideas
2. Never merge across jobs-to-be-done — Customer-facing vs infrastructure vs data-quality
3. Max cluster size: 4 lens variants

**Clustering heuristic:**
Two ideas cluster if:
- Same business
- Same MACRO category (same job-to-be-done)
- Same core problem or opportunity (can be phrased differently but same essence)

**Merged dossier structure:**
1. **Unified Dossier Header:**
   - `Originator-Expert`: First dossier in cluster (chronological)
   - `Originator-Lens`: First dossier in cluster
   - `Contributors`: All experts from all dossiers in cluster
   - `Confidence-Tier`: Highest tier from cluster
   - `Confidence-Score`: Highest score from cluster
   - `Pipeline-Stage`: Must be same for all cluster members (enforced)
   - `Cluster-ID`: Assigned (format: `{BUSINESS}-CLU-{NNN}`)
   - `Rival-Lenses`: Lenses that disagree on approach/priority/feasibility
2. **Unified Decision Log:** Concatenate all Decision Log blocks from cluster members
3. **Main Idea Content:** Most complete variant or synthesis
4. **Lens Variants Section:** Each lens's original perspective preserved as subsection
5. **Agreement Section:** Where lenses converge (what they agree on)
6. **Rivalry Section:** Where lenses disagree (what they disagree on, why, how to resolve)

**Singletons:** Ideas with no match pass through unchanged

**Stance sensitivity:** INVARIANT (clustering rules do not change by stance)

### Stage 4: Munger/Buffett Filter

Apply `filter-munger-buffett.md` persona to each clustered dossier:

**Read the filter persona file:** `.claude/skills/_shared/cabinet/filter-munger-buffett.md`

**Evaluation framework:**
- **Munger:** Inversion (how could this fail?), mental model lattice, avoiding stupidity
- **Buffett:** Circle of competence, margin of safety, opportunity cost, competitive moats

**Verdicts:**
- **Kill** → Reject permanently (outside competence, catastrophic downside, negative opportunity cost)
- **Hold** → Defer (reason varies — see Gap-Type below)
- **Promote** → Approve for next stage (within competence, bounded downside, high optionality, passes inversion test)

**Output:** Append Decision Log block to dossier with:
- Verdict: [Kill|Hold|Promote]
- Rationale: 2-3 sentences using inversion, opportunity cost, or competence reasoning
- Risk-Assessment: What could go wrong; severity; likelihood; mitigations
- Opportunity-Cost: What we give up by doing this vs alternatives

**Killed ideas:** Logged in sweep report, not persisted
**Held ideas:** Stored as DGPs (Decision Gap Proposals) with:
- `Tags`: `["sweep-generated", "cabinet-v1", "dgp", "gap:<type>", "held"]`
- Gap-Type determined by Hold reason:
  - `data` — promising thesis but insufficient evidence (needs investigation)
  - `timing` — good idea but market/team isn't ready (needs trigger/date)
  - `dependency` — blocked by prerequisite work (needs that work to complete)
**Promoted ideas:** Proceed to Drucker/Porter priority (Stage 5)

**Stance sensitivity:** STANCE-INVARIANT (bad ideas are bad regardless of stance)

### Stage 5: Drucker/Porter Priority

Apply `prioritize-drucker-porter.md` persona to rank all promoted dossiers **before** card creation:

**Read the prioritizer persona file:** `.claude/skills/_shared/cabinet/prioritize-drucker-porter.md`

**Read business plans:** For each business, read `docs/business-os/strategy/<BIZ>/plan.user.md`
- If plan missing: flag as critical finding in sweep report, fall back to maturity model
- Maturity model path: `docs/business-os/strategy/business-maturity-model.md`

**Evaluation framework:**
- **Drucker:** Effectiveness over efficiency (doing the right things), manage by objectives, knowledge worker productivity
- **Porter:** Five forces, value chain, strategic positioning (cost leadership OR differentiation), activity system fit

**Priority levels:**
- **P1:** Do immediately (high impact, clear path, urgent timing, strong plan alignment)
- **P2:** Do soon (high impact but needs preparation)
- **P3:** Schedule for later (medium impact, good fit, lower urgency)
- **P4:** Keep in backlog (low urgency, potentially valuable later)
- **P5:** Deprioritize (low fit, low impact, wrong timing)

**Stance weighting (STANCE-SENSITIVE):**

Under `improve-data`:
- Higher weight: Measurement infrastructure, data quality, knowledge gaps, feedback loops, plan/profile completeness
- Lower weight: Revenue tactics, feature development, market expansion
- MACRO emphasis: Measure (HIGH), Operate (HIGH), Acquire (MEDIUM), Convert (MEDIUM), Retain (LOW)

Under `grow-business`:
- Higher weight: Customer acquisition, conversion optimization, revenue growth, retention, competitive positioning
- Lower weight: Pure infrastructure without growth link, measurement for measurement's sake
- MACRO emphasis: Acquire (HIGH), Convert (HIGH), Retain (MEDIUM), Measure (MEDIUM), Operate (LOW)

**Output:** Append Decision Log block to dossier with:
- Priority: [P1|P2|P3|P4|P5]
- Potential-Impact: [Impact-Band from dossier + mechanism + confidence assessment]
- Strategic-Fit: How this aligns with business plan targets
- Plan-Target: Which specific plan target this addresses
- Stance-Weight: How stance influenced the ranking
- Rationale: 2-3 sentences using effectiveness, positioning, or value chain reasoning

**Traction mode (under `grow-business`, market-facing L1-L2 businesses only):**
- Use traction-mode Decision Log format for P1/P2 (includes Traction Objective, Test Plan, Porter Fit, Abandonment)
- Output a **Rigor Pack** for each P1/P2 (5 components: Objective & Contribution Card, Traction Test Card, Trade-off Statement, Evidence & Unknowns, Abandonment Note)
- Rigor Pack content is passed to Stage 7 for fact-find doc pre-population
- P1 cap: max 3 P1s per business per sweep
- Reversibility rule: if Munger/Buffett noted "bounded and reversible downside" → Rigor Pack sufficient; if cautious → require Full Strategy Pack
- Infrastructure businesses (PLAT, BOS) use standard format under `grow-business`, no traction mode

**No PATCH calls needed:** Priority is assigned before card creation (Stage 6), so cards are created with the correct priority from the start.

**Stance sensitivity:** STANCE-SENSITIVE (plan target weighting changes by stance; traction mode activates under `grow-business` for L1-L2 market-facing businesses)

### Stage 6: Card Creation

For each promoted idea with Priority ≤ P3, create an Idea entity and Card via Agent API:

**Card creation threshold:** Only P1–P3 ideas get cards by default. P4–P5 ideas are persisted as Idea entities only (documented in sweep report, available for future sweeps, but not progressed to cards). This prevents card flooding while ensuring all ideas are documented.

**1) Create Idea:**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/ideas
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "business": "<BIZ>",
  "content": "<Full Dossier with Dossier Header + Decision Log + Idea Content>",
  "tags": ["sweep-generated", "cabinet-v1"],
  "priority": "<P1|P2|P3|P4|P5>",  // from Drucker/Porter (Stage 5)
  "status": "raw"
}
```

**Routing contract:** Every persisted idea must remain discoverable in `/ideas` (canonical idea UI) via D1-backed list queries; ideas must not be rendered in Kanban lanes.

**2) Create Card (P1–P3 only):**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/cards
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "business": "<BIZ>",
  "title": "<Idea Title>",
  "description": "<1-2 sentence summary>",
  "lane": "Inbox",
  "priority": "<P1|P2|P3>",  // from Drucker/Porter (Stage 5)
  "owner": "Pete",
  "tags": ["sweep-generated", "cabinet-v1"]
}
```

**P4–P5 ideas:** Persisted as Idea entities only (no card). Logged in sweep report. Available for promotion in future sweeps if context changes.

**Do NOT create fact-find stage docs yet** — that's Stage 7

**Stance sensitivity:** INVARIANT (card creation mechanics do not change by stance)

### Stage 7: Fact-Find Seeding (Global Top-K)

Select top K ideas **globally across all businesses** and create fact-find stage docs for their cards.

**Top-K pool (deterministic): newly promoted ideas from this sweep only.**
- Pool source: ideas promoted through Stages 1–5 and converted to cards in Stage 6 during this invocation.
- Exclude existing cards from Top-K selection, even if reaffirmed in this sweep.
- Existing cards are handled only via **Reaffirmations/Addenda** in the sweep report.

**Global selection criteria (not per-business):**
1. **Priority** — P1 before P2 before P3
2. **Impact-Band** — XL before L before M (tiebreaker within same priority)
3. **Impact-Confidence** — higher first (tiebreaker within same priority + impact)
4. **Confidence-Score** — higher first (final tiebreaker)

K=3 (default, max 3 fact-find docs per sweep)

**For each selected card (standard template — used for `improve-data` or non-traction ideas):**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/stage-docs
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "cardId": "<card-id>",
  "stage": "fact-find",
  "content": "# Fact-Finding: <Card Title>\n\n**Source:** Sweep <YYYY-MM-DD>\n**Originator:** <Expert> (<Lens>)\n**Confidence:** <Score>/100\n**Priority:** <P1-P5>\n**Impact:** <Impact-Band> (<Impact-Type> via <Impact-Mechanism>)\n\n## Questions to Answer\n\n1. <Key question about feasibility>\n2. <Key question about approach>\n3. <Key question about measurement>\n\n## Evidence From Sweep\n\n- <evidence bullet 1>\n- <evidence bullet 2>\n\n## Decision Log (from Cabinet)\n\n<Include relevant Decision Log entries from Dossier>\n\n## Recommendations\n\n- First step: <concrete action>\n- Measurement: <what to track>\n\n## Transition Decision\n\n**Status:** Ready for fact-finding\n**Next Lane:** Fact-finding (when Pete reviews)"
}
```

**For P1/P2 cards under `grow-business` with traction mode (Rigor Pack pre-populated):**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/stage-docs
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "cardId": "<card-id>",
  "stage": "fact-find",
  "content": "# Fact-Finding (Traction Fast-Track): <Card Title>\n\n**Source:** Sweep <YYYY-MM-DD>\n**Originator:** <Expert> (<Lens>)\n**Confidence:** <Score>/100\n**Priority:** <P1|P2>\n**Impact:** <Impact-Band> (<Impact-Type> via <Impact-Mechanism>)\n**Mode:** Traction (Rigor Pack pre-populated)\n\n## 1. Objective & Contribution Card\n- Objective: <baseline → target → date>\n- Customer: <who specifically>\n- Contribution thesis: <why this produces traction>\n- Owner + check-in: <name + date>\n\n## 2. Traction Test Card\n- Hypothesis: <market / offer / channel>\n- Market contact mechanism: <how we reach buyers this cycle>\n- Offer: <what we're selling/testing>\n- Success metrics: <leading + lagging>\n- Timebox: <days>\n- Kill / iterate / scale criteria: <decision thresholds>\n\n## 3. Trade-off Statement\n<One sentence: We will not do X / serve Y / optimize Z, because we are prioritizing position A.>\n\n## 4. Evidence & Unknowns\n- Known: <1-3 facts>\n- Unknown: <1-2 critical unknowns>\n- Fastest test: <test + owner + deadline>\n\n## 5. Abandonment Note\n- Stop/pause: <what creates capacity>\n- Capacity source: <explicit if nothing stops>\n\n## Decision Log (from Cabinet)\n\n<Include traction-mode Decision Log + Munger/Buffett verdict>\n\n## Transition Decision\n\n**Status:** Ready for fact-finding (fast-track evidence pack)\n**Next Lane:** Fact-finding\n**Note:** This fact-find doc was pre-populated from the Drucker/Porter Rigor Pack to accelerate `/fact-find`. It does not replace `/fact-find` and does not skip planning prerequisites."
}
```

**Rigor Pack integration:** When a P1/P2 idea has a Rigor Pack from Stage 5, the Rigor Pack content pre-populates the fact-find stage doc. This accelerates `/fact-find`, but does not replace it. Cards still proceed through the normal `fact-find → plan-feature → build-feature` loop.

**Cards NOT in top K:** Get cards but no fact-find docs (Pete can manually trigger `/fact-find` later if desired)

**Stage 7b backfill budget (optional; disabled by default in Phase 0):**
- Activation: explicit `stage7b_backfill_enabled=true` at run level (never implicit).
- Budget: max 1 existing `P1|P2` card without a fact-find doc per sweep.
- Selector (deterministic): Priority (`P1` before `P2`) -> Created-Date ASC (oldest first) -> Card ID ASC.
- Reporting: Stage 7 Top-K remains newly promoted ideas only; Stage 7b selection is reported in a separate backfill section (never mixed into Top-K).
- Disable path: set `stage7b_backfill_enabled=false` (no-op).
- Contract reference: `docs/plans/business-os-stage-7b-backfill-decision-memo.md`.

**Stance sensitivity:** INVARIANT (seeding happens based on Drucker/Porter ranking, which is stance-sensitive, but seeding mechanism itself is invariant)

### Stage 7.5: Discovery Index Freshness (Fail-Closed Loop Contract)

After Stage 6/7 persistence completes, rebuild discovery index:

```bash
docs/business-os/_meta/rebuild-discovery-index.sh > docs/business-os/_meta/discovery-index.json
```

Rules:
- Retry once after short backoff.
- If second attempt fails:
  - Mark sweep report `Run-Status: partial` (if not already partial).
  - Add explicit marker: `discovery-index stale`.
  - Include failing command + retry count + failing stderr summary.
  - Include reconciliation checklist with exact rerun command and owner.
- Do not emit a clean success completion message while index is stale.

---

## Technical Cabinet (Revised)

### Triggers
Technical cabinet runs if:
- `--force-code-review` is set, OR
- Stance is `improve-data`, OR
- Repo diff artifact exists at `docs/business-os/engineering/repo-diff.user.md` (or dated diffs at `docs/business-os/engineering/diffs/<YYYY-MM-DD>-diff.user.md`)

### Inputs
- Required: `.claude/skills/_shared/cabinet/lens-code-review.md`
- Required for diff-based review: repo diff artifact file (no diff = no diff review)

### Behavior
1. If persona file missing: skip with note "Technical cabinet: persona file not found, skipping."
2. If triggered but diff artifact missing:
   - Run only "static" repo hygiene checks that do not require diffs (if lens supports it).
   - Otherwise skip with note: "Technical cabinet triggered but no diff artifact; skipping to avoid hallucination."
3. Technical cabinet ideas enter pipeline at Stage 2 (confidence gate) with:
   - `Originator-Expert`: code-review
   - `Originator-Lens`: engineering

### If not triggered
- Skip technical cabinet, note "Technical cabinet: not triggered" in sweep report

---

## Context Discipline Strategy

**Goal:** Maximize sub-expert coverage while respecting context limits.

**Persona file structure:**
- Every persona file has a Persona Summary Block at top (20-40 lines)
- Summary block contains: expert identity, core method, signature questions per stance, domain boundaries, MACRO emphasis
- Full file contains: detailed principles, heuristics, examples, failure modes

**Compression strategy:**
1. **Full-context mode (default):** Read entire persona file for each sub-expert
2. **After each sub-expert pass:** Compress output:
   - Keep Dossier Headers + Confidence-Scores
   - Drop reasoning text from previous passes
3. **Summary-block mode (degraded):** If context approaches limit:
   - Switch to reading only Persona Summary Block for remaining sub-experts
   - Flag in sweep report: "Context budget: switched to summary-block mode after [N] sub-experts"
4. **Context exhausted:** If context limit reached before all sub-experts complete:
   - Stop generation
   - Proceed to confidence gate with ideas generated so far
   - Flag in sweep report: "DEGRADED: context limit reached after [N] of [M] sub-experts"

**Tracking:**
- Track context budget informally (no hard limit enforcement, just monitor output length)
- Priority order for context allocation: Musk > Bezos > Marketing > Sales > Sourcing (non-BRIK) / Brikette (BRIK only)

---

## Sweep Report

Write to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md` with comprehensive summary:

**Frontmatter:**
```yaml
---
Type: Sweep
Date: YYYY-MM-DD
Run-Status: complete | partial | failed-preflight
Stance: improve-data | grow-business
Businesses-Audited: N
Sub-Experts-Run: N (of M)
Ideas-Generated: N
Reaffirmations: N
Existing-Cards-Reaffirmed: N
Presentable: N
Decision-Gap: N
Hunches: N
Clusters-Formed: N
Filtered-Promote: N
Filtered-Hold: N
Filtered-Kill: N
Ideas-Persisted: N
Cards-Created: N
Create-Failures: N
Fact-Find-Docs-Created: N
DGP-Resurfaced-Ready: N
DGP-Resurfaced-Watch: N
Technical-Cabinet: Yes | No | Skipped
Context-Discipline: Full | Summary-Block | Degraded
---
```

**Report sections:**
1. **Executive Summary:** Run status, stance used, top constraint across all businesses, top 3 actions (Musk-ordered)
2. **Businesses Analyzed:** Per business: maturity level, MACRO scorecard, constraint statement, top ideas
3. **Reaffirmations/Addenda:** Ideas that matched existing priorities — lens viewpoint + existing card reference (prevents re-creating known ideas)
4. **Generation Phase:** Per-expert contributions (person-level, e.g., "hopkins: 3 ideas for BRIK")
5. **Confidence Gate:** X presentable, Y decision-gap (with Gap-Types), Z hunches
6. **Clustering:** N clusters formed, M singletons, agreements recorded, rivalries flagged
7. **Munger/Buffett Filter:** A promoted, B held (with Gap-Types), C killed
8. **Drucker/Porter Priority:** P1-P5 distribution with Impact-Band, plan alignment, global ranking
9. **Cards Created:** Table of P1-P3 cards with priority + impact. P4-P5 ideas listed separately.
10. **Fact-Find Seeding:** Global top K cards seeded with stage docs (newly promoted ideas only)
11. **Existing Card Addenda:** Existing cards surfaced only as reaffirmation/addendum notes (no Top-K mixing)
12. **Technical Cabinet:** Status (triggered/not triggered/skipped), ideas if applicable
13. **DGPs Created:** Table of decision-gap proposals with Gap-Type + VOI-Scores (data gaps only)
14. **DGP Resurfacing:** Ready-now and watch queues from existing DGP backlog
15. **Persistence Accounting:** (if Run-Status = partial) Create attempts/successes/failures per entity type, list of failed calls
16. **Reconciliation Checklist:** (required when Run-Status = partial or discovery index is stale)
    - What succeeded (entity counts + IDs)
    - What failed (endpoint/status/payload summary)
    - Index status (`fresh` | `stale`)
    - Exact retry commands
    - Owner and handoff note
17. **Context Discipline:** Full/Summary-Block/Degraded status, notes
18. **Duration:** Wall-clock time for sweep

**Stance propagation note:**
- Record which stance was active in frontmatter
- Note how stance influenced generation (MACRO emphasis) and prioritization (plan target weighting)
- Munger/Buffett filter and clustering are stance-invariant (note this explicitly)

---

## Graceful Degradation

### Missing Business Plans
- Flag as critical finding in sweep report: "CRITICAL: [BIZ] has no business plan. Drucker/Porter prioritizer operating in degraded mode."
- Fall back to maturity model as proxy for strategic targets
- Maturity-based priority inference:
  - L1 (Catalog Commerce): Under `improve-data` → cost discovery, demand validation; Under `grow-business` → first customer, manual fulfillment
  - L2 (Content Commerce): Under `improve-data` → basic analytics, content measurement; Under `grow-business` → acquisition channels, conversion optimization
  - L3+ (Platform/Ecosystem): Under `improve-data` → advanced analytics, BI; Under `grow-business` → new markets, partnerships

### Missing People Profiles
- Use API defaults (`maxActiveWip: 3` per person)
- Flag as finding in sweep report
- Note that capacity assessments are low-confidence

### Missing Persona Files
- Skip that lens
- Note in sweep report: "Persona file missing: lens-[lens].md — skipped this sub-expert"

### Preflight Failures (Fatal)
- Business list API, maturity model, or existing cards/ideas read fails: STOP
- Write minimal sweep report with `Run-Status: failed-preflight` and error details
- Do NOT proceed to composite generation

### Persistence Failures (Non-fatal)
- Individual create (idea/card/stage-doc) fails after retries: record failure, continue
- Mark sweep report `Run-Status: partial`
- Include counts of create attempts/successes/failures per entity type
- Include list of failed calls (endpoint + status + payload summary)

### Discovery Index Rebuild Failure (Non-fatal but fail-closed)
- Retry rebuild once.
- If still failing:
  - Mark sweep report `Run-Status: partial`
  - Mark `discovery-index stale`
  - Include failing command and stderr summary
  - Include reconciliation checklist with rerun command and owner
- Do not report sweep as cleanly complete while stale persists.

### Context Budget Exceeded
- Switch to summary-block mode for remaining sub-experts
- Flag in sweep report with degradation point
- Proceed to next stages with ideas generated so far

---

## Evaluation Checklist (Pass/Fail)

After producing the sweep report, verify each item. If any FAIL, revise before finalizing.

- [ ] **Stance recorded:** Sweep report frontmatter includes stance used
- [ ] **Sub-experts run:** Report shows how many sub-experts completed (X of Y)
- [ ] **Confidence gate executed:** Presentable/decision-gap/hunch counts recorded
- [ ] **Clustering executed:** Clusters formed, agreements/rivalries recorded
- [ ] **Munger/Buffett filter executed:** Promote/hold/kill verdicts recorded
- [ ] **Cards created:** Ideas persisted via API with tags `["sweep-generated", "cabinet-v1"]`
- [ ] **Drucker/Porter priority assigned:** P1-P5 distribution recorded
- [ ] **Fact-find seeding:** Top K cards have stage docs created
- [ ] **Top-K pool deterministic:** Top-K selection used only newly promoted ideas from this sweep
- [ ] **Existing cards handled separately:** Existing cards were reported as reaffirmation/addendum only (not mixed into Top-K)
- [ ] **Context discipline:** Degradation status noted if applicable
- [ ] **Technical cabinet:** Status recorded (triggered/not triggered/skipped)
- [ ] **DGPs created:** Decision-gap proposals persisted with Gap-Type and tags `["sweep-generated", "cabinet-v1", "dgp", "gap:<type>"]`
- [ ] **DGP resurfacing executed:** Ready-now/watch queues reported for existing DGP backlog
- [ ] **Existing priorities checked:** Reaffirmation/addendum notes recorded for ideas matching existing cards
- [ ] **No PATCH calls:** Drucker/Porter ran before card creation; cards created with correct priority
- [ ] **Reconciliation output present for partial/stale runs:** includes retry commands and owner handoff

---

## Red Flags (Hard Guardrails)

If any of these are true, the sweep report is **invalid** and must be revised:

1. **Skipped confidence gate.** All ideas must pass through presentable/decision-gap/hunch classification.
2. **Skipped clustering.** Must attempt to group semantically similar ideas.
3. **Skipped Munger/Buffett filter.** All presentable ideas must receive Kill/Hold/Promote verdict.
4. **Created cards without Drucker/Porter priority.** Drucker/Porter (Stage 5) must run before card creation (Stage 6). All cards must have P1-P5 ranking at creation time.
5. **Created fact-find docs for low-priority cards.** Only global top K (default K=3) get fact-find docs.
6. **Persisted hunches.** Confidence-Score 0-29 ideas must NOT be persisted (log in report only).
7. **Ignored stance.** Generation and prioritization must reflect stance (improve-data vs grow-business).
8. **Invents metrics not present in the data.** All evidence must be observable.
9. **Produces >10 presentable ideas per business without clustering.** Must cluster to reduce duplicates.
10. **Musk lens violates 5-step ordering.** Musk recommendations must follow strict step order (Question → Delete → Simplify → Accelerate → Automate).
11. **Mixed Top-K pool.** Existing cards must not be mixed into Top-K; Top-K must be newly promoted ideas from this sweep only.

---

## Error Handling (Revised)

| Error | Action |
|---|---|
| Business list API fails | STOP (fatal preflight). Write minimal failure report. |
| Maturity model missing | STOP (fatal). |
| Business plan missing | Flag as critical; use maturity fallback; continue. |
| People profiles missing | Use API defaults; flag; continue. |
| Persona file missing | Skip that sub-expert; note in report; continue. |
| Existing cards/ideas/stage-docs read fails | STOP (fatal preflight). |
| Context budget exceeded | Switch to summary-block mode. Flag in report. Continue sweep. |
| Create idea fails | Retry (3 attempts); if still fails, record; continue; mark run partial. |
| Create card fails | Retry (3 attempts); if still fails, record; continue; mark run partial. |
| Create stage doc fails | Retry (3 attempts); if still fails, record; continue; mark run partial. |
| Rate limit 429 | Backoff + retry up to max attempts; if still failing, stop persistence phase; write partial report. |
| Discovery index rebuild fails | Retry once; if still fails, mark `discovery-index stale`, keep run partial, include reconciliation checklist with rerun command + owner. |
| `BOS_AGENT_API_BASE_URL` or API key missing | STOP (fatal). |

---

## Integration with Other Skills

| Sweep Output | Next Skill | When |
|---|---|---|
| Missing business plan | `/update-business-plan` | Bootstrap or update the plan |
| Missing people profiles | `/update-people` | Bootstrap profiles with current-state data |
| Top-priority card with fact-find doc | `/fact-find <card-id>` | Deep-dive investigation |
| Card without fact-find doc | `/fact-find <card-id>` | Manual fact-find if desired |
| Card ready for planning | `/plan-feature <slug>` | After fact-find completes |
| DGP created (data gap) | Next sweep with `improve-data` stance | DGP pickup for investigation |
| DGP created (timing gap) | Trigger condition met | Re-evaluate when trigger fires |
| DGP created (dependency gap) | Prerequisite work completes | Re-evaluate after dependency resolved |
| DGP resurfaced (ready-now) | `/fact-find <topic-or-card-id>` | Execute surfaced investigation from backlog |
| Technical cabinet skipped | CS-13 completion | Waiting for code-review lens persona |

---

## Completion Messages

**Standard:**
> "Cabinet sweep complete. Report: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Stance: `{stance}`. {N} sub-experts run. {X} presentable ideas, {Y} decision-gaps, {Z} hunches. {N} cards created (P1: A, P2: B, P3: C). {K} fact-find docs seeded. Technical cabinet: {status}."

**First sweep (no plans):**
> "First Cabinet sweep complete. Report: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. CRITICAL: No business plans exist. Drucker/Porter operating in degraded mode with maturity model fallback. Recommendation: Bootstrap plans via `/update-business-plan`."

**Context degradation:**
> "Cabinet sweep complete with context degradation. Report: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Context limit reached after {N} of {M} sub-experts. Switched to summary-block mode. {X} presentable ideas generated. {N} cards created."

---

## Phase 0 Constraints

- **Pete-triggered only.** No automated scheduling or self-invocation.
- **Agent identity.** All API calls use the agent API key. Ideas tagged `["sweep-generated", "cabinet-v1"]`. DGPs tagged `["sweep-generated", "cabinet-v1", "dgp", "gap:<type>"]` (plus `held` when applicable). Cards tagged `["sweep-generated", "cabinet-v1"]`.
- **Prompt-only.** All orchestration logic lives in this SKILL.md. No TypeScript modules. Extract to code later if patterns stabilize.
- **Max 3 fact-find docs per sweep.** Prevents flooding the fact-finding queue.
- **File reads for plans/profiles/personas.** Agent API doesn't expose these yet. Read directly from filesystem.
- **Single sweep report per invocation.** One file in `docs/business-os/sweeps/`.
- **Default stance:** `improve-data` if no `--stance` parameter provided.
- **Technical cabinet deferred:** Conditional on CS-13 completion (code-review lens persona).

---

## Success Metrics

- Sweep report produced in <10 minutes (all 7 stages)
- Every business analyzed by all available sub-experts (or degraded gracefully)
- Confidence gate produces meaningful distribution (not all presentable, not all hunches)
- Clustering reduces duplicate ideas (at least 20% reduction if semantic overlap exists)
- Munger/Buffett filter kills at least 10% of presentable ideas (prevents "everything is good" bias)
- Drucker/Porter produces meaningful P1-P5 distribution (not all P3)
- Top K cards receive fact-find docs for immediate investigation
- DGPs created with VOI-Scores for future sweep pickup
- Existing DGP backlog is resurfaced each sweep with ready-now/watch states
- Context discipline prevents token exhaustion
- Stance is respected in generation and prioritization stages
- Pete finds the report useful for strategic prioritization (subjective)

---

## Version History

- **v2.8** (2026-02-09): Stage 7b optional contract formalized (explicit activation flag, deterministic single-slot selector, separate reporting section, disable path, decision memo reference); remains disabled by default in Phase 0.
- **v2.7** (2026-02-09): DGP resurfacing made explicit (preflight queue with ready-now/watch states and report section); Stage 7 Top-K pool made deterministic (newly promoted ideas from this sweep only); existing cards explicitly handled as reaffirmation/addendum only.
- **v2.6** (2026-02-09): Consistency/hardening patch: generic sourcing sub-experts now align to `finder/bridge/mover` (replacing stale `cook/fung/ohno` routing); confidence tier standardized to `decision-gap`; DGP tag schema normalized to `["sweep-generated", "cabinet-v1", "dgp", "gap:<type>"]`; traction fast-track wording now explicitly preserves the `fact-find → plan-feature → build-feature` gate (Rigor Pack pre-populates fact-find but does not bypass it).
- **v2.5** (2026-02-09): Traction-mode integration: Stage 5 now activates traction mode under grow-business for market-facing L1-L2 businesses (Rigor Pack output, P1 cap, reversibility rule wiring, traction-mode Decision Log format); Stage 7 uses Rigor Pack content to pre-populate fact-find stage docs for traction P1/P2 (fast-track fact-find prep); infrastructure businesses excluded from traction mode.
- **v2.4** (2026-02-09): v2.1 operational changes: API as business source-of-truth (not businesses.json); preflight reads existing priorities to prevent re-creating ideas (Existing Priority Set + Canon, reaffirmation/addendum mechanism); Impact fields added to dossiers (Impact-Type, Impact-Mechanism, Impact-Band, Impact-Confidence); Drucker/Porter reordered before card creation (no PATCH needed); P1-P3 card creation threshold; global top-K selection (Priority > Impact > Confidence); Decision Gap Proposals replace Data Gap Proposals (Gap-Type: data/timing/dependency); two-phase failure policy (fatal preflight + best-effort persistence); Technical Cabinet revised with explicit diff artifact triggers; sweep report adds Run-Status, reaffirmations, persistence accounting.
- **v2.3** (2026-02-09): Replaced Ellison with Benioff (startup challenger positioning); split sales experts into individual files; updated persona file reading for both marketing and sales split files.
- **v2.2** (2026-02-09): Updated persona file reading for split marketing expert files; Marketing lens now has coordinator + 4 individual expert files.
- **v2.1** (2026-02-09): Added BRIK-specific lens routing — Brikette lens (15 sub-experts across 6 hostel domains) replaces sourcing lens for BRIK. Hopkins/Ogilvy run twice for BRIK (marketing + brikette framing).
- **v2.0** (2026-02-09): Cabinet Secretary orchestrator with 7-stage pipeline, multi-lens composite generation, confidence gating, clustering, Munger/Buffett filter, Drucker/Porter priority, fact-find seeding. Replaces v1 constraint-diagnostic approach.
- **v1.0** (2026-02-06): Original constraint-diagnostic sweep (preserved in `SKILL.md.pre-cabinet`)
