---
Type: Reference
Status: Active
business: HEAD
artifact: channel-strategy
created: 2026-02-20
status: ready-to-execute
selected-channels:
  - Own-site DTC (search + retargeting)
  - Community referrals (parent/caregiver networks)
  - Etsy probe lane
budget-month-1: EUR 1500
owner: Pete
last_updated: 2026-02-20
source_of_truth: true
depends_on:
  - docs/business-os/startup-baselines/HEAD-offer.md
  - docs/business-os/strategy/HEAD/decisions/DEC-HEAD-CH-01.user.md
  - docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md
decisions:
  - DEC-HEAD-CH-01
---

# HEAD Channel Strategy + GTM (S6B Backfill)

## Executive Summary

HEAD will run own-site DTC as the primary conversion and learning surface, with constrained Etsy probes and low-CAC community referral distribution. This matches the active channel decision contract (`DEC-HEAD-CH-01`), protects denominator quality, and supports the new MVP stack (multi-pack headbands, organiser pouch, patch packs) without forcing premature spend scale.

---

## 1) Channel Landscape Audit

Scale: 1-5 per dimension. `Total` is simple sum (max 15).

| Channel | Customer fit | Cost fit | Speed to signal | Total | Notes |
|---|---:|---:|---:|---:|---|
| Own-site search capture | 5 | 3 | 4 | 12 | High-intent queries; must maintain compatibility clarity |
| Retargeting (Meta/paid social) | 4 | 3 | 5 | 12 | Efficient for warm traffic; cap spend tightly |
| Community referral groups | 5 | 5 | 3 | 13 | High trust and low CAC potential |
| Etsy marketplace probe | 4 | 4 | 4 | 12 | Good for demand sampling; keep constrained |
| Amazon marketplace | 3 | 2 | 4 | 9 | Operational overhead; defer unless trigger opens |
| Influencer/creator seeding | 3 | 3 | 3 | 9 | Requires asset prep and vetting |
| SEO content cluster | 4 | 4 | 2 | 10 | Slower signal but durable |
| Email lifecycle (owned) | 4 | 5 | 3 | 12 | Strong once first-party list grows |
| Clinic/provider outreach | 2 | 4 | 1 | 7 | Longer cycle; defer in initial 90 days |

---

## 2) Selected Channels (2-3) + Rationale

### Channel A: Own-site DTC (search capture + retargeting)

Why selected:
1. Aligns with `DEC-HEAD-CH-01` primary channel authority.
2. Supports conversion-quality learning with full funnel instrumentation.
3. Best surface for bundle merchandising and support guidance.
4. Enables strict CAC/CVR/returns control against outcome contract thresholds.

30-day success metrics:
- Sessions by source
- Sitewide CVR and channel CVR
- Paid CAC and blended CAC
- Payment success rate
- Bundle attach rate (pouch/patch/pods)

---

### Channel B: Community referrals (caregiver groups + associations)

Why selected:
1. ICP-A trust-heavy buying behavior suits community-led referrals.
2. Low-cost acquisition surface relative to cold paid traffic.
3. Strong fit for routine-focused educational messaging.
4. Useful qualitative feedback loop for fit, copy clarity, and objections.

30-day success metrics:
- Referral sessions
- Assisted conversion share
- Response-to-order lag time
- Repeated objection patterns by group

---

### Channel C: Etsy probe lane (constrained)

Why selected:
1. Preserves marketplace learning without replacing own-site as primary surface.
2. Validates pricing/positioning against marketplace competition.
3. Offers fast experiment loop on product naming and merchandising variants.
4. Explicitly consistent with `DEC-HEAD-CH-01` secondary mode.

30-day success metrics:
- Probe impressions/views
- Marketplace CVR
- Net contribution per order after marketplace fees
- Support load per 10 orders vs own-site baseline

---

## 3) Cost / Constraint Analysis

### Month-1 budget allocation (EUR)

| Lane | Allocation | Constraint |
|---|---:|---|
| Own-site paid search/retargeting tests | 900 | Hard spend caps tied to CAC guardrails |
| Community referral content + ops | 250 | Time-bound and script-led outreach |
| Etsy probe setup + listing tests | 250 | Constrained SKUs and fixed probe window |
| Contingency | 100 | Use only if a channel clears early thresholds |
| **Total** | **1500** | Must remain <= month-1 cap |

### Resource allocation (hours/week)

| Role | Hours/week | Scope |
|---|---:|---|
| Pete (owner) | 10 | Channel decisions, CAC controls, weekly readout |
| Growth/operator support | 12 | Campaign setup, listing ops, QA checks |
| Customer support | 6 | Pre-purchase fit guidance and objection handling |
| Creative/content support | 8 | Product pages, referral posts, ad variants |

### Constraints

- No paid-scale expansion unless outcome-contract guardrails are met.
- No channel activation that contradicts `DEC-HEAD-CH-01`.
- No tether-class promotion before safety/copy governance gate completion.

---

## 4) 30-Day GTM Timeline

| Week | Action | Owner | Channel | Dependency | Milestone |
|---|---|---|---|---|---|
| Pre-launch | Finalise MVP SKU pages (multi-pack, pouch, patches) | Growth | Own-site | Offer backfill complete | Pages ready |
| Pre-launch | Publish compatibility/fit guidance block | Growth + Support | Own-site | Product copy QA | Guidance live |
| Pre-launch | Configure baseline tracking for bundle attach and returns reasons | Growth | Own-site | Analytics baseline | Tracking validated |
| Week 1 | Launch capped search + retargeting tests | Growth | Own-site paid | Tracking validated | First spend live |
| Week 1 | Open 2-3 caregiver group referral scripts | Pete | Community | Messaging pack | Referral traffic starts |
| Week 1 | Launch constrained Etsy probe listings | Growth | Etsy | Asset pack + pricing matrix | Probe live |
| Week 2 | Review CAC/CVR/payment success and enforce hold rules | Pete | All | Week-1 data | Pass/hold decision |
| Week 2 | Rotate top-2 messaging variants on own-site and Etsy | Growth | Own-site + Etsy | Week-1 signal readout | Variant test live |
| Week 3 | Expand winning bundle callouts (school kit / starter kit) | Growth | Own-site | Positive attach-rate signal | Bundle optimisation live |
| Week 3 | Run referral FAQ update from objection logs | Support | Community | Objection tagging | FAQ v2 live |
| Week 4 | Compare own-site vs Etsy contribution and support load | Pete | Own-site + Etsy | 30-day data | Channel recommendation |
| Week 4 | Produce month-2 plan (scale/hold/defer by channel) | Pete | All | Weekly decision memo | Month-2 plan signed |

### Critical path

1. Tracking validation -> paid launch
2. Product-page and fit guidance clarity -> conversion quality
3. Week-2 guardrail decision -> permission for any expansion

---

## 5) Month 2+ Roadmap (Directional)

- Keep own-site as primary if CVR and CAC remain inside contract guardrails.
- Expand referral lane if low-CAC quality traffic repeats.
- Keep Etsy as probe unless contribution outperforms own-site by clear threshold.
- Reopen Amazon only when operational capacity and contribution case are evidence-backed.

---

## 6) Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| CAC drift from low-AOV mix | High | Enforce spend caps and bundle optimisation before scaling |
| Copy drift into medical claims | High | Maintain approved copy guardrails and review checklist |
| Marketplace support overhead | Medium | Keep Etsy lane constrained; compare support load per order |
| Fit ambiguity driving returns | High | Keep compatibility and sizing guidance prominent |

---

## Evidence Register

- `docs/business-os/startup-baselines/HEAD-offer.md`
- `docs/business-os/strategy/HEAD/decisions/DEC-HEAD-CH-01.user.md`
- `docs/business-os/strategy/HEAD/lp-other-products-results.user.md`
- `docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md`
- `docs/business-os/contracts/HEAD/outcome-contract.user.md`

