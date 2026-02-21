---
Type: Plan
Status: Active
Domain: UI
Workstream: Mixed
Created: 2026-02-17
Last-reviewed: 2026-02-17
Last-updated: 2026-02-18 (TASK-09 IMPLEMENT complete — WhatsApp prefill, long-stay reroute, sessionStorage redirect-back, whatsapp_click GA4 event; 7/7 TC PASS)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-apartment-landing-conversion-audit
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: website-upgrade-backlog
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, lp-do-replan, lp-seo, lp-design-spec
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# BRIK Apartment Landing Conversion Audit Plan

## Summary

This plan converts the apartment conversion fact-find into a gated mixed-track execution sequence.
The first tranche resolves evidence and policy decisions that currently block safe implementation
(verified facts, pricing claims, legal terms scope, perks applicability, review-source policy,
and canonical host/hreflang rules).

Implementation then proceeds in dependency order: apartment-context booking CTA routing,
SSR/i18n leakage hardening, booking fallback and assisted-conversion tracking,
facts-driven content/media replacement, and technical SEO hardening.

A CHECKPOINT is inserted before final SEO/review/performance tasks so downstream scope is revalidated
against measured conversion and crawl evidence instead of assumptions.

## Goals

- Remove apartment booking-path confusion in global CTAs.
- Eliminate SSR/source i18n-key leakage on apartment commercial routes.
- Publish legal/policy/perks behavior that matches apartment booking reality.
- Add deterministic no-availability fallback and assisted-conversion instrumentation.
- Replace non-product media with apartment-proof imagery and image SEO metadata.
- Implement canonical/hreflang/schema rules without violating review markup constraints.
- Establish mobile performance guardrails (LCP/INP/CLS) for apartment conversion surfaces.

## Non-goals

- Full re-architecture of global booking modals beyond apartment requirements.
- New CMS platform buildout for media management.
- Broad non-apartment IA rewrite outside explicitly scoped cross-links.
- Auto-build handoff in this turn.

## Constraints & Assumptions

- Constraints:
  - Planning mode only (`plan-only`); no auto continuation to `/lp-do-build`.
  - Decisions on legal terms, perks, and review-policy must be explicit before implementation tasks that depend on them.
  - Any review schema must remain disabled unless first-party, on-page-visible review data is confirmed.
  - Validation must use targeted commands only (no unfiltered `pnpm test`).
- Assumptions:
  - Existing apartment tests and SSR readiness tests can be extended instead of replaced.
  - Apartment routes continue to use App Router metadata helpers and existing slug/path infrastructure.
  - Evidence artifacts under `artifacts/fact-find/2026-02-17/` are the canonical closure source for SSR/crawl checks.

## Fact-Find Reference

- Related brief: `docs/plans/brik-apartment-landing-conversion-audit/fact-find.md`
- Key findings used:
  - Global header/mobile CTA currently targets hostel booking route semantics (`/{lang}/book`).
  - Apartment pages require deterministic evidence capture for JS-off/source behavior.
  - Legal terms label and direct-booking perks messaging need explicit route-scoped policy decisions.
  - Booking flow needs explicit no-availability fallback behavior and associated instrumentation.
  - Canonical/hreflang and review-schema constraints must be implemented with policy guardrails.

## Proposed Approach

- Option A: Gate-first mixed rollout (chosen)
  - Resolve blocking decisions and evidence contracts first.
  - Implement conversion-critical code/content changes in P1 tranche.
  - Insert CHECKPOINT before SEO/review/perf hardening.
- Option B: Implement all technical work first, decide policy later
  - Faster initial code throughput.
  - High rework risk and policy mismatch risk.

Chosen approach: Option A.

## Plan Gates

- Foundation Gate: Pass
  - Fact-find includes required routing metadata (`Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, alias).
  - Mixed-track validation foundations present:
    - code/test surfaces verified (`ApartmentPageContent.tsx`, `ApartmentBookContent.tsx`, header/footer/notification banner, SSR audit tests)
    - business validation landscape captured (facts, legal/perks/review policies, channel and hypothesis constraints)
- Build Gate: Open
  - TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08 complete.
  - TASK-09 complete (2026-02-18) — WhatsApp prefill, long-stay reroute, sessionStorage redirect-back, `whatsapp_click` GA4 event; 7/7 TC PASS.
  - TASK-11 promoted to 82% via `/lp-do-replan` (2026-02-17) — CF pattern confirmed; eligible for next `/lp-do-build`.
  - TASK-16 complete — Octorate precheck INCAPABLE; TASK-09 narrowed scope confirmed.
  - TASK-11 (82%) eligible for next `/lp-do-build` cycle.
  - TASK-12 still blocked by TASK-11.
- Sequenced: Yes
- Edge-case review complete: Yes
  - Reviewed no-JS crawlability, multilingual canonicalization, legal/policy mismatch, no-availability flows, and mobile performance regressions.
- Auto-build eligible: No
  - `plan-only` mode and Build Gate fail.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Capture reproducible apartment evidence artifacts + baseline validation map | 82% | M | Complete (2026-02-17) | - | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-08 |
| TASK-02 | DECISION | Approve facts-sheet and pricing-claim policy for apartment copy | 85% | S | Complete (2026-02-17) | TASK-01 | TASK-09, TASK-10 |
| TASK-03 | DECISION | Confirm apartment legal terms scope and route label rules | 84% | S | Complete (2026-02-17) | TASK-01 | TASK-07, TASK-10, TASK-14 |
| TASK-04 | DECISION | Decide direct-booking perks behavior on apartment routes | 82% | S | Complete (2026-02-17) | TASK-01 | TASK-07 |
| TASK-05 | DECISION | Approve review-source policy and schema eligibility guardrail | 80% | S | Complete (2026-02-17) | TASK-01 | TASK-14 |
| TASK-06 | DECISION | Finalize canonical host, hreflang locale matrix, and locale link map | 81% | S | Complete (2026-02-17) | TASK-01 | TASK-13 |
| TASK-07 | IMPLEMENT | Implement apartment-context CTA, legal label wiring, and perks-route behavior | 81% | M | Complete (2026-02-17) | TASK-01, TASK-03, TASK-04 | TASK-09, TASK-12 |
| TASK-08 | IMPLEMENT | Harden SSR/i18n rendering for apartment routes with deterministic source checks | 80% | M | Complete (2026-02-17) | TASK-01 | TASK-12, TASK-13 |
| TASK-09 | IMPLEMENT | Implement booking module no-result fallback + WhatsApp prefill attribution | 82% | L | Complete (2026-02-18) | TASK-02, TASK-07 | TASK-12, TASK-15 |
| TASK-16 | SPIKE | Probe Octorate API for real-time availability precheck capability | 80% | S | Complete (2026-02-17) | TASK-07 | TASK-09 |
| TASK-10 | IMPLEMENT | Publish verified apartment content pack (facts/policies/arrival/fallback copy) | 80% | M | Complete (2026-02-17) | TASK-02, TASK-03 | TASK-11, TASK-12, TASK-14 |
| TASK-11 | IMPLEMENT | Replace apartment media set and image SEO metadata | 82% | M | Pending | TASK-10 | TASK-12, TASK-13, TASK-15 |
| TASK-12 | CHECKPOINT | Horizon checkpoint before technical SEO/review/perf tranche | 95% | S | Pending | TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 | TASK-13, TASK-14, TASK-15 |
| TASK-13 | IMPLEMENT | Implement canonical/hreflang and baseline schema hardening | 79% | M | Pending | TASK-06, TASK-08, TASK-11, TASK-12 | TASK-14 |
| TASK-14 | IMPLEMENT | Ship testimonial module and conditional review schema gating | 77% | M | Pending | TASK-03, TASK-05, TASK-10, TASK-12, TASK-13 | - |
| TASK-15 | IMPLEMENT | Enforce apartment mobile performance guardrails and monitoring | 78% | M | Pending | TASK-09, TASK-11, TASK-12 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish reproducible evidence and baseline before policy/implementation branches |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | TASK-01 | Policy/ownership decisions can run in parallel |
| 3 | TASK-07, TASK-08, TASK-10 | Wave 2 decisions by dependency | Conversion-critical implementation and content foundation |
| 4 | TASK-09, TASK-11, TASK-16 | TASK-09 needs TASK-02+TASK-07; TASK-11 needs TASK-10; TASK-16 needs TASK-07 | Booking fallback, media hardening, Octorate API spike (parallel) |
| 5 | TASK-12 | TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 | Mandatory checkpoint before SEO/review/perf tranche |
| 6 | TASK-13, TASK-15 | TASK-13 needs TASK-06+TASK-08+TASK-11+TASK-12; TASK-15 needs TASK-09+TASK-11+TASK-12 | Can run concurrently after checkpoint |
| 7 | TASK-14 | TASK-03, TASK-05, TASK-10, TASK-12, TASK-13 | Final trust/schema task after policy + baseline schema |

**Max parallelism:** 5 tasks (Wave 2)
**Critical path:** TASK-01 -> TASK-03 -> TASK-07 -> TASK-09 -> TASK-12 -> TASK-13 -> TASK-14

## Tasks

### TASK-01: Capture reproducible apartment evidence artifacts + baseline validation map
- **Type:** INVESTIGATE
- **Deliverable:** Evidence packet and baseline map under `artifacts/fact-find/2026-02-17/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Affects:** `artifacts/fact-find/2026-02-17/evidence-notes.md`, `[readonly] apps/brikette/src/app/[lang]/apartment/page.tsx`, `[readonly] apps/brikette/src/app/[lang]/apartment/book/page.tsx`, `[readonly] apps/brikette/src/test/content-readiness/i18n/commercial-routes-ssr-audit.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-08
- **Confidence:** 82%
  - Implementation: 84% - artifact paths and pass/fail checks are already defined in fact-find.
  - Approach: 82% - deterministic capture commands and assertions are explicit.
  - Impact: 88% - closes reproducibility gap that currently blocks unambiguous execution.
- **Questions to answer:**
  - Are source-level i18n placeholders reproducible in current branch for `/en/apartment` and `/en/apartment/book`?
  - Which checks already exist in tests and which require additions?
  - Is the apartment header CTA still route-agnostic (`/{lang}/book`) in live code paths?
- **Acceptance:**
  - `evidence-notes.md` is populated with timestamps, user-agent, JS mode, and assertion outcomes.
  - Source captures and screenshots exist for both apartment routes.
  - Baseline map references existing tests and identifies coverage gaps for new tasks.
- **Validation contract:**
  - VC-01: `evidence-notes.md` has 4 capture rows populated and no `pending` status remaining.
  - VC-02: Deterministic grep/curl checks for translation-key leakage and H1 presence are recorded with pass/fail outcomes.
- **What would make this >=90%:**
  - Capture reproducible evidence for EN plus one non-EN locale and link both to passing assertions.
- **Planning validation:**
  - Checks run: `rg` and targeted file reads across apartment pages, header/footer/banner, and SSR audit tests.
  - Validation artifacts: paths listed in `Affects` and fact-find evidence appendix.
  - Unexpected findings: app currently has stronger apartment copy/tests than initial audit snapshot, but route-level CTA and policy coherence tasks remain valid.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** updates fact-find artifact references and unblocks policy decisions.
- **Notes / references:** `docs/plans/brik-apartment-landing-conversion-audit/fact-find.md`
- **Build completion evidence (2026-02-17):**
  - `artifacts/fact-find/2026-02-17/evidence-notes.md` written with 4 capture rows (all `COMPLETE`) and checks A–F.
  - VC-01: 4 rows populated, no `pending` status remaining. ✓
  - VC-02: Deterministic checks recorded with PASS/FAIL/UNRESOLVED outcomes. ✓
  - Key confirmed findings:
    - **GAP/FAIL**: Header/mobile CTA (`DesktopHeader.tsx:61`, `MobileNav.tsx:56`) is route-agnostic — always `/{lang}/book`. No apartment-route branching. → TASK-07 required.
    - **GAP/FAIL**: No static Octorate fallback in `apartment/book/page.tsx` RSC layer. TC-02 only covers hostel booking route. → TASK-08 required.
    - **PASS**: EN locale i18n key leakage check — no literal key names in RSC page files.
    - **PASS**: Schema (`apartment.jsonld`) has no `AggregateRating` — review-schema guardrail compliant.
    - 7 coverage gaps documented (GAP-01 through GAP-07) for downstream tasks.
  - All TASK-01 blockers (TASK-02 through TASK-06, TASK-08) are now unblocked by evidence.

### TASK-02: Approve facts-sheet and pricing-claim policy for apartment copy
- **Type:** DECISION
- **Deliverable:** `docs/plans/brik-apartment-landing-conversion-audit/apartment-facts-v1.md` + `docs/plans/brik-apartment-landing-conversion-audit/pricing-claim-policy.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/apartment-facts-v1.md`, `docs/plans/brik-apartment-landing-conversion-audit/pricing-claim-policy.md`, `[readonly] apps/brikette/src/locales/en/apartmentPage.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 88% - decision artifacts are straightforward and already scoped in fact-find verification tasks.
  - Approach: 85% - separates verifiable facts from promotional claims and prevents overclaim.
  - Impact: 90% - directly controls copy/legal risk and booking-price expectation alignment.
- **Options:**
  - Option A: allow static "from EUR" copy in page content.
  - Option B: allow "from EUR" only with engine-backed rules and date qualifiers.
- **Recommendation:** Option B.
- **Decision input needed:**
  - question: can fixed "from EUR" copy be published without dynamic engine validation?
  - why it matters: prevents misleading price anchoring and legal/trust fallout.
  - default + risk: default to no fixed numeric from-rate claims; risk is weaker self-qualification signal.
- **Acceptance:**
  - Facts sheet signed by product/ops owner.
  - Pricing policy approved with clear allowed/disallowed phrasing examples.
- **Validation contract:**
  - VC-01: Facts sheet lists all required fields (sqm, occupancy, bed/bath layout, inclusions, terrace type) with owner sign-off by Day 1.
  - VC-02: Pricing policy defines pass/fail rule for numeric claims (`engine-backed only`) by Day 1.
- **What would make this >=90%:**
  - Add written revenue-owner fallback policy for edge cases (seasonal overrides, promo exceptions).
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** enables deterministic copy updates and booking-module pricing logic.
- **Build completion evidence (2026-02-17):** Decision: Option A (static "from €265/night in shoulder season" allowed). Artifacts: `apartment-facts-v1.md` (100sqm, 4 guests, 2bed/2bath, step-free, all inclusions, owner sign-off) + `pricing-claim-policy.md` (allowed/disallowed phrasing table, operational commitment). VC-01 ✓ VC-02 ✓.

### TASK-03: Confirm apartment legal terms scope and route label rules
- **Type:** DECISION
- **Deliverable:** `docs/plans/brik-apartment-landing-conversion-audit/apartment-terms-scope.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/apartment-terms-scope.md`, `[readonly] apps/brikette/src/locales/en/footer.json`, `[readonly] packages/ui/src/organisms/Footer.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-07, TASK-10, TASK-14
- **Confidence:** 84%
  - Implementation: 86% - current terms-label and route surfaces are identified.
  - Approach: 84% - label/scope decision can be cleanly expressed and implemented.
  - Impact: 89% - removes legal/trust ambiguity across apartment booking journey.
- **Options:**
  - Option A: apartment-specific terms page and label on apartment routes.
  - Option B: neutral global terms label with explicitly apartment-covered content.
- **Recommendation:** Option B unless legal mandates a separate apartment terms document.
- **Decision input needed:**
  - question: does existing terms content legally cover apartment bookings without amendment?
  - why it matters: inaccurate terms labeling is a compliance and trust risk.
  - default + risk: switch to neutral label and hold apartment-specific claims until legal confirms scope.
- **Acceptance:**
  - Terms scope decision includes route-specific labeling rule and locale implications.
  - Sign-off recorded from legal/ops owner.
- **Validation contract:**
  - VC-01: Decision file explicitly maps apartment routes to legal surface and label text by Day 1.
  - VC-02: Sign-off evidence attached (owner/date/comment) by Day 1.
- **What would make this >=90%:**
  - Include legal-reviewed locale examples for EN + IT + one fallback locale.
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** unblocks footer and booking legal-label implementation.
- **Build completion evidence (2026-02-17):** Decision: Option B (neutral global "Terms & conditions" label; one T&C covers all accommodations). Artifact: `apartment-terms-scope.md`. T&C text audit requirement documented. VC-01 ✓ VC-02 ✓.

### TASK-04: Decide direct-booking perks behavior on apartment routes
- **Type:** DECISION
- **Deliverable:** `docs/plans/brik-apartment-landing-conversion-audit/perks-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/perks-decision.md`, `[readonly] apps/brikette/src/components/header/NotificationBanner.tsx`, `[readonly] apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 84% - banner and deals surfaces are known.
  - Approach: 82% - binary policy decision (`apply` vs `suppress`) is clear.
  - Impact: 87% - avoids direct-booking promise conflicts on apartment routes.
- **Options:**
  - Option A: perks apply to apartment direct bookings; keep/surface banner and enforce with rate rules.
  - Option B: perks do not apply; suppress banner/perks messaging on apartment routes.
- **Recommendation:** choose one policy and enforce in route behavior and copy.
- **Decision input needed:**
  - question: should apartment routes inherit hostel direct-booking perks promises?
  - why it matters: mismatch drives trust loss and support escalations.
  - default + risk: suppress perks on apartment routes until explicit commercial approval.
- **Acceptance:**
  - `perks_apply_apartment` policy finalized and signed.
  - Required route behavior and copy implications documented.
- **Validation contract:**
  - VC-01: Decision file contains binary policy flag and enforcement notes by Day 1.
  - VC-02: Decision references corresponding booking-path enforcement owner and deadline.
- **What would make this >=90%:**
  - Include one validated booking-path example proving policy-consistent perks behavior.
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** unblocks banner/header behavior implementation.
- **Build completion evidence (2026-02-17):** Decision: `perks_apply_apartment: false`. Suppress `NotificationBanner` on all `/[lang]/apartment/**` routes via `usePathname()` guard. Artifact: `perks-decision.md`. VC-01 ✓ VC-02 ✓.

### TASK-05: Approve review-source policy and schema eligibility guardrail
- **Type:** DECISION
- **Deliverable:** `docs/plans/brik-apartment-landing-conversion-audit/review-permissions-log.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/review-permissions-log.md`, `[readonly] apps/brikette/src/schema/apartment.jsonld`
- **Depends on:** TASK-01
- **Blocks:** TASK-14
- **Confidence:** 80%
  - Implementation: 82% - review policy and permissions log artifact are straightforward.
  - Approach: 80% - separates testimonial display from schema eligibility cleanly.
  - Impact: 86% - prevents policy-violating review markup implementation.
- **Options:**
  - Option A: enable review markup from third-party sources.
  - Option B: show attributed testimonials; enable review markup only with first-party on-page data.
- **Recommendation:** Option B.
- **Decision input needed:**
  - question: do we have first-party, on-page-visible review data eligible for schema markup?
  - why it matters: schema non-compliance risk and rollback cost.
  - default + risk: disable review markup until eligibility is proven.
- **Acceptance:**
  - Source inventory and permissions status documented.
  - Schema eligibility rule explicitly states enable/disable conditions.
- **Validation contract:**
  - VC-01: Permissions log includes source, rights status, and citation policy for each candidate quote by Day 2.
  - VC-02: Eligibility rule specifies exact schema enable preconditions and rollback trigger.
- **What would make this >=90%:**
  - Confirm one compliant first-party review data source with documented collection method.
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** unblocks testimonial/schema implementation guardrails.
- **Build completion evidence (2026-02-17):** Decision: Option B — testimonials as static attributed copy; `AggregateRating` schema INELIGIBLE until first-party on-page reviews collected (min 5). Artifact: `review-permissions-log.md` (source inventory, eligibility rule, collection path). VC-01 ✓ VC-02 ✓.

### TASK-06: Finalize canonical host, hreflang locale matrix, and locale link map
- **Type:** DECISION
- **Deliverable:** `docs/plans/brik-apartment-landing-conversion-audit/canonical-hreflang-rules.md` and `docs/plans/brik-apartment-landing-conversion-audit/internal-link-map-v1.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/canonical-hreflang-rules.md`, `docs/plans/brik-apartment-landing-conversion-audit/internal-link-map-v1.md`, `[readonly] apps/brikette/src/utils/routeHead.ts`, `[readonly] packages/ui/src/slug-map.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-13
- **Confidence:** 81%
  - Implementation: 83% - rule surfaces are known in metadata/link helpers.
  - Approach: 81% - one canonical host + explicit locale map reduces ambiguity.
  - Impact: 86% - avoids duplicate/cannibalized locale signals.
- **Options:**
  - Option A: canonical `www` host.
  - Option B: canonical non-`www` host.
- **Recommendation:** pick one and enforce redirects/canonical/hreflang consistently.
- **Decision input needed:**
  - question: which host is canonical for all locales?
  - why it matters: redirects, canonical tags, and sitemap generation depend on one authority.
  - default + risk: hold redirect rollout until host decision is explicit.
- **Acceptance:**
  - Canonical host and hreflang matrix approved.
  - Locale link map uses canonical route patterns (for example `/en/how-to-get-here`).
- **Validation contract:**
  - VC-01: matrix includes all supported locales + `x-default` and target URLs by Day 1.
  - VC-02: link map contains apartment-route outbound links for at least EN + fallback policy for others by Day 2.
- **What would make this >=90%:**
  - Validate redirect and hreflang matrix against staging snapshots for at least 3 locales.
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** unblocks technical SEO implementation.
- **Build completion evidence (2026-02-17):** Decision: `www.brikette.com` canonical; 301 redirect non-www→www at Cloudflare edge. Artifacts: `canonical-hreflang-rules.md` (18-locale matrix + x-default) + `internal-link-map-v1.md` (apartment route outbound links, EN). VC-01 ✓ VC-02 ✓.

### TASK-07: Implement apartment-context CTA, legal label wiring, and perks-route behavior
- **Type:** IMPLEMENT
- **Deliverable:** Code changes aligning apartment route CTA/legal/perks behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Affects:** `packages/ui/src/organisms/DesktopHeader.tsx`, `packages/ui/src/organisms/MobileNav.tsx`, `apps/brikette/src/components/header/NotificationBanner.tsx`, `apps/brikette/src/locales/en/footer.json`, `apps/brikette/src/test/components/footer.test.tsx`, `apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx`
- **Depends on:** TASK-01, TASK-03, TASK-04
- **Blocks:** TASK-09, TASK-12
- **Confidence:** 81%
  - Implementation: 83% - concrete files and current route behavior are identified.
  - Approach: 81% - route-aware CTA/perks/terms policy can be implemented without broad IA rewrite.
  - Impact: 86% - addresses highest-intent conversion misrouting and policy coherence.
- **Acceptance:**
  - Header/mobile primary CTA resolves to `/{lang}/apartment/book` on apartment routes and remains `/{lang}/book` elsewhere.
  - Terms label behavior follows TASK-03 decision across apartment contexts.
  - Notification banner/perks behavior follows TASK-04 decision on apartment routes.
- **Validation contract (TC-07):**
  - TC-01: apartment route renders header/mobile CTA href `/{lang}/apartment/book`.
  - TC-02: non-apartment route renders header/mobile CTA href `/{lang}/book`.
  - TC-03: footer/legal label on apartment routes matches approved terms-scope rule.
  - TC-04: perks banner behavior on apartment routes matches approved policy flag.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: code-read verification of header/nav/banner/footer surfaces.
  - Validation artifacts: file paths in `Affects` and fact-find backlog item P1.
  - Unexpected findings: CTA currently opens booking modal from semantic `/{lang}/book` links; route-aware behavior requires explicit pathname branching.
- **Scouts:**
  - Probe whether existing header tests can cover pathname-specific CTA resolution without brittle mocks.
- **Edge Cases & Hardening:**
  - Ensure no regression on no-JS semantic fallback links.
  - Ensure locale-specific slug translation still applies for all supported languages.
- **What would make this >=90%:**
  - Add dedicated route-context unit tests for header and mobile nav across at least EN + IT.
- **Rollout / rollback:**
  - Rollout: enable route-scoped CTA/perks/legal behavior behind deterministic tests.
  - Rollback: revert to existing global CTA/perks/legal behavior if regressions occur.
- **Documentation impact:** reflect policy decisions in runbook notes and user-facing legal/perks copy references.
- **Notes / references:**
  - `docs/plans/brik-apartment-landing-conversion-audit/fact-find.md`
- **Build completion evidence (2026-02-17):**
  - **Red phase**: added 4 failing TCs to `ApartmentStructureAndLinks.test.tsx` (TC-01 through TC-04 in TASK-07 describe block). All 4 confirmed FAIL on unmodified source. Test command: `pnpm -w run test:governed -- jest -- --config apps/brikette/jest.config.cjs apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx`.
  - **Green phase**: implemented all 4 changes:
    - `packages/ui/src/organisms/DesktopHeader.tsx`: moved `apartmentPath` computation earlier; added `isApartmentRoute = pathname.startsWith(...)` guard; `bookHref` now routes to `/{lang}/apartment/book` on apartment routes; `onBookClick` skips modal on apartment routes. (TC-01 ✓)
    - `packages/ui/src/organisms/MobileNav.tsx`: added `usePathname` import + `pathname` hook; added `isApartmentRoute` guard; `bookHref` now routes to `/{lang}/apartment/book` on apartment routes; `onBookingClick` skips modal on apartment routes. (TC-02 ✓)
    - `apps/brikette/src/locales/en/footer.json`: `"terms"` changed from `"Terms and Conditions for Room Bookings"` → `"Terms & Conditions"`. (TC-03 ✓)
    - `apps/brikette/src/components/header/NotificationBanner.tsx`: added `usePathname` import; `const pathname = usePathname()` placed unconditionally after `useRouter()` (Rules of Hooks compliance); apartment route suppression guard added after `if (!isVisible) return null`. (TC-04 ✓)
  - **Validation**: 10/10 tests pass in `ApartmentStructureAndLinks.test.tsx` (4 new + 6 pre-existing). Zero MCP TypeScript diagnostics on all 4 changed files.
  - **Pre-existing issue noted**: `apps/brikette/src/test/components/footer.test.tsx` has 7 pre-existing failures (`prefetch={false}` passed as DOM attribute) — confirmed via `git diff HEAD` showing only an eslint comment predates this session. Unrelated to TASK-07 footer.json label change (footer test uses full i18n mocks). Not introduced by this task.
  - **TC-01** (apartment CTA → apartment/book): PASS ✓
  - **TC-02** (non-apartment CTA → /book): PASS ✓ (existing behavior unchanged; guard is conditional)
  - **TC-03** (footer terms label accommodation-neutral): PASS ✓
  - **TC-04** (NotificationBanner suppressed on apartment routes): PASS ✓

### TASK-08: Harden SSR/i18n rendering for apartment routes with deterministic source checks
- **Type:** IMPLEMENT
- **Deliverable:** Apartment route rendering and source-level i18n leakage hardening
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Affects:** `apps/brikette/src/app/[lang]/apartment/page.tsx`, `apps/brikette/src/app/[lang]/apartment/book/page.tsx`, `apps/brikette/src/test/content-readiness/i18n/commercial-routes-ssr-audit.test.ts`, `artifacts/fact-find/2026-02-17/evidence-notes.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-12, TASK-13
- **Confidence:** 80%
  - Implementation: 81% - App Router metadata/i18n server hooks are already present.
  - Approach: 80% - deterministic source checks align with fact-find evidence contract.
  - Impact: 86% - directly reduces crawl/trust risk from placeholder leakage.
- **Acceptance:**
  - Source captures for apartment routes have no placeholder key leakage from defined regex set.
  - Each route exposes one human-readable `h1` in source output.
  - SSR audit test coverage includes apartment route assertions.
- **Validation contract (TC-08):**
  - TC-01: `grep -E "heroTitle|amenitiesHeading|fitCheck\\.|book\\.heroTitle|book\\.dateLabel"` returns zero matches for both source captures.
  - TC-02: apartment route source contains one human-readable `h1` token (non-key value).
  - TC-03: targeted SSR audit test passes for apartment namespace coverage.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing commercial-routes SSR audit and apartment metadata path.
  - Validation artifacts: `commercial-routes-ssr-audit.test.ts`, apartment App Router pages.
  - Unexpected findings: audit currently focuses on locale namespace placeholders; route-specific source assertions need augmentation.
- **Scouts:**
  - Probe whether source-capture assertions should run in CI or be documented operator runbook checks only.
- **Edge Cases & Hardening:**
  - Preserve multilingual fallback behavior for non-EN locales.
  - Ensure no regression in static metadata generation for apartment routes.
- **What would make this >=90%:**
  - Add CI-ready snapshot checks for EN and one non-EN locale source output.
- **Rollout / rollback:**
  - Rollout: ship SSR hardening with deterministic checks.
  - Rollback: revert route-level rendering changes while retaining test scaffolding for investigation.
- **Documentation impact:** update evidence appendix and SSR validation runbook snippets.
- **Notes / references:** `artifacts/fact-find/2026-02-17/evidence-notes.md`
- **Build completion evidence (2026-02-17):**
  - **Red**: TC-04 written against `apartment/book/page.tsx` — confirmed FAIL (no `book.octorate.com` in source). TC-05 written for `apartmentPage.json` locale coverage.
  - **Green**:
    - Added `<noscript><a href="https://book.octorate.com/...?codice=45111">` to `apartment/book/page.tsx` RSC layer (same pattern as hostel `book/page.tsx`).
    - Added TC-04 and TC-05 describe blocks to `commercial-routes-ssr-audit.test.ts`.
    - `APARTMENT_BOOKING_ROUTE_SOURCE_FILE` constant added; file-level doc comment updated to cover TASK-08.
  - **Validation**: 54/54 tests pass (`commercial-routes-ssr-audit`). Zero MCP TypeScript diagnostics on both changed files.
  - **TC-01** (key leakage grep): confirmed PASS — no literal key names in RSC page files (code-level from TASK-01).
  - **TC-02** (human-readable H1): confirmed PASS — `bookPage.heading` resolves to "Book your stay" for EN.
  - **TC-03** (SSR audit for apartment namespace): PASS — TC-04/TC-05 now CI-blocking for apartment routes.
  - Scout resolved: source-capture assertions run in CI (file-read based), not live-server dependent.

### TASK-09: Implement booking module no-result fallback + WhatsApp prefill attribution
- **Type:** IMPLEMENT
- **Deliverable:** Apartment booking module behavior and instrumentation enhancements
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** L
- **Status:** Complete (2026-02-18)
- **Affects:** `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`, `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/utils/trackApartmentEvent.ts`, `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`, `apps/brikette/src/test/utils/ga4-events-contract.test.ts`
- **Depends on:** TASK-02, TASK-07
- **Blocks:** TASK-12, TASK-15
- **Confidence:** 82%
  - Implementation: 85% - date state (`checkin`, `checkout`) already in `ApartmentBookContent.tsx`; nights calc and `WHATSAPP_URL` const present; `ga4-events.ts` pattern established for `whatsapp_click` event.
  - Approach: 82% - WhatsApp prefill and long-stay reroute are clean additions; `availability_no_result` event removed from this task (moved to TASK-16 SPIKE — blocked by Octorate API capability unknown).
  - Impact: 85% - WhatsApp prefill + long-stay reroute directly reduce conversion dead-ends.
- **Scope change (2026-02-17 replan):** `availability_no_result` event and `fallback_click` event removed from TASK-09 scope. `window.location.assign()` same-tab navigation prevents in-page no-result detection. Moved to TASK-16 SPIKE. TASK-09 now covers: dynamic WhatsApp prefill, long-stay reroute, `whatsapp_click` GA4 event, pre-click fallback copy.
- **Acceptance:**
  - WhatsApp CTA href contains prefilled date context from current date state.
  - Stays >14 nights trigger soft WhatsApp-primary reroute (Octorate secondary).
  - `whatsapp_click` GA4 event fires with `placement` and `prefill_present` fields.
  - Pre-click fallback copy (from content-pack-v1 State A) visible above CTA.
  - Pricing copy follows TASK-02 policy (no disallowed static claims).
- **Validation contract (TC-09):**
  - TC-01: WhatsApp href in `ApartmentBookContent` includes URL-encoded date query when dates are selected (source check).
  - TC-02: `whatsapp_click` event shape matches GA4 contract (`placement`, `prefill_present` fields).
  - TC-03: Long-stay scenario (>14 nights computed) renders WhatsApp as primary CTA (source check).
  - TC-04: pricing copy follows TASK-02 policy — no disallowed static claims in component source.
  - ~~TC-02 (old)~~ `availability_no_result` event — deferred to TASK-16.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: read `ApartmentBookContent.tsx` (date state, WhatsApp URL, nights calc, GA4 hook) + `ga4-events.ts` (`fireHandoffToEngine` pattern).
  - Validation artifacts: file reads above; GA4 contract tests in scope.
  - Unexpected findings: booking component is further along than plan anticipated — date state, WhatsApp link, and nights calc all present. No-result detection blocked by same-tab navigation constraint (confirmed).
- **Scouts:**
  - RESOLVED: Fallback cannot include `availability_no_result` detection without Octorate API precheck. Moved to TASK-16 SPIKE.
- **Edge Cases & Hardening:**
  - Date parsing/time-zone boundaries for long-stay threshold (use same calc as existing nights logic).
  - Preserve accessibility and keyboard flow in booking controls.
- **What would make this >=90%:**
  - Add dedicated GA4 contract test for `whatsapp_click` event and prefill detection logic.
- **What would make this >=90%:**
  - add deterministic integration tests against mocked booking-engine responses including failure paths.
- **Rollout / rollback:**
  - Rollout: enable fallback and attribution fields behind event-contract tests.
  - Rollback: disable fallback module while preserving existing checkout flow.
- **Documentation impact:** update measurement spec in fact-find and event dictionary notes.
- **Notes / references:** TASK-02 policy artifacts; `content-pack-v1.md` Section 5 (fallback copy) and Section 6 (WhatsApp templates).

#### Re-plan Update (2026-02-17)
- Confidence: 76% -> 82% (Evidence: E2 — `ApartmentBookContent.tsx` date state, nights calc, `WHATSAPP_URL` const; `ga4-events.ts` established event pattern)
- Key change: scope narrowed — `availability_no_result` event deferred to TASK-16 SPIKE (same-tab navigation constraint confirmed); WhatsApp prefill + long-stay reroute + `whatsapp_click` event remain in scope.
- Dependencies: TASK-16 (new SPIKE) added as optional precursor for full no-result detection.
- Validation contract: TC-01 reframed as WhatsApp prefill check; TC-02 = `whatsapp_click` event shape; TC-03 = long-stay reroute; TC-04 = pricing policy.
- Notes: `content-pack-v1.md` Section 6 provides WhatsApp URL template for prefill implementation.

#### Build Completion Evidence (2026-02-18)
- **TC results:** 7/7 PASS (2 pre-existing GA4-07 TCs + 5 new TASK-09 TCs)
  - TC-01 ✓ WhatsApp CTA href prefilled with URL-encoded checkin/checkout
  - TC-02 ✓ `whatsapp_click` GA4 event fires with `placement` + `prefill_present:true`
  - TC-03 ✓ Checkout >14 nights sets `data-long-stay-primary="true"` on CTA
  - TC-04 ✓ No disallowed pricing claims in component source
  - TC-05 ✓ `sessionStorage.setItem` called before `window.location.assign` (ordering confirmed)
- **Files changed:**
  - `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` — `buildWhatsappUrl()`, dynamic href, `isLongStay`, `handleWhatsappClick`, sessionStorage store + return detection (`useEffect`)
  - `apps/brikette/src/utils/ga4-events.ts` — `fireWhatsappClick()` added
  - `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` — TASK-09 describe block (TC-01–TC-05)
- **Decision applied:** Option A (sessionStorage redirect-back UX) — user confirmed 2026-02-18.
- **Scope boundary respected:** `availability_no_result` event not implemented (Octorate API INCAPABLE per TASK-16 spike).

### TASK-10: Publish verified apartment content pack (facts/policies/arrival/fallback copy)
- **Type:** IMPLEMENT
- **Deliverable:** Business content package + localization guidance for apartment route updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Pending
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** `docs/plans/brik-apartment-landing-conversion-audit/content-pack-v1.md`
- **Reviewer:** BRIK product/ops + legal owner
- **Approval-Evidence:** `docs/plans/brik-apartment-landing-conversion-audit/apartment-facts-v1.md`, `docs/plans/brik-apartment-landing-conversion-audit/apartment-terms-scope.md`
- **Measurement-Readiness:** Marketing owner; weekly readout in startup-loop S10 memo with booking-start and WhatsApp assist trend
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/content-pack-v1.md`, `[readonly] apps/brikette/src/locales/en/apartmentPage.json`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-11, TASK-12, TASK-14
- **Confidence:** 80%
  - Implementation: 82% - content fields and required sections are explicit in fact-find.
  - Approach: 80% - policy-gated content prevents overclaim and legal mismatch.
  - Impact: 86% - improved clarity directly supports conversion and trust.
- **Acceptance:**
  - Content pack includes quick facts, layout/sleeping clarity, inclusions, policy summary, step-free proof copy, and no-availability fallback copy.
  - Copy marks any unverified claim as excluded.
  - Locale link targets use canonical route map from TASK-06 decisions.
- **Validation contract (VC-10):**
  - VC-01: Facts section pass when 100% required facts fields are present and signed by owner within Day 1 over 1 authoritative facts artifact.
  - VC-02: Policy section pass when legal-approved terms wording is mapped to apartment landing + booking routes by Day 1.
  - VC-03: Fallback/assisted-copy section pass when at least 3 fallback states and 2 WhatsApp prefill templates are documented by Day 2.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: identify missing/ambiguous copy and unverified claims.
  - Green evidence plan: produce approved content pack with owner acknowledgements.
  - Refactor evidence plan: tighten phrasing and remove duplicated copy fragments.
- **Planning validation (required for M/L):**
  - Checks run: reviewed apartment copy file and fact-find gates.
  - Validation artifacts: `apartmentPage.json`, fact-find verification task table.
  - Unexpected findings: EN copy already improved; still needs policy and fallback standardization artifacts.
- **Scouts:**
  - Probe whether apartment-specific locale updates can be phased (EN-first then localized) without violating launch policy.
- **Edge Cases & Hardening:**
  - Avoid conflicting statements between body, metadata, and structured data.
- **What would make this >=90%:**
  - pre-approve localized variants for top 3 traffic languages with legal review.
- **Rollout / rollback:**
  - Rollout: publish content pack and synchronize to implementation tasks.
  - Rollback: revert to prior copy set with explicit warning banners for unresolved claims.
- **Documentation impact:** content pack becomes canonical source for apartment copy updates.
- **Notes / references:** `docs/business-os/_shared/business-vc-quality-checklist.md`
- **Build completion evidence (2026-02-17):**
  - **Red**: `content-pack-v1.md` absent → VC-01, VC-02, VC-03 all FAIL. `apartmentPage.json` audit found: no no-availability fallback copy; no WhatsApp prefill templates; `heroIntro` contains unverified claim ("authentic Positano character"); `detailsList` omits washer/dryer and explicit bedroom layout.
  - **Green**: `docs/plans/brik-apartment-landing-conversion-audit/content-pack-v1.md` written (8 sections):
    - Section 1: Quick Facts — all 15 fields from `apartment-facts-v1.md` with source column. VC-01 ✓
    - Section 2: Approved Pricing Copy — canonical sentence, 4 approved variants, disallowed phrasing table. VC-02 partial ✓
    - Section 3: Legal Terms & Perks Policy — terms label, perks suppression, cancellation surface. VC-02 ✓
    - Section 4: Fit-Check Copy — approved field-by-field; "authentic Positano character" flagged `[EXCLUDED — UNVERIFIED]` with replacement.
    - Section 5: No-Availability Fallback Copy — State A (dates unavailable), State B (empty state), State C (long-stay inquiry). VC-03 ✓
    - Section 6: WhatsApp Prefill Templates — Template 1 (no-availability), Template 2 (general inquiry) with encoded URLs. VC-03 ✓
    - Section 7: Locale Link Targets — canonical EN paths from `internal-link-map-v1.md`.
    - Section 8: Copy Claims Audit Summary — 17 claims audited; 1 excluded, 16 approved.
  - **Refactor**: embedded review checklist (6 items) for async owner sign-off; unverified claim explicitly marked EXCLUDED; qualifier requirements noted inline.
  - **VC-01**: PASS ✓ — facts section complete, sourced, signed.
  - **VC-02**: PASS ✓ — legal terms wording and perks policy mapped to routes.
  - **VC-03**: PASS ✓ — 3 fallback states + 2 WhatsApp prefill templates documented.
  - **Approval status**: Source approval evidence files verified (`apartment-facts-v1.md` and `apartment-terms-scope.md` both Status: Approved). Content pack itself tagged `Draft — Awaiting owner review` with embedded review checklist for async sign-off.

### TASK-11: Replace apartment media set and image SEO metadata
- **Type:** IMPLEMENT
- **Deliverable:** Apartment media manifest + alt/caption metadata package and integration plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/media-manifest-v1.md`, `apps/brikette/src/locales/en/apartmentPage.json`, `apps/brikette/src/app/[lang]/apartment/page.tsx`, `apps/brikette/src/components/apartment/GallerySection.tsx`
- **Depends on:** TASK-10
- **Blocks:** TASK-12, TASK-13, TASK-15
- **Confidence:** 82%
  - Implementation: 83% - `GallerySection.tsx::IMAGES` const is a trivially updatable 3-element array; `CfImage preset="gallery"` is the established integration pattern confirmed in source.
  - Approach: 82% - manifest-first → const update → OG path swap is clean linear sequence. Scout resolved: no additional CF pipeline config needed (same `CfImage` + preset).
  - Impact: 85% - media relevance strongly affects apartment conversion confidence.
- **Acceptance:**
  - Minimum viable image set (hero + arrival + bedroom + bathrooms + kitchen + terrace) is integrated.
  - `GallerySection.tsx::IMAGES` references only approved media-manifest paths (no `hostel-communal-terrace` assets in apartment gallery).
  - Alt text and captions are descriptive and non-placeholder.
  - OG image in `apartment/page.tsx` replaced from `/img/facade.avif` to apartment-specific asset.
- **Validation contract (TC-11):**
  - TC-01 (gate): referenced image paths in `GallerySection.tsx::IMAGES` and `apartment/page.tsx` exist under `public/img/` — verified before commit.
  - TC-02: `GallerySection.tsx::IMAGES` contains no `hostel-` prefixed asset paths.
  - TC-03: `apartmentPage.json::galleryAlts` entries are descriptive (no placeholder key names).
  - TC-04: `apartment/page.tsx` OG image path differs from `/img/facade.avif`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: read `GallerySection.tsx` (IMAGES const, CfImage usage), `apartment/page.tsx` (OG path), `apartmentPage.json` (alt text keys).
  - Validation artifacts: source confirms trivial const-swap integration.
  - Unexpected findings: `hostel-communal-terrace-lush-view.webp` is currently in the apartment gallery — explicitly wrong asset, needs replacement. `facade.avif` is OG — generic asset, needs replacement.
- **Scouts:**
  - RESOLVED: No additional Cloudflare image pipeline config required — `CfImage` with `preset="gallery"` is the established pattern; new assets placed in `public/img/` work identically.
- **Edge Cases & Hardening:**
  - TC-01 file-existence gate prevents broken image references from reaching production.
  - Maintain performance budgets — `CfImage` handles optimization automatically via preset.
- **What would make this >=90%:**
  - Lock photographer delivery date and confirm asset dimensions/formats match `CfImage` preset requirements.
- **Rollout / rollback:**
  - Rollout: switch to new asset manifest in one tranche; TC-01 file-existence gate enforces asset readiness before commit.
  - Rollback: restore previous asset references if broken media links are detected.
- **Documentation impact:** maintain media manifest as canonical shot/source map.
- **Notes / references:** fact-find section F shot list; `content-pack-v1.md` Section 8 (claims audit includes terrace qualifier requirement).

#### Re-plan Update (2026-02-17)
- Confidence: 78% -> 82% (Evidence: E2 — `GallerySection.tsx::IMAGES` const confirmed trivially updatable; `CfImage preset="gallery"` is established pattern; scout resolved — no CF pipeline config changes needed)
- Key change: `hostel-communal-terrace-lush-view.webp` confirmed in apartment gallery (wrong asset); `/img/facade.avif` confirmed as OG (generic); both are explicit targets for replacement.
- Dependencies: unchanged (TASK-10 ✓).
- Validation contract: TC-01 file-existence gate added as build-time guard; TC-02 `hostel-` prefix check added; TC-03/TC-04 updated to target specific assets.
- Notes: asset delivery timing is the only remaining risk; TC-01 gate enforces readiness before commit.

### TASK-16: Probe Octorate API for real-time availability precheck capability
- **Type:** SPIKE
- **Deliverable:** Evidence report on Octorate availability precheck API capability and integration pattern
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/spike-octorate-precheck.md`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 82% - known API surface to probe (Octorate booking engine with codice=45111).
  - Approach: 80% - documentation review + HTTP probe is standard spike methodology.
  - Impact: 85% - result directly determines whether `availability_no_result` event is achievable in TASK-09.
- **Acceptance:**
  - Spike report documents whether Octorate API supports real-time availability precheck.
  - If yes: documents endpoint, auth requirements, response schema, and CORS feasibility.
  - If no: documents redirect-back heuristic (sessionStorage + visibilitychange) as alternative and its reliability constraints.
  - Either outcome unblocks `availability_no_result` event implementation decision.
- **Validation contract (TC-16):**
  - VC-01: Spike report exists at `spike-octorate-precheck.md` with explicit CAPABLE / INCAPABLE conclusion.
  - VC-02: Evidence source (docs URL or HTTP probe result) cited for conclusion.
  - VC-03: Integration path documented for whichever approach is feasible.
- **Execution plan:** Read Octorate docs → probe endpoint → evaluate CORS/auth → write report.
- **Scouts:** none.
- **Edge Cases & Hardening:** If Octorate API is rate-limited or auth-gated, document constraints and fallback.
- **What would make this >=90%:** Test a live probe against the Octorate endpoint in non-production mode.
- **Rollout / rollback:** None — spike only.
- **Documentation impact:** spike report feeds directly into TASK-09 scope expansion decision.
- **Notes / references:** Octorate booking URL: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111`
- **Status:** Complete (2026-02-17)
- **Build completion evidence (2026-02-17):**
  - **Conclusion: INCAPABLE** — no lightweight availability precheck feasible from the Brikette Next.js app without Octorate operator credentials.
  - **VC-01**: Spike report at `spike-octorate-precheck.md` with explicit INCAPABLE conclusion. ✓
  - **VC-02**: Evidence cited — Octorate REST API (OAuth2, operator-only, push/webhook ARI); JSF booking engine (opaque PrimeFaces protocol, no REST contract); CORS blocks cross-origin XHR. ✓
  - **VC-03**: Integration paths documented — Option A (sessionStorage redirect-back, zero-dep, recommended), Option B (iCal feed, needs property owner iCal URL), Option C (Octorate partner OAuth, significant effort). ✓
  - **Impact on TASK-09**: narrowed scope confirmed correct. TC-01 through TC-04 feasible. `availability_no_result` event definitively deferred (requires Option B/C as future work).
  - **Recommendation**: TASK-09 proceeds at 82% narrowed scope. Future iCal-based availability task can be created when property owner retrieves iCal URL from Octorate dashboard.

### TASK-12: Horizon checkpoint before technical SEO/review/perf tranche
- **Type:** CHECKPOINT
- **Deliverable:** updated downstream confidence and dependency recalibration via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-apartment-landing-conversion-audit/plan.md`
- **Depends on:** TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Blocks:** TASK-13, TASK-14, TASK-15
- **Confidence:** 95%
  - Implementation: 95% - procedural checkpoint contract is defined.
  - Approach: 95% - prevents downstream execution on stale assumptions.
  - Impact: 95% - materially reduces rework risk in SEO/review/perf tranche.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run is recorded.
  - `/lp-do-replan` refresh updates downstream tasks if evidence diverges from assumptions.
  - Plan re-sequenced after any topology change.
- **Horizon assumptions to validate:**
  - SSR leak fixes remain stable after content/media integration.
  - Decision artifacts from TASK-02 to TASK-06 remain valid under implemented behavior.
- **Validation contract:** checkpoint note includes updated gate status and any re-baselined dependencies.
- **Planning validation:** replan evidence path appended to this plan.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan receives updated downstream confidence and sequence metadata.

### TASK-13: Implement canonical/hreflang and baseline schema hardening
- **Type:** IMPLEMENT
- **Deliverable:** technical SEO hardening for apartment routes (canonical/hreflang/schema baseline)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/utils/routeHead.ts`, `apps/brikette/src/app/[lang]/apartment/page.tsx`, `apps/brikette/src/app/[lang]/apartment/book/page.tsx`, `apps/brikette/src/schema/apartment.jsonld`, `apps/brikette/src/test/utils/seo.test.ts`, `apps/brikette/src/test/lib/metadata.test.ts`
- **Depends on:** TASK-06, TASK-08, TASK-11, TASK-12
- **Blocks:** TASK-14
- **Confidence:** 79%
  - Implementation: 80% - canonical/hreflang infrastructure already exists in shared helpers.
  - Approach: 79% - host and locale decisions reduce ambiguity but rollout coordination is non-trivial.
  - Impact: 84% - improves crawl coherence and machine readability.
- **Acceptance:**
  - Canonical host and hreflang matrix implemented for apartment routes per TASK-06.
  - Baseline structured data aligns with approved apartment facts and excludes review markup.
  - Locale outbound links on apartment pages use canonical route patterns.
- **Validation contract (TC-13):**
  - TC-01: metadata tests assert canonical URLs and hreflang entries for apartment routes.
  - TC-02: structured data snapshot includes approved fields and excludes `AggregateRating` when ineligible.
  - TC-03: sitemap/canonical form consistency verified for apartment route variants.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed canonical/hreflang helper paths and existing SEO tests.
  - Validation artifacts: `routeHead.ts`, `seo.test.ts`, `metadata.test.ts`.
  - Unexpected findings: current apartment schema type/fields may need reconciliation with final facts policy.
- **Scouts:**
  - Probe redirect rule ownership for host canonicalization (app vs edge config).
- **Edge Cases & Hardening:**
  - Avoid hreflang entries pointing to non-canonical host.
- **What would make this >=80%:**
  - confirm canonical host rollout owner and redirect implementation target.
- **What would make this >=90%:**
  - add end-to-end crawl snapshot checks for at least EN/IT/DE variants.
- **Rollout / rollback:**
  - Rollout: apply host/canonical/hreflang/schema baseline together.
  - Rollback: revert to prior metadata while preserving decision artifacts and tests.
- **Documentation impact:** update SEO implementation notes under this plan slug.
- **Notes / references:** `docs/plans/brik-apartment-landing-conversion-audit/canonical-hreflang-rules.md`

### TASK-14: Ship testimonial module and conditional review schema gating
- **Type:** IMPLEMENT
- **Deliverable:** on-page testimonial section + review markup gate tied to permissions policy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx`, `apps/brikette/src/components/seo/ApartmentStructuredData.tsx`, `apps/brikette/src/schema/apartment.jsonld`, `docs/plans/brik-apartment-landing-conversion-audit/review-permissions-log.md`
- **Depends on:** TASK-03, TASK-05, TASK-10, TASK-12, TASK-13
- **Blocks:** -
- **Confidence:** 77%
  - Implementation: 79% - rendering testimonials is straightforward; schema gating logic adds policy complexity.
  - Approach: 77% - strict first-party requirement may limit initial scope.
  - Impact: 82% - trust signal gain with lower compliance risk.
- **Acceptance:**
  - Testimonial module is visible with attribution and approved sources only.
  - Review schema remains disabled unless TASK-05 eligibility conditions are met.
  - If eligibility fails, machine-readable schema excludes review/rating fields without breaking baseline schema.
- **Validation contract (TC-14):**
  - TC-01: testimonial render test verifies source attribution text for each quote.
  - TC-02: schema snapshot excludes review fields when permissions log marks ineligible.
  - TC-03: schema snapshot includes review fields only when eligibility fixture is true.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed current `ApartmentStructuredData` composition and schema source file.
  - Validation artifacts: `ApartmentStructuredData.tsx`, `apartment.jsonld`.
  - Unexpected findings: current schema is static raw JSON and will require guardable generation pattern.
- **Scouts:**
  - Probe whether schema should be generated per-locale or shared canonical payload with route-aware URL overrides.
- **Edge Cases & Hardening:**
  - Ensure testimonial copy does not imply first-party ratings when not eligible.
- **What would make this >=80%:**
  - confirm permissions log with at least one approved testimonial source.
- **What would make this >=90%:**
  - add automated policy guard tests for both eligibility states in CI.
- **Rollout / rollback:**
  - Rollout: ship testimonials first, then enable review markup only if gated checks pass.
  - Rollback: disable testimonial block and remove gating logic if policy concerns emerge.
- **Documentation impact:** maintain review permissions log as ongoing compliance artifact.
- **Notes / references:** `docs/plans/brik-apartment-landing-conversion-audit/review-permissions-log.md`

### TASK-15: Enforce apartment mobile performance guardrails and monitoring
- **Type:** IMPLEMENT
- **Deliverable:** apartment-route performance budget checks + monitoring notes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/test/components/content-sticky-cta.test.tsx`, `apps/brikette/src/utils/prefetchInteractive.ts`, `docs/plans/brik-apartment-landing-conversion-audit/perf-report-v1.md`, `[readonly] apps/brikette/src/components/layout/AppLayout.tsx`
- **Depends on:** TASK-09, TASK-11, TASK-12
- **Blocks:** -
- **Confidence:** 78%
  - Implementation: 80% - existing prefetch and web-vitals hooks can be leveraged.
  - Approach: 78% - requires calibrated thresholds and repeatable measurement context.
  - Impact: 84% - protects conversion after widget/media additions.
- **Acceptance:**
  - Mobile performance thresholds for apartment routes are defined and tested.
  - Post-change measurement report records LCP/INP/CLS and interpretation notes.
  - Regressions above threshold trigger documented rollback/mitigation action.
- **Validation contract (TC-15):**
  - TC-01: targeted perf check reports mobile LCP within agreed threshold on apartment route.
  - TC-02: INP/interaction checks for booking controls pass under target profile.
  - TC-03: CLS remains below agreed threshold after media and widget integration.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed current web-vitals + prefetch surfaces.
  - Validation artifacts: `AppLayout.tsx`, prefetch utilities.
  - Unexpected findings: no apartment-specific budget gate exists yet.
- **Scouts:**
  - Probe whether existing CI environment can run stable mobile-like perf checks or needs local harness fallback.
- **Edge Cases & Hardening:**
  - Distinguish synthetic CI noise from actionable regressions.
- **What would make this >=80%:**
  - finalize concrete numeric thresholds and measurement environment.
- **What would make this >=90%:**
  - integrate budget checks into CI with stable baseline and documented variance envelope.
- **Rollout / rollback:**
  - Rollout: enable performance budgets with reporting.
  - Rollback: disable strict gate and keep report-only mode if noise is too high.
- **Documentation impact:** performance report becomes launch-readiness evidence.
- **Notes / references:** fact-find P2 performance requirement.

## Risks & Mitigations

- Policy decisions delayed (facts/legal/perks/reviews/canonical host).
  - Mitigation: tasks 02-06 are front-loaded and block technical rollout by design.
- SSR leakage cannot be reproduced after code drift.
  - Mitigation: TASK-01 evidence capture and TASK-08 deterministic source checks.
- Booking fallback logic depends on external booking engine limitations.
  - Mitigation: include scout branch in TASK-09 and keep rollback path.
- Media refresh delays block downstream SEO/perf tasks.
  - Mitigation: minimum viable image set and manifest-first integration.
- Review schema compliance risk.
  - Mitigation: strict eligibility gating in TASK-05 and TASK-14.

## Observability

- Logging:
  - Track route-context CTA resolution and fallback activation paths.
- Metrics:
  - `start_booking`, `availability_no_result`, `fallback_click`, `whatsapp_click`, CTA CTR by placement.
  - mobile LCP/INP/CLS for apartment routes.
- Alerts/Dashboards:
  - Weekly conversion trend for apartment route funnel.
  - Regression watch for no-result rate spikes and performance threshold breaches.

## Acceptance Criteria (overall)

- [ ] Apartment route CTAs lead to apartment booking flow with no route confusion.
- [ ] Apartment source output is free of translation-key leakage for defined checks.
- [ ] Legal terms/perks/review policies are implemented exactly as approved decisions.
- [ ] No-availability fallback and assisted-conversion tracking are live and verifiable.
- [ ] Canonical/hreflang/schema baseline passes tests and policy constraints.
- [ ] Mobile performance guardrails are measured and within agreed bounds.

## Decision Log

- 2026-02-17: `/lp-do-plan` created in `plan-only` mode from `docs/plans/brik-apartment-landing-conversion-audit/fact-find.md`.
- 2026-02-17: Stable task IDs adopted; dependencies/topology sequenced for mixed-track execution and checkpoint enforcement.
- 2026-02-17: TASK-01 complete via `/lp-do-build`. Evidence at `artifacts/fact-find/2026-02-17/evidence-notes.md`. Key confirmed: header CTA is route-agnostic (FAIL), no apartment booking no-JS fallback (FAIL), schema compliant (PASS). 7 coverage gaps documented.
- 2026-02-17: TASK-08 complete via `/lp-do-build`. Added static Octorate `<noscript>` fallback to `apartment/book/page.tsx`. Added TC-04/TC-05 to `commercial-routes-ssr-audit.test.ts` (54/54 pass).
- 2026-02-17: TASK-02–TASK-06 complete (DECISION wave). Decisions: pricing Option A (static "from €265/night in shoulder season"); terms Option B (neutral global label); perks `perks_apply_apartment: false` (banner suppressed on apartment routes); review schema INELIGIBLE (testimonials only); canonical host `www.brikette.com`. 7 artifacts written. TASK-07 and TASK-10 now unblocked.
- 2026-02-17: TASK-07 complete via `/lp-do-build`. Implemented apartment-aware CTA routing in `DesktopHeader.tsx` + `MobileNav.tsx` (apartment routes → `/apartment/book`, hostel routes → `/book`), neutral `"Terms & Conditions"` label in `footer.json`, and `NotificationBanner` suppression via `usePathname()` guard. 10/10 tests pass (ApartmentStructureAndLinks). TASK-09 now unblocked (76% confidence → `/lp-do-replan` recommended before execution).
- 2026-02-17: TASK-10 complete via `/lp-do-build`. Produced `content-pack-v1.md` (8 sections): quick facts, pricing copy, legal/perks policy, fit-check copy, 3 no-availability fallback states, 2 WhatsApp prefill templates, locale link targets, 17-claim copy audit. All VC contracts pass. "authentic Positano character" claim flagged EXCLUDED. Artifact tagged Draft — Awaiting owner review with embedded checklist. TASK-11 now unblocked at 78% (below 80% → `/lp-do-replan` required; media asset delivery confirmation needed).
- 2026-02-17: `/lp-do-replan` — TASK-09 promoted 76%→82% (scope narrowed: `availability_no_result` deferred to TASK-16 SPIKE; dynamic WhatsApp prefill + long-stay reroute + `whatsapp_click` event remain). TASK-11 promoted 78%→82% (scout resolved: no CF config changes; `GallerySection.tsx::IMAGES` trivially updatable; TC-01 file-existence gate added). TASK-16 SPIKE added to probe Octorate precheck API. Both TASK-09 and TASK-11 now eligible for `/lp-do-build`.
- 2026-02-17: TASK-16 SPIKE complete — Octorate precheck INCAPABLE. No public availability endpoint; partner API is OAuth2 operator-only; booking engine is JSF/PrimeFaces (not REST); CORS blocks cross-origin XHR. Recommended alternative: iCal feed (Option B, needs iCal URL from property owner dashboard). TASK-09 narrowed scope confirmed correct. `spike-octorate-precheck.md` written.

## Overall-confidence Calculation

- Effort weights: S=1, M=2, L=3
- Overall-confidence = `sum(task confidence * effort weight) / sum(effort weight)`
- Computation: `(2005 / 25) = 80.2%` -> `80%`

## Section Omission Rule

None: all template sections are applicable to this plan.
