---
Type: Plan
Status: Active
Domain: Venture-Studio
Workstream: Marketing
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Feature-Slug: skylar-marketing-promotion
Relates-to charter: docs/business-os/business-os-charter.md
Deliverable-Type: marketing-asset
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-channels, /lp-seo
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Skylar Marketing + Promotion (Not-For-Hire Positioning) Plan

## Summary
Align Skylar's public positioning to match the actual strategy: Skylar builds and operates its own ventures and is not for hire.

This plan ships a Release 1 copy-and-assets pack:
- remove for-hire language and partner-inviting phrasing from the Skylar site copy,
- publish an audience-split promotion pack (finance / supplier / customer) using a single contact endpoint,
- define the measurement loop (manual outreach log now; UTMs/doors later).

Release 2 (doors + portfolio/loop sections) is explicitly deferred behind a checkpoint.

## Goals
- Make "not for hire" explicit (at least once on EN home first fold).
- Remove service framing ("How we work with you", "service delivery", "tools partners can reuse").
- Ship usable outbound templates for finance and suppliers (same contact endpoint).
- Keep all claims bold but defensible via the claim/proof ledger.

## Non-goals
- Building new pages/doors in Release 1.
- Adding on-site analytics tooling in Release 1.
- Naming internal in-build streams publicly (default: generic until a later decision).

## Constraints & Assumptions
- Constraints:
  - Single shared contact endpoint for now.
  - No fabricated proof (logos, revenue, testimonials, case studies).
  - Skylar is deployed as a static site (Cloudflare Pages). Evidence: `apps/skylar/AGENTS.md`.
- Assumptions:
  - Release 1 focuses on EN copy + shared outbound assets; IT/ZH alignment is planned but can lag if needed.

## Fact-Find Reference
- Related brief: `docs/plans/skylar-marketing-promotion/fact-find.md`
- Key findings:
  - EN first fold is driven by `SkylarTypoHome` (`apps/skylar/src/components/typo-home/EnglishHome.tsx`), not the generic hero.
  - For-hire leaks exist in EN/IT copy: `people.en.hero.body`, `people.it.hero.body`, and partner reuse language in `realEstate.en.stack.cards.experiments.body`, `realEstate.it.stack.experimentation.body`.
  - No analytics hooks found in `apps/skylar/src` (repo search for common providers).

## Existing System Notes
- Key modules/files:
  - `apps/skylar/i18n/en.json` - EN marketing copy (primary Release 1 target).
  - `apps/skylar/i18n/it.json` - IT copy contains "servizi" / "service delivery" phrasing.
  - `apps/skylar/i18n/zh.json` - ZH copy uses "services" labeling in places.
  - `apps/skylar/src/components/typo-home/EnglishHome.tsx` - EN home surface.
  - `apps/skylar/src/app/[lang]/products/components/EnglishProductsPage.tsx` - EN products surface.
  - `apps/skylar/src/app/[lang]/people/page.tsx` - EN people hero uses `people.en.*` keys.
  - `apps/skylar/src/app/[lang]/real-estate/page.tsx` - EN real-estate surface.
- Validation baseline (pre-change):
  - `pnpm --filter @apps/skylar typecheck` passes (includes `@acme/i18n` build).
  - `pnpm --filter @apps/skylar test -- src/test/seo/seo-integration.test.ts` passes.

## Proposed Approach
Release 1 is intentionally copy-and-assets only.

- Update EN i18n keys that drive the visible surfaces (home intro, story sections, products hero/distribution, people hero, real estate experimentation card).
- Remove service-y phrasing from the EN long-form keys even if they are not currently rendered, so the repo cannot regress into for-hire language later.
- Publish a promotion pack as repo artifacts (markdown + outreach-log template) split by audience.

Release 2 is deferred:
- Add explicit audience doors (finance/customer/supplier) on the home page.
- Optionally add "Loop" and "Portfolio" sections and UTMs.

## Active tasks
See `## Tasks` section for the active task list.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Release 1 EN copy: not-for-hire positioning + remove service/partner language | 84% | M | Complete (2026-02-14) | - | TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Release 1 promotion assets: outbound templates + outreach log (finance/supplier/customer) | 90% | S | Complete (2026-02-14) | - | TASK-05 |
| TASK-03 | IMPLEMENT | IT alignment: remove services/service-delivery + partner reuse language (minimal pass) | 75% | S | Pending | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | ZH alignment: remove partner/service framing (minimal pass) | 72% | S | Pending | TASK-01 | TASK-05 |
| TASK-05 | CHECKPOINT | Horizon checkpoint: reassess Release 2 doors + remaining locale work | 95% | S | Pending | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Release 2 (deferred): add audience doors + UTMs + optional Loop/Portfolio section | 70% | M | Pending | TASK-05 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide
Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02 | - | EN copy updates can ship independently of outbound assets. |
| 2 | TASK-03, TASK-04 | Wave 1: TASK-01 | Locale alignment after EN locks. |
| 3 | TASK-05 | Wave 1-2 | Checkpoint before any Release 2 code/layout work. |
| 4 | TASK-06 | Wave 3: TASK-05 | Deferred until checkpoint passes. |

**Max parallelism:** 2 (Wave 1) | **Critical path:** TASK-01 -> TASK-05 -> TASK-06 (4 waves) | **Total tasks:** 6

## Tasks

### TASK-01: Release 1 EN copy (not for hire + remove service/partner language)
- **Status:** Complete (2026-02-14)
- **Type:** IMPLEMENT
- **Deliverable:** Code change - updated EN copy in `apps/skylar/i18n/en.json`.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** Skylar production site copy (static export) + repo i18n JSON.
- **Reviewer:** Pete
- **Approval-Evidence:** User acknowledgement in PR description or chat (2026-02-14).
- **Measurement-Readiness:** Owner Pete; manual outreach log (TASK-02) for first 2-4 weeks.
- **Affects:**
  - Primary: `apps/skylar/i18n/en.json`
  - [readonly] `apps/skylar/src/components/typo-home/EnglishHome.tsx`
  - [readonly] `apps/skylar/src/app/[lang]/products/components/EnglishProductsPage.tsx`
  - [readonly] `apps/skylar/src/app/[lang]/people/page.tsx`
  - [readonly] `apps/skylar/src/app/[lang]/real-estate/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-05
- **Confidence:** 84%
  - Implementation: 85% - One JSON file; existing build/test harness verified.
  - Approach: 88% - Aligns external copy to stated strategy (not for hire) and reduces inbound noise.
  - Impact: 84% - Localized to Skylar i18n strings; regression risk is messaging/trust rather than runtime behavior.
- **Acceptance:**
  - EN home makes "not for hire" explicit via the first-fold intro copy.
  - EN people hero removes "services" and "service delivery" language.
  - EN real-estate experimentation card removes "tools partners can reuse" language.
  - EN products page copy does not read like client services (no "How we work with you", "we can help", "match you with factories").
  - No new bold claims are introduced without a proof hook or scoped wording.
- **Validation contract:**
  - TC-01: `apps/skylar/i18n/en.json` remains valid JSON.
  - TC-02: `pnpm --filter @apps/skylar typecheck` passes.
  - TC-03: `pnpm --filter @apps/skylar test -- src/test/seo/seo-integration.test.ts` passes.
  - TC-04: `pnpm --filter @apps/skylar build` passes.
  - TC-05: `rg -n "How We Work With You|we can help|match you with|service delivery|tools partners can reuse" apps/skylar/i18n/en.json` returns zero matches.
  - VC-01: Copy review checklist - confirms "not for hire" hierarchy and no for-hire CTA leakage.
  - **Acceptance coverage:** TC-05 covers service/partner leakage; TC-02/03/04 cover runtime safety; VC-01 covers positioning hierarchy.
- **Execution plan:** Red -> Green -> Refactor
  - Red: run TC-05 and document current matches.
  - Green: apply the minimum text edits to clear TC-05 + satisfy Acceptance.
  - Refactor: tighten language for brevity/clarity without reintroducing banned phrases.
- **Planning validation:**
- **Build/validation evidence (2026-02-14):**
  - `python3 -m json.tool apps/skylar/i18n/en.json` - PASS
  - `rg -n "How We Work With You|we can help|match you with|service delivery|tools partners can reuse" apps/skylar/i18n/en.json` - zero matches
  - `pnpm --filter @apps/skylar typecheck` - PASS
  - `pnpm --filter @apps/skylar test -- src/test/seo/seo-integration.test.ts` - PASS
  - `pnpm --filter @apps/skylar build` - PASS
  - Checks run (pre-change baseline):
    - `pnpm --filter @apps/skylar typecheck` - PASS
    - `pnpm --filter @apps/skylar test -- src/test/seo/seo-integration.test.ts` - PASS
  - Unexpected findings: EN home first fold is typo-home; `hero.subhead` is not visible on EN home.
- **Rollout / rollback:**
  - Rollout: ship as a single Skylar deploy.
  - Rollback: revert the commit.
- **Documentation impact:** None

### TASK-02: Release 1 promotion assets (audience-split outbound + outreach log)
- **Status:** Complete (2026-02-14)
- **Type:** IMPLEMENT
- **Deliverable:** Business artifacts - outbound templates + outreach log template.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:**
  - `docs/plans/skylar-marketing-promotion/outbound.en.md`
  - `docs/plans/skylar-marketing-promotion/outreach-log.csv`
- **Reviewer:** Pete
- **Approval-Evidence:** User acknowledgement in PR description or chat (2026-02-14).
- **Measurement-Readiness:** Owner Pete; outreach log reviewed weekly for 4 weeks.
- **Affects:**
  - Primary: `docs/plans/skylar-marketing-promotion/outbound.en.md`, `docs/plans/skylar-marketing-promotion/outreach-log.csv`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% - Straightforward doc artifacts.
  - Approach: 90% - Aligns promotion to real audiences and avoids wrong-fit inbound.
  - Impact: 90% - Low risk; no runtime impact.
- **Acceptance:**
  - Outbound templates include: one-liner, 30s pitches, and email templates for finance + supplier + customer.
  - Single shared contact endpoint is used; segmentation is by subject line and/or destination context.
  - Outreach log template includes fields: date, target, segment, message variant, link, reply quality (0-3), next step.
- **Validation contract (VC-first):**
  - VC-01: Audience split - finance/supplier/customer sections exist and are distinct.
  - VC-02: Not-for-hire guard - no copy suggests Skylar is offering venture studio services.
  - VC-03: Proof discipline - no fabricated metrics/logos/testimonials; risky claims scoped.
  - VC-04: Measurement readiness - outreach log template exists and is usable.
  - **Validation type:** review checklist
  - **Verify:** read the artifacts and confirm VC-01..04.
- **Execution plan:** Red -> Green -> Refactor
  - Red: draft versions and explicitly try to falsify VC-02 (does any line invite for-hire work?).
  - Green: adjust copy to pass VC-01..04.
  - Refactor: tighten subject lines and make templates more skimmable.
- **Rollout / rollback:**
  - Rollout: start using the templates for the next 30/30 outreach run.
  - Rollback: revert the commit.
- **Documentation impact:** None

### TASK-03: IT alignment (minimal pass)
- **Type:** IMPLEMENT
- **Deliverable:** Code change - remove services/service delivery + partner reuse language in IT copy.
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** Skylar IT locale copy.
- **Reviewer:** Pete
- **Approval-Evidence:** User acknowledgement in PR description or chat.
- **Measurement-Readiness:** Same as Release 1 (manual outreach log).
- **Affects:** `apps/skylar/i18n/it.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 75%
  - Implementation: 80% - Single JSON file.
  - Approach: 75% - Needs Italian phrasing choices to keep tone without service language.
  - Impact: 75% - Locale-only copy risk.
- **Acceptance:**
  - Remove "servizi"/"service delivery" framing from `people.it.hero.body`.
  - Remove "strumenti per i partner" framing from `realEstate.it.stack.experimentation.body`.
- **Validation contract:**
  - TC-01: `apps/skylar/i18n/it.json` valid JSON.
  - TC-02: `pnpm --filter @apps/skylar build` passes.

### TASK-04: ZH alignment (minimal pass)
- **Type:** IMPLEMENT
- **Deliverable:** Code change - remove partner/service framing where it implies for-hire work.
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** Skylar ZH locale copy.
- **Reviewer:** Pete
- **Approval-Evidence:** User acknowledgement in PR description or chat.
- **Measurement-Readiness:** Same as Release 1 (manual outreach log).
- **Affects:** `apps/skylar/i18n/zh.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 72%
  - Implementation: 80% - Single JSON file.
  - Approach: 72% - Chinese phrasing choices must avoid weakening supplier intent.
  - Impact: 72% - Locale-only copy risk.
- **Acceptance:**
  - ZH copy avoids implying Skylar offers services to external partners.
- **Validation contract:**
  - TC-01: `apps/skylar/i18n/zh.json` valid JSON.
  - TC-02: `pnpm --filter @apps/skylar build` passes.

### TASK-05: Horizon checkpoint - reassess Release 2 and remaining locales
- **Type:** CHECKPOINT
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-do-replan` on all tasks after this checkpoint.
  - Reassess remaining task confidence using evidence from shipped Release 1 copy + outreach log results.
  - Confirm or revise the approach for Release 2 doors.
- **Horizon assumptions to validate:**
  - Release 1 copy reduced wrong-fit inbound.
  - Finance/supplier outbound variants produced qualified replies.

### TASK-06: Release 2 (deferred) - audience doors + UTMs + optional Loop/Portfolio
- **Type:** IMPLEMENT
- **Deliverable:** Code change - explicit audience doors and measurable CTAs.
- **Execution-Skill:** /lp-do-build
- **Artifact-Destination:** Skylar home page + CTAs.
- **Reviewer:** Pete
- **Approval-Evidence:** User acknowledgement in PR.
- **Measurement-Readiness:** UTMs + CTA inventory tracked; cadence weekly.
- **Affects:**
  - Primary: `apps/skylar/src/components/typo-home/EnglishHome.tsx`, `apps/skylar/i18n/en.json`
  - Secondary: `apps/skylar/src/components/Nav.tsx` (if nav adds doors)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 75% - Requires new UI section + new translation keys.
  - Approach: 70% - Needs evidence from Release 1 outreach before choosing the exact door structure.
  - Impact: 70% - Visible homepage change; needs careful review.
- **Acceptance:**
  - Home page offers three explicit doors (finance/customer/supplier) with the same contact endpoint.
  - CTAs are measurable via UTMs and an outreach log process.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/skylar build` passes.
  - VC-01: Door copy does not imply for-hire services.

## Risks & Mitigations
- Risk: Conversion noise (wrong-fit inbound) if for-hire language persists.
  - Mitigation: TASK-01 removes service language; TASK-02 templates reinforce audience targeting.
- Risk: Locale drift (IT/ZH remain for-hire).
  - Mitigation: TASK-03 and TASK-04 alignment passes; checkpoint gates Release 2.

## Acceptance Criteria (overall)
- [ ] EN Skylar copy is explicitly not-for-hire and free of service/partner leakage.
- [ ] Finance + supplier outbound templates exist and are usable (single contact endpoint).
- [ ] Skylar builds/tests remain green after copy changes.

## Decision Log
- 2026-02-14: Defaulted to operator-led portfolio (not for hire) and three audience doors (finance/customer/supplier). Single contact endpoint for now.
