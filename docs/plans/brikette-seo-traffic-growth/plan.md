---
Type: Plan
Status: Draft
Domain: SEO | Content | Outreach
Workstream: Mixed
Version: v2
Created: 2026-02-22
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25
Last-sequenced: 2026-02-25
Relates-to charter: none
Feature-Slug: brikette-seo-traffic-growth
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo, draft-outreach
Overall-confidence: 60% (Phase B scope; all tasks deferred/blocked on precursor conditions)
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
Archive: docs/plans/brikette-seo-traffic-growth/plan-v1.md
---

# Brikette SEO Traffic Growth Plan — v2 (Phase B)

## Context

Phase A is complete. See `docs/plans/brikette-seo-traffic-growth/plan-v1.md` for the full task history and build evidence for all completed tasks.

**Phase A summary:** All URL normalization blockers fixed (www→apex, root redirect 302→301, canonical/sitemap trailing-slash alignment). Homepage and rooms metadata optimised. Homepage featured guides section shipped. Italian transport-guide meta quality pass done. Sitemap lastmod scoped to eligible guides. GBP audit complete. Backlink baseline and target vetting complete. TASK-03b post-change canonical validation completed 2026-02-25 (mismatch 50%→0%).

This v2 plan tracks the three remaining Phase B tasks.

## Active tasks

- [ ] TASK-13: Content quality pass on top transportation guides (Deferred; gated on indexation signal)
- [ ] TASK-17: Backlink outreach targeting (Deferred; blocked on TASK-21)
- [ ] TASK-21: Outreach pack rehearsal + approval gate (Blocked: awaiting reviewer sign-off evidence)

## Goals

- Execute content quality improvements on top transportation guides once indexation recovery is confirmed (TASK-13)
- Complete reviewer sign-off on the outreach pack and send 10 personalised pitches (TASK-17, TASK-21)
- Achieve ≥3 positive outreach responses or ≥1 confirmed editorial backlink within 60 days of first send

## Non-goals

- Conversion rate optimisation
- Paid search / PPC
- Google Tag Manager migration
- Social media growth strategy
- Core Web Vitals audit (separate concern)
- Re-running or revisiting any Phase A tasks (they are complete and archived)

## Constraints & Assumptions

- Constraints:
  - Static export (Cloudflare Pages) — no server-side rendering; dynamic routes pre-generated at build time
  - 18 locales — any content change must apply consistently across all languages
  - No paid SEO tools (Ahrefs, SEMrush) — using GSC + GA4 + Cloudflare data only
- Assumptions:
  - Canonical URL policy: **slashless** — confirmed and deployed in Phase A (DECISION-01)
  - Guide pages are not currently indexed; content expansion work (TASK-13) remains gated on indexation signal from GSC monitoring
  - Outreach targets are qualified and prioritised (TASK-20 complete); only reviewer approval gate (TASK-21) blocks sends

## Fact-Find Reference

- Related brief: `docs/plans/brikette-seo-traffic-growth/fact-find.md`
- Phase A archive: `docs/plans/brikette-seo-traffic-growth/plan-v1.md`
- Key Phase B inputs:
  - TASK-11 result: 30/30 sampled guide URLs `URL is unknown to Google` — content expansion gated
  - TASK-03b result (2026-02-25): canonical mismatch 50%→0%, recrawl confirmed T+2 — TASK-13 TASK-03b dependency satisfied; indexation signal monitoring now determines unlock
  - TASK-20 result: 33-domain matrix, ranked 10-target shortlist, contactability evidence complete
  - TASK-21 state: outreach pack artifact drafted (templates + 10 personalised entries), reviewer sign-off pending

## Plan Gates

- Foundation Gate: Pass (Phase A complete)
- Sequenced: Yes
- Edge-case review complete: No (Phase B tasks only)
- Auto-build eligible: No (plan-only mode)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-21 | INVESTIGATE | Outreach pack rehearsal + approval gate | 80% | S | Blocked (awaiting reviewer sign-off) | TASK-20 (✓) | TASK-17 |
| TASK-13 | IMPLEMENT | Content quality pass — top transportation guides | 45% | M | Deferred (gated on indexation signal) | CHECKPOINT-01 (✓), TASK-03b (✓) | - |
| TASK-17 | IMPLEMENT | Backlink outreach targeting | 65% | M | Deferred (TASK-21 gate pending) | TASK-18 (✓), TASK-20 (✓), TASK-21 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 8 (Phase B precursor) | TASK-21 | TASK-20 (✓) | Outreach pack drafted; awaiting reviewer sign-off evidence before promotion. |
| Deferred (Phase B) | TASK-13, TASK-17 | TASK-13: indexation signal from GSC monitoring; TASK-17: TASK-21 | TASK-17 remains below IMPLEMENT threshold until TASK-21 is completed; run `/lp-do-replan` after TASK-21 if still below threshold. |

**Critical path:** TASK-21 sign-off → TASK-17 promotion → outreach execution
**Parallel opportunity:** TASK-13 can begin independently once indexation signal is confirmed from GSC monitoring

---

## Tasks

---

### TASK-21: Outreach pack rehearsal + approval gate

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-21-outreach-pack.md` with final pitch templates, 10 personalized draft entries, and reviewer approval record
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Blocked (awaiting reviewer sign-off evidence)
- **Artifact-Destination:** `docs/plans/brikette-seo-traffic-growth/task-21-outreach-pack.md`
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** Reviewer sign-off block in artifact for templates + personalization quality
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-21-outreach-pack.md`
- **Depends on:** TASK-20 (✓)
- **Blocks:** TASK-17
- **Confidence:** 80%
  - Implementation: 85% — pack structure is straightforward; artifact already drafted.
  - Approach: 80% — warm/cold split and personalization angles are evidence-backed by `TASK-20`.
  - Impact: 80% — reduces execution-risk for TASK-17 by pre-validating messaging and approval path.
- **Acceptance:**
  - Two finalized templates (warm-contact and cold editorial) with subject variants
  - Ten personalized draft entries mapped to TASK-20 shortlist domains
  - Reviewer sign-off recorded prior to any outreach sends
- **Validation contract:** Artifact includes checklist proving template quality, personalization coverage (10/10), and reviewer approval timestamp/signature note
- **Planning validation:** None: S investigation task
- **Rollout / rollback:** None: investigation artifact and approval gate only
- **Documentation impact:** Enables TASK-17 promotion from deferred to runnable after replan

**Build evidence (2026-02-23):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-21-outreach-pack.md`
- Finalized warm/cold templates with subject variants and mapped 10 personalized draft entries to TASK-20 shortlist domains.
- Validation checklist completed for template and personalization coverage (`10/10`), but reviewer approval evidence remains unsigned.
- Gate result: task remains blocked until sign-off checkboxes/timestamp are completed in artifact.

**To unblock:** Open `docs/plans/brikette-seo-traffic-growth/task-21-outreach-pack.md`, review templates and draft entries, and complete the sign-off block.

---

### TASK-13: Content quality pass — top transportation guides

- **Type:** IMPLEMENT
- **Deliverable:** Updated content for top 5 EN transportation guides (word count ≥500 words, structured HowTo steps complete, internal links to related guides); corresponding IT translations queued
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Deferred (Phase B)
- **Affects:** `apps/brikette/src/guides/` (guide content files), `apps/brikette/src/i18n/` (locale guide files)
- **Depends on:** CHECKPOINT-01 (✓), TASK-03b (✓)
- **Blocks:** -
- **Confidence:** 45%
  - Implementation: 60% — guide content editing remains feasible, but execution should not start while sampled guides are still `URL is unknown to Google`.
  - Approach: 45% — content enrichment is not currently the first-order constraint; discovery/indexation signal is unresolved.
  - Impact: 45% — low near-term confidence until indexed presence is observed for target guide cohorts.
  - Overall: min(60, 45, 45) = 45%. Below IMPLEMENT threshold; remains deferred pending indexation recovery evidence.
- **Unlock condition:** GSC URL Inspection or organic clicks data showing sampled transport guide URLs transitioning from `URL is unknown to Google` to `Indexed` or `Crawled - currently not indexed`. Run `/lp-do-replan` once this signal is observed.
- **Acceptance:**
  - 5 transportation guides have ≥500 words of substantive content per EN page
  - Each guide includes ≥3 internal links to related guides (other transport routes, accommodation)
  - HowTo structured data steps are complete and accurate for each guide
  - Post-deploy: at least 2 of 5 guides show position improvement or indexation improvement in GSC within 8 weeks
- **Validation contract (VC-01):**
  - VC-01: After 8 weeks post-deploy — **primary pass condition**: ≥3 of 5 target guides appear in top 20 in GSC for their primary target query (H2 threshold). Deadline: 8 weeks post-deploy.
  - **Secondary diagnostic (not a pass condition):** crawled-not-indexed rate for the same 5 guides at 8 weeks. If >50% remain crawled-not-indexed, failure root cause is indexation quality rather than ranking position — route to additional content/authority investigation rather than assuming H2 is confirmed.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: GSC position data for 5 target guides pre-change; TASK-11 indexation status for same guides
  - Green evidence plan: Updated guide content deployed; resubmit URLs in GSC for recrawl
  - Refactor evidence plan: 28-day GSC position check; if VC-01 not trending toward pass, route to replan
- **Planning validation (M task):**
  - Checks run: CHECKPOINT-01 evidence reviewed (TASK-10/11)
  - Validation artifacts: TASK-11 indexation results (primary input)
  - Unexpected findings: sampled guides were `URL is unknown to Google` at checkpoint time
- **Scouts:** Defer execution until indexation signal confirms guides are known/indexed
- **Edge Cases & Hardening:** 18-locale structure — EN updates should not degrade translation parity; use guide-translate skill for IT translation if needed
- **What would make this ≥90%:** Follow-up indexing sample confirms guides are known/indexed and primarily rank-limited
- **Rollout / rollback:** Rollout: standard deploy; Rollback: revert content files
- **Documentation impact:** Update fact-find OPP-08 status

---

### TASK-17: Backlink outreach targeting

- **Type:** IMPLEMENT
- **Deliverable:** Outreach target list (10 travel blogs/editorial sites) + pitch template + 10 pitches sent (documented)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Deferred (Phase B; precursor chain pending)
- **Artifact-Destination:** `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** Target list approved; pitch template reviewed; outreach log
- **Measurement-Readiness:** GSC Links report monthly; track referring domain count; Peter / monthly
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Depends on:** TASK-18 (✓), TASK-20 (✓), TASK-21
- **Blocks:** -
- **Confidence:** 65% (→82% conditional on TASK-21 completion)
  - Implementation: 75% — outreach execution path is clear; remaining readiness dependency is template/final draft approval in TASK-21.
  - Approach: 75% — TASK-20 now provides packaged target-quality/contactability evidence and a ranked shortlist; remaining approach uncertainty is message-review quality gating.
  - Impact: 65% — target quality is improved versus prior state, but response/backlink yield uncertainty remains until TASK-21 completion and first-send outcome data.
  - Overall: min(75, 75, 65) = 65%. Below IMPLEMENT threshold; remains deferred in Phase B pending final precursor evidence.
  Note: confidence below 80% IMPLEMENT threshold. Run `/lp-do-replan` after TASK-21 is signed off to promote this task.
- **Acceptance:**
  - Target list of ≥10 travel blogs/editorial sites identified using tool-free criteria: active Amalfi Coast/Positano content published in last 12 months (verifiable via web search); author email or contact form accessible; editorial (not paid placement) based on link disclosure policy
  - No paid SEO tools (Ahrefs/SEMrush DA scores) required — use tool-free proxies: site age, editorial depth, Google search snippet quality, and GSC Links data from TASK-18 to identify existing referrers
  - Pitch template drafted and reviewed
  - 10 outreach emails sent (documented in outreach log)
- **Validation contract (VC-04/05/06):**
  - VC-04 (Readiness): Before first send, artifact includes ≥10 approved targets with contact route, recent relevant article (<=12 months), and personalization angle. Pass if all 10 meet criteria; else block send and re-open TASK-20. Deadline: pre-send gate.
  - VC-05 (Execution): Outreach log records ≥10 personalized pitches sent within 14 days of send-start with fields `{domain, contact method, send date, template variant, personalization note}`. Pass if all fields present for all 10; else fail execution completeness.
  - VC-06 (Outcome): Within 60 days of first send, achieve ≥3 positive/interested responses OR ≥1 confirmed editorial backlink. Minimum sample: 10 sent pitches. If fail, trigger `/lp-do-replan` for follow-up strategy revision.
  - Validation type: review checklist + approval gate + outreach log + timed outcome check.
  - Validation location/evidence: `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md` + append-only outreach log section in same file.
  - Run/verify: reviewer checks VC-04 pre-send; operator verifies VC-05 at send completion; reviewer verifies VC-06 at day 60 checkpoint.
- **Execution plan:** Red → Green → Refactor
  - Red evidence: TASK-18 GSC Links baseline (33 linking domains confirmed) and target/contactability matrix from TASK-20
  - Green evidence: Reviewer-approved outreach pack from TASK-21, then 10 personalized pitches sent with complete log (VC-05)
  - Refactor: 30-day follow-up cadence on non-responses; track GSC Links report monthly for new referring domains and anchor shifts
- **Planning validation (M task):**
  - Validation artifacts: TASK-18 GSC Links baseline; TASK-20 vetting matrix + ranked shortlist
- **Scouts:** Use TASK-20 output to prioritize warm contacts first (existing referring domains with editorial travel relevance and active contact endpoints)
- **Edge Cases & Hardening:** Do not use link-buying schemes or private blog networks (SEO penalty risk); editorial-only outreach
- **What would make this ≥90%:** Pre-identified warm contacts at target publications; Lonely Planet contact already established via existing referral
- **Rollout / rollback:** None: outreach is irreversible; rollback is not applicable
- **Documentation impact:** Write target list and outreach log at `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Notes / references:** OPP-13: backlink acquisition is the primary lever for head-term top-10 rankings; H5 in fact-find

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google has already assessed translated guide corpus as thin/low-value content | Medium | High — invalidates TASK-13 | Defer TASK-13 until indexation recovery signal observed; do not invest in content enrichment while guides remain `URL is unknown to Google` |
| OTA authority blocks "hostel positano" top-10 regardless of on-page work | High | Medium — limits realistic ceiling to 15–18 | Expectations set; success metric is position ≤18, not top-10 |
| Backlink acquisition yields zero editorial links in 3 months | High | High for head-term rankings | Run outreach as parallel workstream; set realistic long-horizon expectations |
| Reviewer sign-off on TASK-21 delayed indefinitely | Medium | High — blocks TASK-17 entirely | TASK-21 artifact is already drafted; only sign-off action required from reviewer |
| 18-locale content changes in TASK-13 degrade translation parity | Low | Medium | Use guide-translate skill for IT translation; run parity checks |

## Observability

- **GSC position tracking:** Weekly check for "hostel positano" (position 22 baseline), "hostels in positano" (11.3), "amalfi coast hostels" (9.1), "positano hostels" (19.7)
- **GSC CTR tracking:** Rooms page (/en/rooms) 0.5% CTR baseline; Italian country segment 1.9% CTR baseline
- **GSC URL Inspection:** Monitor for transport guide indexation signal (transition from `URL is unknown to Google` to indexed/crawled) — this is the TASK-13 unlock condition
- **GSC organic clicks:** Weekly organic click count; baseline ~112/90 days (~1.2/day); H1 pass: directional improvement in 8 weeks
- **GSC Links:** Monthly check on referring domain count using TASK-18 UI export baseline (33 domains)
- **GBP Insights:** Monthly GBP Performance metrics (views, searches, calls, directions, website clicks) + neutral-profile SERP spot-check for three core local queries

## Acceptance Criteria (remaining)

- [ ] No canonical tag target URL returns a 3xx (all canonical targets return `200` directly)
- [x] GSC URL Inspection post-TASK-02 (TASK-03b): declared canonical = Google-selected canonical on ≥90% of sampled URLs — **TASK-03b is complete (2026-02-25): 0% mismatch confirmed**
- [ ] Rooms page CTR ≥1.5% within 28-day GSC window post-TASK-08 (baseline: 0.5%) — monitoring
- [ ] Homepage "hostel positano" position ≤18 (28-day GSC average) within 8 weeks of TASK-01+02 deploy — monitoring
- [ ] TASK-21 reviewer sign-off completed → TASK-17 promoted and outreach sends begin
- [ ] TASK-17 VC-06: ≥3 positive outreach responses OR ≥1 confirmed editorial backlink within 60 days of first send
- [ ] TASK-13 VC-01: ≥3 of 5 target transport guides appear in top 20 GSC for primary query within 8 weeks of deploy

## Decision Log

See `docs/plans/brikette-seo-traffic-growth/plan-v1.md` for the complete Phase A decision log.

**Phase B decisions:**
- 2026-02-25: Plan archived as v1; v2 created with Phase B tasks only (TASK-13, TASK-17, TASK-21).
- 2026-02-25: TASK-03b confirmed complete — canonical mismatch 50%→0%, recrawl confirmed T+2. TASK-13 unlock dependency on TASK-03b is satisfied; remaining gate is indexation signal from GSC monitoring.

## Overall-confidence Calculation (Phase B)

| Task | Type | Confidence | Effort | Weighted |
|---|---|---|---|---|
| TASK-21 | INVESTIGATE | 80 | S=1 | 80 |
| TASK-13 | IMPLEMENT | 45 | M=2 | 90 |
| TASK-17 | IMPLEMENT | 65 | M=2 | 130 |
| **Total** | | | **5** | **300** |

**Overall-confidence (Phase B) = 300 / 5 = 60%**

Note: Phase B confidence is below 80% by design — all three tasks are deferred/blocked on precursor conditions. Confidence will rise to ≥80% once TASK-21 is signed off (TASK-17 → 82%) and indexation signal is confirmed (TASK-13 → 70%+). Run `/lp-do-replan` after each precursor is resolved.
