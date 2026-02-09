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
- Modify existing cards, ideas, or stage docs (no PATCH calls)
- Move cards between lanes (use `/propose-lane-move`)
- Run destructive commands
- Auto-schedule or self-invoke

**Fail-closed:** If any API call fails, stop and surface the error. Do not write the sweep report with partial data.

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

### Stage 1: Composite Generation

For each business in `businesses.json`, execute a sequential multi-lens pass to generate ideas:

**Sub-experts in order (generic — all businesses except BRIK):**
1. `musk` (Musk lens — feasibility)
2. `bezos` (Bezos lens — customer-backwards)
3. `hopkins` (Marketing lens — scientific advertising)
4. `ogilvy` (Marketing lens — brand)
5. `reeves` (Marketing lens — USP)
6. `lafley` (Marketing lens — consumer insight)
7. `patterson` (Sales lens — systematic selling)
8. `ellison` (Sales lens — competitive positioning)
9. `chambers` (Sales lens — partner ecosystems)
10. `cook` (Sourcing lens — supply chain)
11. `fung` (Sourcing lens — trading networks)
12. `ohno` (Sourcing lens — lean/quality)

**BRIK-specific sub-experts (replaces sourcing with brikette lens):**
1. `musk` (Musk lens — feasibility)
2. `bezos` (Bezos lens — customer-backwards)
3. `hopkins` (Marketing lens — scientific advertising)
4. `ogilvy` (Marketing lens — brand)
5. `reeves` (Marketing lens — USP)
6. `lafley` (Marketing lens — consumer insight)
7. `patterson` (Sales lens — systematic selling)
8. `ellison` (Sales lens — competitive positioning)
9. `chambers` (Sales lens — partner ecosystems)
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

**For each sub-expert:**
1. Read the persona file from `.claude/skills/_shared/cabinet/lens-<lens>.md` (each lens file contains all its sub-experts)
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

**Context discipline:**
- After each sub-expert pass, compress-and-carry-forward:
  - Keep scored ideas + Dossier Headers
  - Drop reasoning text from previous passes
- Track context budget informally
- If context approaches limit: switch remaining persona passes to summary-block mode (read only the Persona Summary Block at top of file, skip full content)
- If context exhausted: log "DEGRADED: context limit reached after [N] of [M] sub-experts" in sweep report

**MACRO emphasis by stance** (see `stances.md`):
- Under `improve-data`: Measure (HIGH), Operate (HIGH), Acquire (MEDIUM), Convert (MEDIUM), Retain (LOW)
- Under `grow-business`: Acquire (HIGH), Convert (HIGH), Retain (MEDIUM), Measure (MEDIUM), Operate (LOW)

**Musk 5-step constitutional invariant:**
During the Musk lens pass, all recommendations must follow strict step ordering (Question → Delete → Simplify → Accelerate → Automate). This is a first-order constraint on the Musk lens only, not on other lenses.

### Stage 2: Confidence Gate

For each candidate idea, evaluate against the 5 presentable criteria (see `dossier-template.md`):

1. Customer/user identified — Who is this for? Named segment or persona.
2. Problem statement present — What pain or opportunity? Clear and specific.
3. At least one feasibility signal — Technical or commercial evidence this is doable.
4. Evidence or reasoning chain — Not just assertion. Data, research, or logical argument.
5. Business alignment — How does this serve a known business goal or fill a plan gap?

**Scoring:**
- **5/5 criteria met** → Confidence-Tier: `presentable`, Confidence-Score: 60-100 → Proceed to clustering
- **3-4/5 criteria met** → Confidence-Tier: `data-gap`, Confidence-Score: 30-59 → Create DGP (see below)
- **0-2/5 criteria met** → Confidence-Tier: `hunch`, Confidence-Score: 0-29 → Log in sweep report only, do NOT persist

**Data Gap Proposals (DGPs):**
- Create via `POST /api/agent/ideas` with:
  - `Status`: `raw`
  - `Tags`: `["data-gap", "sweep-generated"]`
  - `Content`: Full Dossier with Dossier Header including `VOI-Score: 0-1`
- DGP must include (see `data-gap-lifecycle.md`):
  - Problem statement (provisional)
  - Proposed solution (sketch)
  - Data Gaps (Critical) — numbered list of blocking questions
  - Proposed Investigation — how to fill gaps, timeline, decision gate
  - VOI Justification — why filling this gap is valuable
  - Presentable Criteria Check — which criteria are met, which are missing

**VOI-Score** (Value of Information, 0-1):
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
- **Hold** → Defer (promising but insufficient evidence, uncertain timing, low information cost to resolve)
- **Promote** → Approve for next stage (within competence, bounded downside, high optionality, passes inversion test)

**Output:** Append Decision Log block to dossier with:
- Verdict: [Kill|Hold|Promote]
- Rationale: 2-3 sentences using inversion, opportunity cost, or competence reasoning
- Risk-Assessment: What could go wrong; severity; likelihood; mitigations
- Opportunity-Cost: What we give up by doing this vs alternatives

**Killed ideas:** Logged in sweep report, not persisted
**Held ideas:** Stored as DGPs (same as Stage 2 data-gap ideas) with `Tags: ["held", "sweep-generated"]`
**Promoted ideas:** Proceed to card creation

**Stance sensitivity:** STANCE-INVARIANT (bad ideas are bad regardless of stance)

### Stage 5: Card Creation

For each promoted idea from Stage 4, create an Idea entity and Card via Agent API:

**1) Create Idea:**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/ideas
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "business": "<BIZ>",
  "content": "<Full Dossier with Dossier Header + Decision Log + Idea Content>",
  "tags": ["sweep-generated", "cabinet-v1"],
  "status": "raw"
}
```

**2) Create Card:**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/cards
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "business": "<BIZ>",
  "title": "<Idea Title>",
  "description": "<1-2 sentence summary>",
  "lane": "Inbox",
  "priority": "P3",  // default; Drucker/Porter will update this
  "owner": "Pete",
  "tags": ["sweep-generated", "cabinet-v1"]
}
```

**Do NOT create fact-find stage docs yet** — that's Stage 7 (after Drucker/Porter ranking)

**Stance sensitivity:** INVARIANT (card creation mechanics do not change by stance)

### Stage 6: Drucker/Porter Priority

Apply `prioritize-drucker-porter.md` persona to rank all created cards:

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
- Strategic-Fit: How this aligns with business plan targets
- Plan-Target: Which specific plan target this addresses
- Stance-Weight: How stance influenced the ranking
- Rationale: 2-3 sentences using effectiveness, positioning, or value chain reasoning

**Update Card Priority:** Use `PATCH /api/agent/cards/:id` to update card priority field based on Drucker/Porter verdict

### Stage 7: Fact-Find Seeding

Take top K cards (default K=3) from Drucker/Porter ranking and create fact-find stage docs:

**Selection criteria:**
- Top K cards by priority (P1 before P2 before P3, ties broken by Confidence-Score)
- K=3 (default, max 3 fact-find docs per sweep)

**For each selected card:**
```
POST ${BOS_AGENT_API_BASE_URL}/api/agent/stage-docs
Headers: X-Agent-API-Key: ${BOS_AGENT_API_KEY}, Content-Type: application/json
Body: {
  "cardId": "<card-id>",
  "stage": "fact-find",
  "content": "# Fact-Finding: <Card Title>\n\n**Source:** Sweep <YYYY-MM-DD>\n**Originator:** <Expert> (<Lens>)\n**Confidence:** <Score>/100\n**Priority:** <P1-P5>\n\n## Questions to Answer\n\n1. <Key question about feasibility>\n2. <Key question about approach>\n3. <Key question about measurement>\n\n## Evidence From Sweep\n\n- <evidence bullet 1>\n- <evidence bullet 2>\n\n## Decision Log (from Cabinet)\n\n<Include relevant Decision Log entries from Dossier>\n\n## Recommendations\n\n- First step: <concrete action>\n- Measurement: <what to track>\n\n## Transition Decision\n\n**Status:** Ready for fact-finding\n**Next Lane:** Fact-finding (when Pete reviews)"
}
```

**Cards NOT in top K:** Get cards but no fact-find docs (Pete can manually trigger `/fact-find` later if desired)

**Stance sensitivity:** INVARIANT (seeding happens based on Drucker/Porter ranking, which is stance-sensitive, but seeding mechanism itself is invariant)

---

## Technical Cabinet (Conditional)

**Triggers:**
- `--force-code-review` flag is set, OR
- `/scan-repo` detected diffs since last sweep, OR
- Stance is `improve-data` (infrastructure focus includes code quality)

**If triggered:**
1. Check if `.claude/skills/_shared/cabinet/lens-code-review.md` exists
2. If file doesn't exist: skip with note "Technical cabinet: file not found, skipping (CS-13 not yet complete)"
3. If file exists:
   - Read `lens-code-review.md`
   - Apply code-review lens to repo diffs (from `/scan-repo` or manual review)
   - Produce code-review ideas that enter the pipeline at Stage 2 (confidence gate)
   - Technical cabinet ideas use `Originator-Expert: code-review`, `Originator-Lens: engineering`

**If not triggered:**
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
Stance: improve-data | grow-business
Businesses-Audited: N
Sub-Experts-Run: N (of M)
Ideas-Generated: N
Presentable: N
Data-Gap: N
Hunches: N
Clusters-Formed: N
Filtered-Promote: N
Filtered-Hold: N
Filtered-Kill: N
Cards-Created: N
Fact-Find-Docs-Created: N
Technical-Cabinet: Yes | No | Skipped
Context-Discipline: Full | Summary-Block | Degraded
---
```

**Report sections:**
1. **Executive Summary:** Stance used, top constraint across all businesses, top 3 actions (Musk-ordered)
2. **Businesses Analyzed:** Per business: maturity level, MACRO scorecard, top ideas
3. **Generation Phase:** Per-expert contributions (person-level, e.g., "hopkins: 3 ideas for BRIK")
4. **Confidence Gate:** X presentable, Y data-gap (with VOI-Scores), Z hunches
5. **Clustering:** N clusters formed, M singletons, agreements recorded, rivalries flagged
6. **Munger/Buffett Filter:** A promoted, B held (converted to DGPs), C killed
7. **Cards Created:** Table of cards with priority assignments
8. **Drucker/Porter Priority:** Top K cards, P1-P5 distribution, plan alignment
9. **Fact-Find Seeding:** Top K cards seeded with stage docs
10. **Technical Cabinet:** Status (triggered/not triggered/skipped), ideas if applicable
11. **DGPs Created:** Table of data-gap proposals with VOI-Scores
12. **Context Discipline:** Full/Summary-Block/Degraded status, notes
13. **Duration:** Wall-clock time for sweep

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

### API Errors
- Fail-closed: stop sweep, surface error
- Do NOT create partial ideas or sweep report

### Context Budget Exceeded
- Switch to summary-block mode for remaining sub-experts
- Flag in sweep report with degradation point
- Proceed to next stages with ideas generated so far

---

## Evaluation Checklist (Pass/Fail)

After producing the sweep report, verify each item. If any FAIL, revise before finalizing.

- [ ] **Stance recorded:** Sweep report frontmatter includes stance used
- [ ] **Sub-experts run:** Report shows how many sub-experts completed (X of Y)
- [ ] **Confidence gate executed:** Presentable/data-gap/hunch counts recorded
- [ ] **Clustering executed:** Clusters formed, agreements/rivalries recorded
- [ ] **Munger/Buffett filter executed:** Promote/hold/kill verdicts recorded
- [ ] **Cards created:** Ideas persisted via API with tags `["sweep-generated", "cabinet-v1"]`
- [ ] **Drucker/Porter priority assigned:** P1-P5 distribution recorded
- [ ] **Fact-find seeding:** Top K cards have stage docs created
- [ ] **Context discipline:** Degradation status noted if applicable
- [ ] **Technical cabinet:** Status recorded (triggered/not triggered/skipped)
- [ ] **DGPs created:** Data-gap ideas persisted with VOI-Scores and tags `["data-gap", "sweep-generated"]`

---

## Red Flags (Hard Guardrails)

If any of these are true, the sweep report is **invalid** and must be revised:

1. **Skipped confidence gate.** All ideas must pass through presentable/data-gap/hunch classification.
2. **Skipped clustering.** Must attempt to group semantically similar ideas.
3. **Skipped Munger/Buffett filter.** All presentable ideas must receive Kill/Hold/Promote verdict.
4. **Created cards without Drucker/Porter priority.** All cards must have P1-P5 ranking.
5. **Created fact-find docs for low-priority cards.** Only top K (default K=3) get fact-find docs.
6. **Persisted hunches.** Confidence-Score 0-29 ideas must NOT be persisted (log in report only).
7. **Ignored stance.** Generation and prioritization must reflect stance (improve-data vs grow-business).
8. **Invents metrics not present in the data.** All evidence must be observable.
9. **Produces >10 presentable ideas per business without clustering.** Must cluster to reduce duplicates.
10. **Musk lens violates 5-step ordering.** Musk recommendations must follow strict step order (Question → Delete → Simplify → Accelerate → Automate).

---

## Error Handling

| Error | Action |
|---|---|
| API returns non-200 | STOP. Surface error with URL and status code. Do not write partial report. |
| Business plan file not found | Flag as critical finding. Fall back to maturity model. Continue sweep. |
| Persona file not found | Skip that sub-expert. Note in report. Continue sweep. |
| Context budget exceeded | Switch to summary-block mode. Flag in report. Continue sweep. |
| Idea creation fails | Log the failure. Continue with remaining ideas. Note in report. |
| Card creation fails | Log the failure. Continue with remaining cards. Note in report. |
| Stage doc creation fails | Log the failure. Continue with remaining docs. Note in report. |
| Rate limit hit (429) | STOP. Surface error. Wait 60 seconds and retry. |
| `BOS_AGENT_API_BASE_URL` not set | STOP. Inform user to set environment variable. |

---

## Integration with Other Skills

| Sweep Output | Next Skill | When |
|---|---|---|
| Missing business plan | `/update-business-plan` | Bootstrap or update the plan |
| Missing people profiles | `/update-people` | Bootstrap profiles with current-state data |
| Top-priority card with fact-find doc | `/fact-find <card-id>` | Deep-dive investigation |
| Card without fact-find doc | `/fact-find <card-id>` | Manual fact-find if desired |
| Card ready for planning | `/plan-feature <slug>` | After fact-find completes |
| DGP created | Next sweep with `improve-data` stance | DGP pickup for investigation |
| Held idea (Munger/Buffett) | Next sweep | Re-evaluate when new evidence available |
| Technical cabinet skipped | CS-13 completion | Waiting for code-review lens persona |

---

## Completion Messages

**Standard:**
> "Cabinet sweep complete. Report: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Stance: `{stance}`. {N} sub-experts run. {X} presentable ideas, {Y} data-gaps, {Z} hunches. {N} cards created (P1: A, P2: B, P3: C). {K} fact-find docs seeded. Technical cabinet: {status}."

**First sweep (no plans):**
> "First Cabinet sweep complete. Report: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. CRITICAL: No business plans exist. Drucker/Porter operating in degraded mode with maturity model fallback. Recommendation: Bootstrap plans via `/update-business-plan`."

**Context degradation:**
> "Cabinet sweep complete with context degradation. Report: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Context limit reached after {N} of {M} sub-experts. Switched to summary-block mode. {X} presentable ideas generated. {N} cards created."

---

## Phase 0 Constraints

- **Pete-triggered only.** No automated scheduling or self-invocation.
- **Agent identity.** All API calls use the agent API key. Ideas tagged `["sweep-generated", "cabinet-v1"]`. DGPs tagged `["data-gap", "sweep-generated"]`. Cards tagged `["sweep-generated", "cabinet-v1"]`.
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
- Context discipline prevents token exhaustion
- Stance is respected in generation and prioritization stages
- Pete finds the report useful for strategic prioritization (subjective)

---

## Version History

- **v2.1** (2026-02-09): Added BRIK-specific lens routing — Brikette lens (15 sub-experts across 6 hostel domains) replaces sourcing lens for BRIK. Hopkins/Ogilvy run twice for BRIK (marketing + brikette framing).
- **v2.0** (2026-02-09): Cabinet Secretary orchestrator with 7-stage pipeline, multi-lens composite generation, confidence gating, clustering, Munger/Buffett filter, Drucker/Porter priority, fact-find seeding. Replaces v1 constraint-diagnostic approach.
- **v1.0** (2026-02-06): Original constraint-diagnostic sweep (preserved in `SKILL.md.pre-cabinet`)
