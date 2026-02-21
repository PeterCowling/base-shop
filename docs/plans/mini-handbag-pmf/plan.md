---
Type: Plan
Status: Draft
Domain: Business
Workstream: Product
Created: 2026-02-17
Last-updated: 2026-02-18 (TASK-04 complete — CE marking investigation filed; H5 proceed under GPSR + REACH non-toy path)
Last-reviewed: 2026-02-18
Feature-Slug: mini-handbag-pmf
Relates-to charter: docs/business-os/business-os-charter.md
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: startup-demand-test-protocol
Execution-Track: business-artifact
Primary-Execution-Skill: biz-product-brief
Supporting-Skills: lp-offer, lp-channels, lp-forecast, biz-update-plan, meta-reflect
Overall-confidence: 74%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: HBAG
Card-ID: HBAG-004
---

# Mini Handbag PMF Plan

## Summary

Five mini handbag product variants have been scored and ranked for product-market fit.
This plan executes a demand-first validation sequence: secure Pete's brand positioning
decision first, investigate supply chain and product readiness in parallel, shoot
contextual photography, then run a 2-channel demand probe (Etsy + Instagram/TikTok)
before committing to any channel, app, or wholesale infrastructure. A 4-week checkpoint
gates all downstream work. This plan also serves as a live trial for building physical-
product PMF methodology into the startup loop — a meta-reflect task closes that loop.

Variant priority from fact-find scoring:
1. **H1 — Bag charm / handbag accessory** (score 9/10)
2. **H2 — AirPod / small items holder** (score 8/10, already started)
3. **H3 — Amalfi location product** (score 8/10, in-season channel)
4. **H4 — Dog poop bag holder** (score 6/10, deferred to post-checkpoint)
5. **H5 — First bag / children's** (score 5/10, CE check required, deferred)

## Goals

- Get a brand positioning decision from Pete (gates all downstream creative work).
- Confirm supply chain cost and AirPod holder product readiness before photography.
- Shoot in-context photography for H1, H2, H3 variants.
- Run a 4-week demand probe: Etsy listing (H1+H2) + Instagram/TikTok (H1).
- Run in-destination trial at Brikette and 1 Positano boutique during tourist season.
- Capture startup loop PMF methodology gaps via `/meta-reflect`.

## Non-goals

- Building the cover-me-pretty app or any code infrastructure.
- Wholesale outreach or B2B distribution setup (pre-checkpoint).
- Location branding design work (pre-checkpoint).
- H4 (dog holder) or H5 (first bag) execution (deferred to post-checkpoint).
- Setting final prices before supply chain cost is confirmed (TASK-02).

## Constraints & Assumptions

- Constraints:
  - HBAG has zero revenue; no fulfillment path validated.
  - Tourist season window (in-destination trial): June–September.
  - Single operator (Pete); max 1–2 active channel experiments simultaneously.
  - No app, no wholesale channel, no brand identity beyond Draft dossier.
  - H5 requires CE marking research before any marketing to children's market.
- Assumptions:
  - Product quality reads as premium in photography (unverified — perception test
    is built into TASK-06 acceptance).
  - The same physical product body works across H1, H2, H3 variants with only
    hardware and marketing differing.
  - Etsy and Instagram/TikTok are viable first-day channels requiring no
    infrastructure build.
  - BOS API key available via `source /Users/petercowling/base-shop/.env.local`
    for all BOS sync operations.

## Fact-Find Reference

- Related brief: `docs/plans/mini-handbag-pmf/fact-find.md`
- Key findings used:
  - Bag charm trend: 12x JOOR wholesale sales growth H1 2025, +700% Pinterest — top signal.
  - AirPod holder: white space at €80–€900 artisan tier; Hermes/Chanel prove the buyer exists.
  - Amalfi: 2.3M annual visitors 2024, fashion/accessories = 12.2% of Italy tourist spend.
  - Leather sandal price anchor (€100–€250 in Positano) validates premium artisan willingness-to-pay.
  - Delivery-Readiness: 30% (no outcome contract, no brand, no supply data).
  - 5 open questions require Pete input before execution can begin.

## Proposed Approach

- Option A: Run all 5 variant demand tests simultaneously across all channels.
  - Risk: overwhelms a single operator; signal is diluted and uninterpretable.
- Option B: Decision-first, then sequential probe (H1 → H2 → H3, checkpoint gates rest).
  - Validates top variants with clean signal before committing to infrastructure.
- **Chosen: Option B.** Decision and investigation tasks run first in parallel (Wave 1),
  then photography (Wave 2), then 2-channel demand probe (Wave 3), then checkpoint
  before in-destination trial and deferred variants.

## Plan Gates

- Foundation Gate: **Pass**
  - Deliverable-Type: `multi-deliverable` ✓
  - Execution-Track: `business-artifact` ✓
  - Primary-Execution-Skill: `biz-product-brief` ✓
  - Startup-Deliverable-Alias: `startup-demand-test-protocol` ✓
  - Delivery-Readiness score present in fact-find (30%) ✓
  - Channel landscape documented ✓
  - Hypothesis/validation landscape documented ✓
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **No**
  - Reason: plan-only mode; no IMPLEMENT task at >=80 has all dependencies satisfied
    at plan start. TASK-11 (meta-reflect, 88%) is IMPLEMENT at >=80 but depends on
    TASK-09 (CHECKPOINT). Run TASK-01 through TASK-09 first.

---

## Active tasks
See `## Tasks` section for the active task list.

## Task Summary

| Task ID  | Type        | Description                                        | Confidence | Effort | Status  | Depends on           | Blocks               |
|----------|-------------|----------------------------------------------------|-----------|--------|---------|----------------------|----------------------|
| TASK-01  | DECISION    | Brand positioning: luxury vs premium vs accessible | 90%       | S      | Complete (2026-02-17) | —               | TASK-05, TASK-06     |
| TASK-02  | INVESTIGATE | Supply chain: unit cost, MOQ, margin stack         | 72%       | S      | Pending | —                    | TASK-08              |
| TASK-03  | INVESTIGATE | AirPod holder product readiness (size + hardware)  | 82%       | S      | Complete (2026-02-17) | —               | TASK-06              |
| TASK-04  | INVESTIGATE | CE marking requirements for H5 (first bag)         | 72%       | S      | Complete (2026-02-18) | —               | —                    |
| TASK-05  | IMPLEMENT   | Write HBAG outcome contract                        | 70%       | S      | Complete (2026-02-17) | TASK-01        | —                    |
| TASK-06  | IMPLEMENT   | Product photography session (H1, H2, H3 variants)  | 65%       | M      | Pending | TASK-01, TASK-03     | TASK-07, TASK-08     |
| TASK-07  | IMPLEMENT   | Instagram/TikTok demand probe — H1 bag charm       | 70%       | S      | Pending | TASK-06              | TASK-09              |
| TASK-08  | IMPLEMENT   | Open Etsy shop — H1 bag charm + H2 AirPod holder   | 75%       | M      | Pending | TASK-02, TASK-06     | TASK-09              |
| TASK-09  | CHECKPOINT  | 4-week demand signal gate; reassess downstream     | 95%       | S      | Pending | TASK-07, TASK-08     | TASK-10, TASK-11     |
| TASK-10  | IMPLEMENT   | In-destination trial: Brikette + 1 Positano shop   | 60%       | M      | Pending | TASK-09              | —                    |
| TASK-11  | IMPLEMENT   | `/meta-reflect` — startup loop PMF methodology gaps | 88%      | S      | Pending | TASK-09              | —                    |

---

## Parallelism Guide

| Wave | Tasks                        | Prerequisites            | Notes                                           |
|------|------------------------------|--------------------------|-------------------------------------------------|
| 1    | TASK-01, TASK-02, TASK-03, TASK-04 | —               | All independent; run in parallel immediately    |
| 2    | TASK-05, TASK-06             | TASK-01; TASK-03 for 06  | TASK-05 unblocked on TASK-01; TASK-06 needs both |
| 3    | TASK-07, TASK-08             | TASK-06; TASK-02 for 08  | Both can launch once TASK-06 photos are ready   |
| 4    | TASK-09                      | TASK-07 + TASK-08 (4 wks) | Checkpoint — run `/lp-do-replan` before Wave 5    |
| 5    | TASK-10, TASK-11             | TASK-09                  | Parallel after checkpoint clearance             |

---

## Tasks

---

### TASK-01: Brand positioning decision — luxury vs premium vs accessible

- **Type:** DECISION
- **Deliverable:** Decision recorded in `docs/plans/mini-handbag-pmf/plan.md` Decision Log + brand dossier updated
- **Execution-Skill:** biz-update-plan
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Decision:** Option B — Premium (€80–€150). Confirmed by Pete 2026-02-17.
- **Affects:** `docs/business-os/strategy/HBAG/brand-identity.user.md`, `docs/plans/mini-handbag-pmf/plan.md`
- **Depends on:** —
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 90%
  - Implementation: 90% — decision task; process is clear.
  - Approach: 90% — three options are well-defined with trade-offs documented.
  - Impact: 90% — this single decision gates photography styling, pricing, and channel targeting.
- **Options:**
  - Option A — Luxury (€200+): positions alongside Miu Miu/Coach bag charm tier;
    requires flawless photography, lean into Birkin-style reference; target premium
    handbag owners; smallest segment but highest margin.
  - Option B — Premium (€80–€150): broadest viable segment; competes with KILLSPENCER
    ($55 artisan leather) and Coach charm ($95); Etsy-friendly price point; best for
    early demand validation.
  - Option C — Accessible (€40–€80): highest volume potential; competes directly with
    Etsy mid-market; lowest margin; harder to differentiate on quality story.
- **Recommendation:** Option B (premium, €80–€150). Reasons: (1) widest testable
  segment for demand probe; (2) €120 Etsy price has comparable sold inventory at scale;
  (3) can step up to Option A after 50 sales if quality perception supports it;
  (4) Option C undervalues the Birkin-style product quality signal.
- **Decision input needed:**
  - question: Which positioning — luxury (€200+), premium (€80–€150), or accessible (€40–€80)?
  - why it matters: Sets retail price, photography style, copy voice, and channel selection.
  - default + risk: Defaulting to Option B (premium). Risk: may under-price if product
    quality genuinely reads as luxury on first customer contact.
- **Acceptance:**
  - [ ] Pete confirms positioning tier in writing (chat, note, or Decision Log entry).
  - [ ] Decision recorded in plan Decision Log with date.
  - [ ] Brand dossier personality direction updated from TBD to match chosen tier.
- **Validation contract:**
  - VC-01: Decision recorded → pass when Decision Log entry exists with date and chosen
    option within 3 days of TASK-01 start; else escalate to Pete.
- **Planning validation:** None: decision task, no pre-execution checks needed.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** Decision Log in this plan; HBAG brand dossier personality section.
- **What would make this >=90%:** Already >=90%; only Pete input required.

---

### TASK-02: Investigate supply chain — unit cost, MOQ, China→EU shipping, margin stack

- **Type:** INVESTIGATE
- **Deliverable:** Margin stack summary filed as `docs/plans/mini-handbag-pmf/supply-chain-investigation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/mini-handbag-pmf/supply-chain-investigation.md` (new)
- **Depends on:** —
- **Blocks:** TASK-08 (need price floor before setting Etsy price)
- **Confidence:** 72%
  - Implementation: 72% — requires Pete to get supplier quote; agent cannot do this directly.
  - Approach: 80% — margin stack formula is clear (unit cost + packaging + shipping + customs + Etsy 6.5% fee).
  - Impact: 78% — directly gates retail pricing decision for Etsy launch.
- **Questions to answer:**
  - What is the unit cost (€) per bag from the supplier?
  - What is the minimum order quantity?
  - What is the China→EU shipping cost per unit at MOQ?
  - What are the applicable customs/import duties (China→Italy)?
  - What is the estimated contribution margin at the Option B price (€80–€150)?
  - What is the breakeven unit volume at target retail price?
- **Acceptance:**
  - [ ] Unit cost confirmed (€ per unit).
  - [ ] MOQ confirmed.
  - [ ] Shipping cost per unit estimated (±20%).
  - [ ] Contribution margin calculated at €120 retail: must be ≥35% after all costs.
  - [ ] If margin <35% at €120, flag to Pete and recommend repricing before TASK-08.
- **Validation contract:**
  - VC-01: Margin adequacy → pass when contribution margin ≥35% at chosen retail price
    within 5 days of TASK-02 start over 1 supplier quote; else Pete decides: reprice
    or pause Etsy launch.
- **Planning validation:** None: investigation task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** New file `docs/plans/mini-handbag-pmf/supply-chain-investigation.md`.
- **What would make this >=80%:** Supplier quote in hand. Currently blocked on Pete
  contacting supplier.

---

### TASK-03: Investigate AirPod holder product readiness

- **Type:** INVESTIGATE
- **Deliverable:** Readiness note appended to `docs/plans/mini-handbag-pmf/fact-find.md`
  under a new `## Product Readiness Notes` section.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Result:** AirPod holder fits. Confirmed by Pete 2026-02-17. TASK-06 fully unblocked.
- **Affects:** `[readonly] docs/plans/mini-handbag-pmf/fact-find.md`
- **Depends on:** —
- **Blocks:** TASK-06 (photography can't proceed for H2 if product isn't ready)
- **Confidence:** 82%
  - Implementation: 85% — physical test by Pete; method is clear.
  - Approach: 90% — test criteria are binary (fits / doesn't fit).
  - Impact: 82% — determines whether H2 can be photographed and listed alongside H1.
- **Questions to answer:**
  - Does the current AirPod holder prototype fit AirPods Pro (2nd gen) case?
  - Does it fit AirPods 4 case?
  - Does the attachment hardware (clip/ring) work reliably on a bag strap?
  - Is the interior zipper or closure functional?
  - Are there any obvious quality issues (loose hardware, stitching gaps)?
- **Acceptance:**
  - [ ] Pass/fail answer for AirPods Pro fit (yes/no + photo evidence).
  - [ ] Pass/fail answer for AirPods 4 fit (yes/no).
  - [ ] Attachment hardware confirmed functional.
  - [ ] If not ready: scope of product development work estimated.
- **Validation contract:**
  - VC-01: AirPod fit confirmed → pass when Pete confirms fit for at least one current
    AirPods model within 2 days; else H2 is flagged for product rework before TASK-06.
- **Planning validation:** None: physical product test.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** Readiness note appended to fact-find.
- **What would make this >=90%:** Already high; only blocked on Pete running the physical test.

---

### TASK-04: Investigate CE marking requirements for H5 (first bag / children's product)

- **Type:** INVESTIGATE
- **Deliverable:** CE compliance summary at `docs/plans/mini-handbag-pmf/ce-marking-investigation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `docs/plans/mini-handbag-pmf/ce-marking-investigation.md` (new)
- **Depends on:** —
- **Blocks:** — (H5 is fully deferred; this task is informational only for now)
- **Confidence:** 72%
  - Implementation: 78% — research task; regulatory information is publicly available.
  - Approach: 80% — question scope is clear.
  - Impact: 72% — H5 is deferred; this just determines whether it's ever feasible.
- **Questions to answer:**
  - Does CE marking apply to a small leather/faux-leather bag marketed to children 6–10?
  - Which EU toy safety directive (2009/48/EC) clauses are relevant (if any)?
  - What testing/certification is required and at what cost?
  - Is there a simpler path (age recommendation labelling instead of toy standard)?
- **Acceptance:**
  - [x] CE/toy safety applicability confirmed: **No CE marking required** — TSD Annex I fashion-accessories exclusion applies. (Directive 2009/48/EC Annex I, item 10)
  - [x] Compliance cost estimated: EUR 1,000–3,000 (REACH RSL testing + GPSR documentation + EU AR if non-EU manufacturer).
  - [x] Recommendation: **Proceed with H5** under GPSR (EU) 2023/988 + REACH (EC) 1907/2006 non-toy compliance path with design and marketing guardrails.
- **Validation contract:**
  - VC-01: **PASS** — CE applicability determined (No; TSD Annex I exclusion) with citations to Directive 2009/48/EC, GPSR (EU) 2023/988, REACH (EC) 1907/2006 Annex XVII Entries 43 and 51. Within-7-days criterion met.
- **Planning validation:** None: regulatory research task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** New file `docs/plans/mini-handbag-pmf/ce-marking-investigation.md`.
- **What would make this >=80%:** Official EU toy safety directive citation confirming or excluding applicability. ✓ Achieved — TSD Annex I, item 10 cited explicitly.

#### Build Completion Evidence (2026-02-18)
- **Artifact filed:** `docs/plans/mini-handbag-pmf/ce-marking-investigation.md`
- **Key finding:** CE marking NOT required for a children's mini handbag marketed as a fashion accessory. TSD Directive 2009/48/EC Annex I, item 10 (fashion accessories for children not for use in play) provides the exclusion.
- **Compliance path:** GPSR (EU) 2023/988 (self-assessed, no notified body) + REACH (EC) 1907/2006 Annex XVII (particularly phthalates Entry 51 for PVC faux leather). EU Authorised Representative required if manufacturer is non-EU.
- **Total compliance cost estimate:** EUR 1,000–3,000.
- **Guardrails required:** No play-function design features; fashion/lifestyle marketing only; REACH RSL testing on all material substrates before launch; GPSR technical documentation retained 10 years.
- **Recommendation:** Proceed with H5 under non-toy path. Abandon threshold: toy-like design or unresolvable REACH failure (neither expected for plain faux-leather bag).

---

### TASK-05: Write HBAG outcome contract

- **Type:** IMPLEMENT
- **Deliverable:** Completed outcome contract block added to
  `docs/business-os/strategy/HBAG/plan.user.md` under a new `## Outcome Contracts` section.
- **Execution-Skill:** biz-update-plan
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/strategy/HBAG/plan.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews plan.user.md after write; confirms via chat.
- **Measurement-Readiness:** Weekly demand tracker (Etsy + Instagram DMs) — owner Pete,
  cadence weekly, tracked in a simple running note or spreadsheet.
- **Affects:** `docs/business-os/strategy/HBAG/plan.user.md`
- **Depends on:** TASK-01 (need positioning to set meaningful revenue targets)
- **Blocks:** —
- **Confidence:** 70%
  - Implementation: 70% — business writing task; but fact-find implementation cap
    (45%+10=55% hard floor) is overridden here because supply chain unknowns don't
    apply to contract authorship. New evidence: user confirmed product exists and is
    high quality. Applying 70%.
  - Approach: 82% — outcome contract schema is defined in `ideas-readiness-pipe-outcome-contract-fact-find.md`.
  - Impact: 82% — required before `/idea-generate` or `/idea-readiness` can run for HBAG.
- **Acceptance:**
  - [ ] `Outcome-ID` in format `HBAG-OUT-2026Q1-01`.
  - [ ] `Baseline`: HBAG revenue = €0, date 2026-02-17.
  - [ ] `Target`: first 10 paid sales (any variant); or first €500 revenue — whichever
    comes first.
  - [ ] `By`: 2026-05-17 (90 days from plan creation).
  - [ ] `Owner`: Pete.
  - [ ] `Leading-Indicator-1`: weekly Etsy views and add-to-cart count.
  - [ ] `Leading-Indicator-2`: weekly Instagram/TikTok DM purchase inquiries.
  - [ ] `Decision-Link`: `DEC-HBAG-01` — if 0 sales by 2026-04-17 (60 days), reassess
    pricing and variant selection before continuing.
  - [ ] `Stop/Pivot Threshold`: if 0 sales across all active channels after 60 days,
    halt channel spend, run `/lp-do-replan`, and reassess positioning.
- **Validation contract (VC-01):**
  - VC-01: Contract completeness → pass when all 9 required fields are non-empty and
    `DEC-HBAG-01` references a concrete decision rule; within 1 day of TASK-01
    completion; over 1 document review by Pete.
- **Execution plan:**
  - Red evidence plan: file doesn't exist yet — absence confirmed.
  - Green evidence plan: write contract block, verify all 9 fields present and non-empty.
  - Refactor evidence plan: Pete reviews and confirms contract is decision-useful.
- **Planning validation:** None: short writing task, no pre-execution checks needed.
- **Scouts:** None: schema is predefined.
- **Edge Cases & Hardening:** If Pete changes the target threshold after reviewing,
  update `DEC-HBAG-01` rule accordingly before closing TASK-05.
- **What would make this >=90%:** Pete's reviewed and confirmed contract (currently
  Approval-Evidence is pending).
- **Rollout / rollback:**
  - Rollout: write to `plan.user.md`; sync to BOS via `biz-update-plan`.
  - Rollback: revert the added section; no downstream breakage.
- **Documentation impact:** `docs/business-os/strategy/HBAG/plan.user.md` gains
  `## Outcome Contracts` section.

---

### TASK-06: Product photography session — H1 (bag charm), H2 (AirPod holder), H3 (Amalfi)

- **Type:** IMPLEMENT
- **Deliverable:** ≥3 in-context photos per variant (9 photos minimum), saved to
  `docs/plans/mini-handbag-pmf/photography/` or equivalent local media path.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** Photos for use in Etsy listings (TASK-08) and
  Instagram/TikTok (TASK-07).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete selects final shots before TASK-07/08 proceed.
- **Measurement-Readiness:** Photo-to-listing conversion tracked via Etsy analytics
  (views/click-through on lead photo).
- **Affects:** `docs/plans/mini-handbag-pmf/photography/` (new directory)
- **Depends on:** TASK-01 (positioning sets styling direction), TASK-03 (AirPod holder
  must be confirmed ready before H2 shoot)
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 65%
  - Implementation: 65% — photography quality is unknown until done; product quality
    reading as premium in photos is unverified. This is the biggest risk in the plan.
  - Approach: 75% — shot types are defined (on-handbag strap, AirPods inside, styled
    on surface). Standard artisan product photography approach.
  - Impact: 82% — photos are the gating asset for both demand test channels.
- **Acceptance:**
  - [ ] H1 (bag charm): ≥3 shots — (a) bag on a real full-size handbag strap, (b) bag
    styled flat on textured surface, (c) close-up of hardware detail.
  - [ ] H2 (AirPod holder): ≥3 shots — (a) AirPods Pro case inside open bag, (b) bag
    clipped to bag strap, (c) size reference shot (bag next to AirPods case).
  - [ ] H3 (Amalfi): ≥3 shots — (a) bag against Amalfi Coast background or map prop,
    (b) bag with local ceramic/lemon prop, (c) styled shot.
  - [ ] Perception test: show unbranded lead photo to 5 people cold; at least 3/5 must
    spontaneously estimate value ≥€80 without prompting.
  - [ ] Photos are in focus, well-lit, and usable for Etsy (2000×2000px minimum).
- **Validation contract:**
  - VC-01: Photo quality perception → pass when ≥3 out of 5 cold reviewers estimate
    value ≥€80 for lead photo within 3 days of shoot; else reshoot or reassess
    positioning before proceeding.
  - VC-02: Coverage completeness → pass when ≥9 total photos (3 per variant) are
    available and approved by Pete within 5 days of TASK-01 + TASK-03 completion.
- **Execution plan:**
  - Red evidence plan: confirm 0 usable photos exist currently (starting from zero).
  - Green evidence plan: shoot all 3 variants; run perception test on H1 lead shot.
  - Refactor evidence plan: Pete selects final shots; discard weak takes.
- **Planning validation:** None: physical task.
- **Scouts:** If perception test fails (fewer than 3/5 estimate ≥€80), do not proceed
  to Etsy/social — reshoot with different lighting, background, or styling first.
- **Edge Cases & Hardening:** If H2 AirPod holder fails TASK-03 check, H2 photography
  is deferred; proceed with H1 and H3 photos only.
- **What would make this >=80%:** Perception test passes (≥3/5 estimate ≥€80).
  Currently at 65% because this is unverified.
- **Rollout / rollback:**
  - Rollout: Photos uploaded to Etsy/social as needed for TASK-07/08.
  - Rollback: Do not publish photos; revert to reshoot.
- **Documentation impact:** None beyond the photography directory.

---

### TASK-07: Instagram/TikTok demand probe — H1 bag charm

- **Type:** IMPLEMENT
- **Deliverable:** 2-week social demand probe: ≥3 posts across Instagram + TikTok
  using H1 context photos; "DM to buy / link in bio" CTA; inquiry log maintained.
- **Execution-Skill:** draft-marketing
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** startup-demand-test-protocol
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Instagram account + TikTok account (existing or new for HBAG).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews post drafts before publishing.
- **Measurement-Readiness:** DM inquiries logged in a running note file
  `docs/plans/mini-handbag-pmf/demand-log.md`; updated within 24h of each inquiry.
- **Affects:** `docs/plans/mini-handbag-pmf/demand-log.md` (new)
- **Depends on:** TASK-06 (photos required)
- **Blocks:** TASK-09 (checkpoint needs demand signal data)
- **Confidence:** 70%
  - Implementation: 72% — posting to social is known; account setup for HBAG may
    be needed (not yet confirmed whether an account exists).
  - Approach: 75% — "DM to buy" is the standard artisan demand probe; bag charm
    trend makes H1 the right first variant.
  - Impact: 70% — DM inquiry rate is uncertain; organic reach without ad spend is
    variable.
- **Acceptance:**
  - [ ] ≥3 posts published across Instagram + TikTok within 7 days of TASK-06.
  - [ ] Each post uses H1 (bag charm on real handbag) lead photo.
  - [ ] Each post includes "DM to buy" or "link in bio" CTA.
  - [ ] All inquiries logged in `demand-log.md` within 24h.
  - [ ] 2-week probe period runs to completion before TASK-09.
- **Validation contract:**
  - VC-01: Social demand signal → pass when ≥5 genuine purchase inquiries (DMs asking
    about price/purchase, not just "where did you get this?") received within 14 days
    of first post; else flag at checkpoint as "weak social signal" and adjust channel
    priority.
  - VC-02: Inquiry-to-intent rate → pass when ≥2 of the ≥5 inquirers confirm intent
    to purchase when given price; else pricing or positioning may need adjustment.
- **Execution plan:**
  - Red evidence plan: demand-log.md doesn't exist; 0 inquiries on record.
  - Green evidence plan: post ≥3 times; log all DMs; track inquiry count and intent rate.
  - Refactor evidence plan: if VC-01 fails, analyse which posts drove most engagement
    and refine hook/caption before TASK-09 checkpoint.
- **Planning validation:** None: social posting task.
- **Scouts:** If account doesn't exist for HBAG, create before posting. Do not use
  Brikette hostel account — keep brands separate.
- **Edge Cases & Hardening:** If Instagram/TikTok organic reach is <500 impressions
  per post, note this at checkpoint — ad spend or hashtag strategy may be needed
  before concluding demand is absent.
- **What would make this >=80%:** Social account exists with ≥500 followers OR Pete
  has existing audience to cross-promote. Currently low because account status unknown.
- **Rollout / rollback:**
  - Rollout: Posts published; log inquiries.
  - Rollback: Delete posts; no financial commitment.
- **Documentation impact:** `docs/plans/mini-handbag-pmf/demand-log.md` created.

---

### TASK-08: Open Etsy shop — H1 (bag charm) + H2 (AirPod holder)

- **Type:** IMPLEMENT
- **Deliverable:** Etsy shop open with ≥2 active listings (H1 bag charm, H2 AirPod holder)
  at validated prices; shop branding and policies complete.
- **Execution-Skill:** biz-product-brief
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** startup-demand-test-protocol
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** Etsy shop (new or existing — confirm with Pete).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews listings before activating.
- **Measurement-Readiness:** Etsy Shop Manager analytics (views, favourites,
  add-to-cart, orders); reviewed weekly; logged in `demand-log.md`.
- **Affects:** `docs/plans/mini-handbag-pmf/demand-log.md`
- **Depends on:** TASK-02 (need margin data for price floor), TASK-06 (need photos)
- **Blocks:** TASK-09 (checkpoint needs 4 weeks of Etsy signal)
- **Confidence:** 75%
  - Implementation: 78% — Etsy shop creation is straightforward; process is well-documented.
  - Approach: 80% — Etsy is a proven channel for artisan mini bags ($15–$80 comparable
    sold inventory confirmed in fact-find research).
  - Impact: 75% — conversion is uncertain at premium pricing (€120+); comparable Etsy
    artisan sales are lower (€15–€60), so premium pricing is a real risk.
- **Acceptance:**
  - [ ] Etsy shop created with name, banner, and 5-item shop policy (shipping,
    returns, processing time).
  - [ ] H1 listing (bag charm): ≥5 photos, title includes "bag charm", price set
    at TASK-01 positioning tier, ≥150-word description.
  - [ ] H2 listing (AirPod holder): ≥5 photos, title includes AirPods model compatibility,
    price set at TASK-01 positioning tier, compatibility clearly stated.
  - [ ] Shipping: Italy-origin shipping rates set for EU and international.
  - [ ] Both listings active and discoverable (not draft).
- **Validation contract:**
  - VC-01: Etsy conversion signal → pass when ≥3 sales (any variant) within 28 days
    of listings going live; else flag at checkpoint as "Etsy signal weak" and
    run `/lp-do-replan` on TASK-10 pricing/channel strategy.
  - VC-02: Etsy engagement signal → pass when ≥50 unique listing views + ≥5 favourites
    per listing within 14 days; else consider Etsy Ads (small budget €15–30) before
    concluding demand is absent.
- **Execution plan:**
  - Red evidence plan: confirm no active Etsy shop exists for HBAG.
  - Green evidence plan: create shop; publish 2 listings; activate; verify Etsy
    search indexing within 48h.
  - Refactor evidence plan: adjust titles/tags based on Etsy search ranking after
    1 week if views <20 per listing.
- **Planning validation:** None: e-commerce setup task.
- **Scouts:** Etsy 6.5% transaction fee + €0.20 listing fee confirmed in margin stack
  (TASK-02). Etsy payment processing: ~3% additional. Total Etsy take-rate ~9.5%.
- **Edge Cases & Hardening:** If Etsy price point (€120+) has no comparable sold
  listings in category, add a "lower anchor" variant (a smaller/simpler version at
  €65) to test price sensitivity without undercutting the hero product.
- **What would make this >=80%:** TASK-02 confirming ≥35% margin at target price, and
  TASK-06 delivering strong perception-test-passing photos.
- **Rollout / rollback:**
  - Rollout: Activate listings; monitor weekly.
  - Rollback: Deactivate listings; no inventory commitment if dropship model used.
- **Documentation impact:** `demand-log.md` updated weekly with Etsy stats.

---

### TASK-09: CHECKPOINT — 4-week demand signal gate; reassess downstream plan

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`; downstream tasks re-scored
  from actual demand data.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/mini-handbag-pmf/plan.md`
- **Depends on:** TASK-07 (2-week social probe complete), TASK-08 (4-week Etsy active)
- **Blocks:** TASK-10, TASK-11
- **Confidence:** 95%
  - Implementation: 95% — process defined; invoke `/lp-do-replan`.
  - Approach: 95% — prevents deep dead-end execution.
  - Impact: 95% — controls all downstream risk; TASK-10 and TASK-11 confidence
    cannot be meaningfully set without this data.
- **Acceptance:**
  - [ ] Demand signal data collated from `demand-log.md`: Etsy views/favs/sales,
    Instagram DM inquiries, intent confirmations.
  - [ ] VC pass/fail status recorded for TASK-07 (VC-01, VC-02) and TASK-08 (VC-01, VC-02).
  - [ ] `/lp-do-replan` invoked on TASK-10 and TASK-11.
  - [ ] TASK-10 (in-destination trial) re-scored with updated confidence based on
    Etsy/social signal strength.
  - [ ] Decision for H4 (dog holder) and H5 (first bag): proceed, defer, or drop —
    recorded in Decision Log.
- **Horizon assumptions to validate:**
  - H1 (bag charm) has the strongest demand signal of the two channels.
  - Premium pricing (€80–€150) is accepted by buyers — not rejected.
  - Product quality reads as premium in photos (perception test from TASK-06 holds
    in actual market context).
  - In-destination trial (TASK-10) is viable given season timing.
- **Validation contract:** Checkpoint complete when all four acceptance criteria are
  met and `/lp-do-replan` output is filed in `docs/plans/mini-handbag-pmf/plan.md`.
- **Planning validation:** None: planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated via `/lp-do-replan`; Decision Log updated.

---

### TASK-10: In-destination trial — Brikette reception + 1 Positano boutique

- **Type:** IMPLEMENT
- **Deliverable:** In-destination sales active at Brikette reception; consignment
  agreement with 1 local Positano boutique; sales log in `demand-log.md`.
- **Execution-Skill:** draft-outreach
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** startup-demand-test-protocol
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** Physical in-destination sales + consignment arrangement.
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms boutique agreement.
- **Measurement-Readiness:** In-destination sales logged in `demand-log.md`; weekly
  count; split by channel (hostel vs boutique).
- **Affects:** `docs/plans/mini-handbag-pmf/demand-log.md`
- **Depends on:** TASK-09 (CHECKPOINT — confidence re-scored from real demand data)
- **Blocks:** —
- **Confidence:** 60%
  - Implementation: 60% — depends on tourist season timing and boutique receptivity;
    cannot be confirmed pre-checkpoint.
  - Approach: 68% — leather sandal precedent in Positano validates the channel; but
    boutique outreach approach needs `/lp-do-replan` evidence from checkpoint.
  - Impact: 72% — in-destination is the highest-value distribution for H3 (Amalfi
    location variant); but season window is narrow (June–Sept).
- **Acceptance:**
  - [ ] Product placed at Brikette reception with price tag and brief display.
  - [ ] Outreach sent to ≥3 local Positano boutiques; ≥1 consignment agreement reached.
  - [ ] Consignment terms agreed: % split, minimum stock, review period.
  - [ ] Sales log maintained weekly.
- **Validation contract:**
  - VC-01: In-destination demand signal → pass when ≥5 in-destination sales (hostel +
    boutique combined) within first 4 weeks of trial; else reassess whether H3
    (location variant) is viable as a channel anchor.
- **Execution plan:**
  - Red evidence plan: no in-destination sales; no boutique agreement.
  - Green evidence plan: place stock; approach boutiques with product + pricing proposal.
  - Refactor evidence plan: adjust consignment terms or display placement if sales < 2
    in first 2 weeks.
- **Planning validation:** None: physical sales task; post-checkpoint.
- **Scouts:** Tourist season starts June; plan TASK-10 to activate in June if checkpoint
  clears in April.
- **Edge Cases & Hardening:** If boutiques decline, fall back to Brikette reception
  only and assess direct tourist sales rate before concluding channel is not viable.
- **What would make this >=80%:** Checkpoint data shows strong Etsy/social demand
  signal + at least 1 boutique expressing interest pre-checkpoint (can be informal).
- **Rollout / rollback:**
  - Rollout: Stock delivered to location; boutique agreement signed.
  - Rollback: Retrieve stock; cancel consignment.
- **Documentation impact:** `demand-log.md` updated with in-destination sales.

---

### TASK-11: `/meta-reflect` — capture startup loop PMF methodology gaps

- **Type:** IMPLEMENT
- **Deliverable:** Targeted improvements filed to startup loop skills/docs via
  `/meta-reflect`; new or updated skill modules for physical product PMF.
- **Execution-Skill:** meta-reflect
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Updated skill files in `.claude/skills/` and/or
  `docs/plans/_templates/`.
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms meta-reflect output is useful.
- **Measurement-Readiness:** None: methodology improvement task.
- **Affects:** `.claude/skills/lp-do-fact-find/`, `.claude/skills/lp-do-plan/`,
  `docs/plans/_templates/`
- **Depends on:** TASK-09 (CHECKPOINT — needs real PMF experience to reflect on)
- **Blocks:** —
- **Confidence:** 88%
  - Implementation: 90% — `/meta-reflect` skill is available and well-defined.
  - Approach: 90% — 6 specific gap areas were identified in the fact-find; all
    are concrete and actionable.
  - Impact: 88% — improves startup loop for all future physical product businesses
    (PIPE, HBAG, and new businesses).
- **Acceptance:**
  - [ ] `/meta-reflect` invoked with evidence from this plan execution.
  - [ ] ≥4 of the 6 identified gaps addressed with concrete skill/doc updates:
    1. SKU scoring/ranking framework
    2. Demand test protocol template for physical products
    3. Supply chain readiness checklist
    4. Margin stack template
    5. In-destination distribution planning guidance
    6. Physical product CE/compliance checklist
  - [ ] Updates are filed to real skill or template files (not just noted).
- **Validation contract:**
  - VC-01: Gap closure → pass when ≥4 of 6 identified gaps have a corresponding
    file edit or new template committed to the repo within 3 days of TASK-09
    completion; else extend reflect window.
- **Execution plan:**
  - Red evidence plan: gaps documented in fact-find; no skill updates yet.
  - Green evidence plan: run `/meta-reflect`; file targeted updates.
  - Refactor evidence plan: Pete reviews; remove any updates that are premature
    or over-engineered.
- **Planning validation:** None: methodology task.
- **Scouts:** None.
- **Edge Cases & Hardening:** If checkpoint shows the PMF process worked without
  modification, still document the process as a positive template — success cases
  are equally valuable for the loop.
- **What would make this >=90%:** Already >=88%; bounded only by the quality of
  real experience from checkpoint data.
- **Rollout / rollback:**
  - Rollout: Skill/template updates committed.
  - Rollback: Revert commits if updates are wrong.
- **Documentation impact:** `.claude/skills/` and/or `docs/plans/_templates/` updated.

---

## Risks & Mitigations

- **Product quality doesn't read as premium in photos** (High): TASK-06 VC-01
  (perception test) is the gate. If <3/5 estimate ≥€80, do not proceed to listing.
- **Premium pricing rejected by Etsy buyers** (Medium): TASK-08 VC-01 (3 sales in
  28 days) catches this. If VC fails, run `/lp-do-replan` on pricing before TASK-10.
- **Tourist season window too narrow for in-destination trial** (Medium): TASK-10
  is post-checkpoint and scheduled for June+. If checkpoint clears late, trial
  window shrinks. Mitigation: start boutique outreach (TASK-10 prep) in May.
- **Single operator bandwidth** (High): waves enforce max 1–2 active tasks at a time.
  Do not run H4/H5 in parallel with H1/H2 demand probe.
- **Etsy organic reach too low to measure demand** (Medium): TASK-08 VC-02 flags this.
  Mitigation: €15–30 Etsy Ads experiment if views <20/listing in 14 days.
- **Bag charm trend peaks before traction** (Low-Medium): trend has 12–24 month
  runway per JOOR data; risk is real but not immediate.

## Observability

- Logging: `docs/plans/mini-handbag-pmf/demand-log.md` — weekly entries for Etsy
  stats, Instagram DM count, in-destination sales.
- Metrics: Weekly — Etsy views/favs/sales; Instagram DMs; in-destination sales count.
- Alerts: If 0 Etsy views in first 7 days, investigate indexing / tags immediately
  rather than waiting 28 days.

## Acceptance Criteria (overall)

- [ ] TASK-01 complete: positioning tier decided and recorded.
- [ ] TASK-05 complete: HBAG outcome contract written and confirmed by Pete.
- [ ] TASK-06 complete: ≥9 photos produced; perception test passes.
- [ ] TASK-07 + TASK-08 running: both channels active and logging data.
- [ ] TASK-09 complete: checkpoint run; downstream tasks re-scored.
- [ ] TASK-11 complete: ≥4 of 6 startup loop gaps addressed via `/meta-reflect`.

## Decision Log

- 2026-02-17: Variant priority set: H1 bag charm (9), H2 AirPod holder (8), H3 Amalfi
  (8), H4 dog holder (6), H5 first bag (5). Source: fact-find scoring matrix.
- 2026-02-17: Chosen approach: Option B (decision-first, sequential demand probe).
- 2026-02-17: **Brand positioning DECIDED — Option B: premium €80–€150.** Decision owner:
  Pete. TASK-01 complete. Target retail price range: €80–€150 across all variants.
  Photography styling: clean, aspirational, artisan quality. Copy voice: confident and
  tasteful, not luxury-apologetic. Channel: Etsy premium tier + Instagram.

## Overall-confidence Calculation

| Task    | Type        | Confidence | Effort (S=1,M=2) | Weighted |
|---------|-------------|-----------|------------------|---------|
| TASK-01 | DECISION    | 90%       | 1                | 90      |
| TASK-02 | INVESTIGATE | 72%       | 1                | 72      |
| TASK-03 | INVESTIGATE | 82%       | 1                | 82      |
| TASK-04 | INVESTIGATE | 72%       | 1                | 72      |
| TASK-05 | IMPLEMENT   | 70%       | 1                | 70      |
| TASK-06 | IMPLEMENT   | 65%       | 2                | 130     |
| TASK-07 | IMPLEMENT   | 70%       | 1                | 70      |
| TASK-08 | IMPLEMENT   | 75%       | 2                | 150     |
| TASK-09 | CHECKPOINT  | 95%       | 1                | 95      |
| TASK-10 | IMPLEMENT   | 60%       | 2                | 120     |
| TASK-11 | IMPLEMENT   | 88%       | 1                | 88      |
| **Total** |           |           | **14**           | **1039** |

**Overall-confidence: 1039 / 14 = 74%**

Primary confidence drag: TASK-06 (photography perception unknown, 65%) and TASK-10
(in-destination confidence pre-checkpoint, 60%). Both resolve at checkpoint.
