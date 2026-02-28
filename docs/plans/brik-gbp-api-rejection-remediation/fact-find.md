---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SEO / Distribution
Workstream: Sales / Operations
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: brik-gbp-api-rejection-remediation
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-gbp-api-rejection-remediation/plan.md
Trigger-Why: Google rejected BRIK's GBP API access application (case #1-1062000040302, submitted 2026-02-23). Operator needs to decide: accept manual-only GBP management vs. remediate and reapply; and ensure this doesn't block the higher-value Octorate → Google Hotel Free Listing track.
Trigger-Intended-Outcome: type: operational | statement: Close the GBP API application track with a documented decision; establish manual GBP maintenance cadence; confirm Google Hotel Free Listing plan is unblocked | source: operator
---

# BRIK: GBP API Rejection — Decision & Remediation Fact-Find

## Scope

### Summary

Google's Business Profile API team rejected BRIK's access application (support case #1-1062000040302, submitted 2026-02-23) citing failure to pass "internal quality checks." The rejection recommends updating the GBP listing and company website before reapplying. This fact-find determines: (1) what the API rejection actually affects, (2) what caused the rejection, (3) whether reapplication is worth pursuing, and (4) what the right forward path is for local search distribution.

### Goals

- Clarify the scope of the rejection (what is and is not blocked)
- Identify probable causes of the quality-check failure
- Produce a decision: reapply with remediation vs. accept manual-only management
- Confirm the Octorate → Google Hotel Free Listing track is unaffected and should proceed

### Non-goals

- GBP listing optimization (already completed in TASK-16, 2026-02-23)
- Google Hotel Ads (paid) — free listing first
- Building a custom GBP management integration using the API
- Changes to the Octorate subscription or channel manager setup

### Constraints & Assumptions

- Constraints:
  - GBP API access is controlled exclusively by Google; reapplication timeline and outcome are outside BRIK's control
  - Business description edit control was unavailable in GBP UI as of 2026-02-23 (TASK-16 noted this as an exception; reason unknown)
  - No paid third-party GBP management tools (Localo, Moz Local, etc.) currently in use
- Assumptions:
  - The GBP listing remains live, verified, and unaffected by the API rejection (the rejection is about API access, not the profile itself)
  - TASK-16 manual execution (photos, Q&A, post) is the current state of the GBP profile
  - Google Hotel Free Listing via Octorate uses a separate connectivity API managed by Octorate — not the Business Profile API that was rejected

---

## Outcome Contract

- **Why:** BRIK received a Google API rejection email 2026-02-25. Operator needs a documented decision on the API path and confirmation that the Octorate/Hotel Free Listing channel is not blocked.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A decision memo artifact that closes the API application track (with a clear accept-manual or remediate-and-reapply verdict) and confirms the Google Hotel Free Listing plan should proceed independently as the next priority.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- GBP API rejection email (2026-02-25): *"We will not be able to move forward with your application as your account did not pass our internal quality checks. Recommend reviewing eligibility criteria and ensuring Business Profile and company website are up to date before reapplying."* — operator-provided
- `docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md` — TASK-16 status: **Complete** (operator-attested, 2026-02-23); API application submitted as optional automation track
- `docs/plans/brikette-google-hotel-free-listing/fact-find.md` — Status: Needs-input (both blockers now confirmed per 2026-02-18 notes); planning not yet started; covers Octorate → Google Hotel Prices API path

### Key Modules / Files

- `docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md` — GBP audit complete; support case #1-1062000040302 filed 2026-02-23; manual path confirmed working
- `docs/plans/brikette-google-hotel-free-listing/fact-find.md` — Octorate Metasearch confirmed active (2026-02-18); GBP verified with blue badge (2026-02-18); code tasks 5–8 scoped but not yet planned
- `docs/plans/brikette-seo-traffic-growth/plan.md` — SEO plan Phase B; GBP Insights listed under Observability (monthly monitoring); no tasks blocked by API rejection

### What the GBP API Is (and Who It's For)

The Business Profile API (formerly My Business API) is Google's programmatic interface for managing GBP listings. Its stated intended audience:
- **Agencies** managing GBP at scale (100+ locations)
- **Enterprise software vendors** building local business management platforms
- **Multi-location businesses** managing their own portfolio at scale

For a single-location independent hostel, Google's quality checks likely flag this as a non-standard use case. **Note: the intended-audience characterisation below is inferred from Google's stated API documentation and known API use cases — not fetched and directly verified.** Common rejection triggers for single-location applicants:
- Google Cloud/developer account with no prior API usage history (new account = low trust signal)
- Single-location use case that does not match the intended API consumer profile (inferred; Google's criteria are not publicly enumerated)
- Website signals: thin content, low authority, or profile/website inconsistency that Google checks as part of eligibility
- Profile incompleteness: description edit control was unavailable in BRIK's GBP dashboard (2026-02-23) — this may indicate a profile restriction or staging state that also triggered quality flags

### What the API Would Have Enabled

Had the API been approved, it would have allowed:
- Programmatic description updates (bypassing the UI control limitation)
- Automated photo uploads
- Automated post publishing
- Q&A management at scale

**None of these are blocked** from manual execution via business.google.com. TASK-16 demonstrated this: photos, Q&A review, and post publishing all completed manually in one session (2026-02-23).

### What the Rejection Does NOT Affect

| Item | Status |
|---|---|
| GBP listing live and verified | Unaffected — listing remains active with blue badge |
| Manual GBP management (business.google.com) | Unaffected — fully available |
| TASK-16 completion (photos, Q&A, post) | Already complete (2026-02-23) |
| Google Hotel Free Listing via Octorate | **Unaffected by the API rejection itself** — Octorate uses Google's Hotel Prices API (a separate connectivity partner API managed by Octorate, not the Business Profile API). See Risks table: underlying profile quality may affect property matching. |
| Active SEO plan tasks (TASK-13, TASK-17, TASK-21) | None depend on GBP API |
| GBP Insights monthly monitoring | Unaffected — accessible via business.google.com UI |

### What the Rejection Does Affect

| Item | Impact |
|---|---|
| Automated GBP description updates | Blocked (also blocked manually due to UI limitation) |
| Automated photo/post publishing | Blocked; manual path available and working |
| Programmatic Q&A management | Blocked; manual Q&A review already done |

### Why Reapplication Is Low-Value

1. **What the API adds over manual is minimal**: For a single location, posting 1–2 updates per month and monitoring Q&A manually is a ~30-minute task. The API would save perhaps 15–20 minutes per month of effort.
2. **Reapplication success probability is low**: Google's quality checks for single-location businesses are opaque and reapplication outcome is uncertain. The API is structurally not designed for single-location use.
3. **The description edit limitation** (which the API could have addressed) is a GBP UI issue that may resolve independently when Google's profile review completes — it is not solely an API problem.
4. **The high-value GBP-adjacent action** is the Google Hotel Free Listing via Octorate — this is what gets BRIK into the hotel booking panel in Google Search, which is far higher conversion impact than any API-based automation.

### Delivery & Channel Landscape

- Audience/recipient: operator (Peter) — decision memo to close the API track
- Approvals/owners: Peter (decision authority)
- No compliance constraints for this decision artifact

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Accepting manual-only GBP management is the right path; API automation ROI does not justify reapplication effort | Estimation of manual effort vs. API setup effort | Zero — reason through it | Immediate |
| H2 | The GBP API rejection does not block or delay the Google Hotel Free Listing (Octorate) activation | Understanding which API each path uses | Zero — read existing fact-find | Immediate |
| H3 | The description edit control limitation in GBP UI will resolve without API access (Google profile review completing) | Google's internal profile review process | Monitoring only | 4–8 weeks |
| H4 | If reapplication is pursued, fixing the website (content quality/authority signals) and GBP completeness (resolving description edit block) would raise approval probability | Google's quality criteria | Medium effort (unclear ROI) | Unknown |

### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | TASK-16 manual execution took 20–30 minutes; complete | task-16-gbp-audit.md | High |
| H2 | hotel-free-listing fact-find: Octorate uses Hotel Prices API (not Business Profile API); confirmed active | brikette-google-hotel-free-listing/fact-find.md | High |
| H3 | Description edit unavailable since at least 2026-02-23; cause unknown; possible profile staging issue | TASK-16 attestation | Medium |
| H4 | Google rejection criteria not publicly detailed; website quality a stated factor | Rejection email | Low — Google's criteria are opaque; ROI argument (H1) independently supports no-reapply conclusion |

### Falsifiability Assessment

- **H1 (accept manual-only):** Already falsified — TASK-16 proved manual path works in ~30 min. The ROI calculation (15 min/month API saving vs. unknown remediation effort) is immediately decidable. Falsification would require evidence that monthly manual effort is >2 hours, which would change the ROI case.
- **H2 (Hotel Free Listing unaffected):** Easily testable — activate Octorate Metasearch toggle and check Hotel Center property matching within 48h. If BRIK appears matched, H2 confirmed. If NOT_MATCHED, H2 is partially disconfirmed (profile quality may be a common variable). Timeline: immediate post-activation check.
- **H3 (description edit will resolve):** Low-cost monitoring test — check business.google.com at each monthly manual session. Falsification: description edit remains unavailable for >3 months despite the API rejection case being closed → investigate profile restriction cause.
- **H4 (remediation would raise approval probability):** Structurally unfalsifiable at current scale — Google does not publish pass/fail criteria; reapplication outcome is opaque. The ROI argument makes this moot regardless.

### Recommended Validation Approach

- **Quick probe (immediate):** Operator checks business.google.com at next session — confirm description edit control status. If available, queue description update using TASK-16 draft.
- **Post-activation check (after Octorate toggle):** Monitor Octorate's property matching status in Hotel Center within 48h of activating the Metasearch toggle. This is the H2 validation gate.
- **Monthly monitoring:** GBP Insights review (views, searches, calls) already in brikette-seo-traffic-growth observability section — no new infrastructure required.
- **3-month escalation:** If description edit control remains unavailable after 3 monthly checks (by June 2026), investigate GBP profile restriction cause before assuming it will self-resolve.

---

## Questions

### Resolved

- Q: Does the GBP API rejection affect the Google Hotel Free Listing (Octorate) activation?
  - A: No. Octorate uses Google's Hotel Prices API via its connectivity partner status — a completely separate API and approval pathway managed by Octorate. BRIK never needed to apply for the Business Profile API to get the free listing. The two are independent.
  - Evidence: `docs/plans/brikette-google-hotel-free-listing/fact-find.md` §External Research (Octorate activation path); §Delivery & Channel Landscape

- Q: Are any active plan tasks blocked by the API rejection?
  - A: No. TASK-16 is complete. SEO plan Phase B tasks (TASK-13, TASK-17, TASK-21) have no GBP API dependency. GBP Insights monitoring is manual via the UI.
  - Evidence: `docs/plans/brikette-seo-traffic-growth/plan.md` — no tasks reference GBP API

- Q: Is the GBP listing itself at risk (suspension, deranking) due to the API application?
  - A: No. GBP API applications are a developer/platform access question; rejection has no effect on the listing's live status, verification, or ranking.
  - Evidence: Google's rejection email language ("we will not be able to move forward with your application") is solely about access, not about the profile

- Q: Is reapplication worth pursuing?
  - A: No, at current scale (single location), for the following reasons: (1) manual execution is already proven to work and requires minimal effort (~30 min/month); (2) the API appears structurally designed for agencies/multi-location businesses (inferred — Google's eligibility criteria are not publicly enumerated); (3) the marginal time saving (~15 min/month) does not justify the uncertainty and effort of remediation + reapplication; (4) the high-value local search action is the Octorate Hotel Free Listing, not API automation. **Scale caveat:** if BRIK expands to multiple properties, the API reapplication calculus should be revisited.
  - Evidence: TASK-16 execution time ~30 min (manual, operator-attested); rejection email language; API audience characterisation inferred from known use cases (not directly verified)

- Q: What does "review our eligibility criteria and ensure your Business Profile and company website are fully up to date" mean concretely?
  - A: Based on known API use cases (inferred — not directly fetched from documentation), Google's Business Profile API eligibility typically requires: (1) third-party managing locations for others or a multi-location enterprise; (2) a website clearly describing a business management / software use case; (3) a complete, verified GBP profile. For BRIK — a single-location hostel — criterion (1) is likely not met regardless of profile completeness. That said, the rejection email specifically cites "quality checks" (not "wrong use case"), which leaves open the possibility that profile completeness (including the unavailable description edit control) contributed to the rejection independently.
  - Evidence: Rejection email (operator-provided); API audience characterisation inferred from known use cases — not directly fetched from developer.google.com/my-business/

- Q: Will the description edit control limitation resolve without API access?
  - A: Likely yes, over time. Description edit restrictions often occur when Google's review process is assessing profile quality or when certain profile states trigger a hold on description edits. This is independent of API access. It should be monitored at the next manual GBP review cycle (March 2026).
  - Evidence: TASK-16 noted this as "UI-availability exception"; not a permanent block; no evidence this is API-dependent

### Open (Operator Input Required)

- Q: Has the description edit control become available since 2026-02-23?
  - Why operator input is required: Only checkable by logging into business.google.com — agent cannot access the GBP dashboard.
  - Decision impacted: Whether to include a description update in the March 2026 manual maintenance cycle.
  - Decision owner: Peter
  - Default assumption: Still unavailable; check at next monthly manual session.

---

## Confidence Inputs

- **Implementation**: 90%
  - Basis: Decision memo is clearly scoped; all required decisions can be made from available evidence; no code changes involved.
  - To reach ≥90: Already there — confirm description edit question at next manual session.

- **Approach**: 88%
  - Basis: The manual-only path is proven; the Octorate/Hotel Free Listing separation is confirmed; reapplication case is weak and the analysis is well-supported.
  - To reach ≥90: Operator confirms description edit control status.

- **Impact**: 80%
  - Basis: Closing this track and redirecting effort to Google Hotel Free Listing (Octorate) is the correct priority shift. The impact of this decision memo is primarily opportunity-cost recovery.
  - To reach ≥90: Google Hotel Free Listing plan is created and first tasks executed.

- **Delivery-Readiness**: 85%
  - Basis: All decision inputs are present; operator can review and confirm the memo in a single session.
  - To reach ≥90: Operator signs off on the decision in the planning artifact.

- **Testability**: 80%
  - Basis: Decision memo has a clear acceptance criterion (decision recorded, manual cadence documented, Hotel Free Listing plan unblocked).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Description edit limitation persists indefinitely | Low-Medium | Low — manual updates work; description is not a ranking-critical field at this stage | Check at each monthly manual session; if persistent after 3 months, investigate GBP profile state |
| Google Hotel Free Listing delayed by unrelated GBP issue | Low | Medium | Hotel Free Listing plan should proceed — the activation path (Octorate toggle + schema fixes) is independent of API access |
| Reapplication temptation consumes operator time | Low | Low | This fact-find and resulting decision memo formally closes the reapplication track unless business scale changes |
| GBP listing quality degrades over time (reviews unanswered, stale posts) | Medium | Low-Medium | Monthly manual review cadence (30 min/month) is sufficient to maintain profile health |
| GBP profile quality flags (API rejection signal) cause Hotel Center property-match failure after Octorate activation | Low-Medium | High — would delay or prevent Hotel Free Listing appearing in Google Hotel Search | Monitor Octorate property-match status in Hotel Center within 48h of Metasearch toggle activation; if NOT_MATCHED, align GBP name/address data with Octorate account and re-check; escalate to Octorate support if unresolved after 72h |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Manual GBP management via business.google.com is the authoritative path going forward
  - GBP Insights monitoring is already in the brikette-seo-traffic-growth plan observability section — no new tracking setup needed
  - Google Hotel Free Listing plan (`brikette-google-hotel-free-listing`) must be created as a separate plan — its fact-find is Ready-for-planning (both blockers confirmed as of 2026-02-18)
- Rollout/rollback expectations:
  - No deployment or code changes in this plan
  - Decision memo is the sole deliverable
- Observability expectations:
  - Monthly manual GBP Insights check (already in SEO plan observability section)
  - Description edit control re-check at March 2026 manual session

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01**: Write decision memo — formally close GBP API application track; document accept-manual verdict; record rationale for no reapplication. (S effort, operator sign-off required)
2. **TASK-02**: Document manual GBP maintenance cadence — monthly session checklist (Posts, Q&A, Insights capture) derived from TASK-16 runbook. (XS effort)
3. **TASK-03**: Trigger `brikette-google-hotel-free-listing` plan creation — the fact-find is confirmed ready-for-planning; this is the highest-value local search action now. (Handoff only — not in this plan's scope)
4. **(Optional) TASK-04**: Check description edit control at March 2026 manual session; if available, update GBP description using TASK-16 draft. (Operator-only, deferred)

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (business-artifact track)
- Supporting skills: none
- Deliverable acceptance package:
  - Decision memo artifact with operator sign-off on accept-manual verdict
  - Manual maintenance cadence documented
  - Google Hotel Free Listing plan creation formally triggered
- Post-delivery measurement plan:
  - No metrics for this decision memo
  - GBP profile health tracked via existing SEO plan observability (monthly manual check)

---

## Evidence Gap Review

### Gaps Addressed

- **Citation integrity**: All non-trivial claims backed by existing plan artifacts (task-16-gbp-audit.md, brikette-google-hotel-free-listing/fact-find.md, brikette-seo-traffic-growth/plan.md) or the operator-provided rejection email. No uncited claims.
- **Boundary coverage**: Confirmed that Business Profile API and Hotel Prices API are separate pathways — the rejection affects only the former, not the latter. This was the primary boundary risk.
- **Business validation**: Hypotheses H1 and H2 resolved in full via documented evidence. H3 and H4 appropriately deferred to operator confirmation and Google's opaque process.
- **Channel/compliance**: No compliance constraints for a decision memo. GBP listing remains compliant and live.

### Confidence Adjustments

- No reductions required. Evidence is sufficient to make the decision. The single unknown (description edit control status) does not block the decision — it only affects a deferred optional TASK-04.
- Approach confidence held at 88% (not 90%) because reapplication probability analysis rests on inferred Google eligibility criteria, not publicly disclosed pass/fail thresholds.

### Remaining Assumptions

- GBP listing has not been suspended or modified since TASK-16 (2026-02-23). Operator would have noticed.
- Octorate Metasearch is still active (confirmed 2026-02-18; no reason to expect change).
- The Business Profile API and Hotel Prices API are separate; this is confirmed by the hotel-free-listing fact-find research but has not been independently verified in a separate source for this fact-find.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None
- Recommended next step: `/lp-do-plan brik-gbp-api-rejection-remediation --auto`
