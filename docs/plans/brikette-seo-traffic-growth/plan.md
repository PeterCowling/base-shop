---
Type: Plan
Status: Draft
Domain: SEO | Data | Infra
Workstream: Mixed
Created: 2026-02-22
Last-reviewed: 2026-02-22
Last-updated: 2026-02-22
Last-sequenced: 2026-02-22
Relates-to charter: none
Feature-Slug: brikette-seo-traffic-growth
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo
Overall-confidence: 82% (Phase A execution scope)
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
---

# Brikette SEO Traffic Growth Plan

## Summary

hostel-positano.com has ~4,093 indexable URLs, full hreflang, and comprehensive structured data, yet generates near-zero non-branded organic traffic (~1.7 organic sessions/day). Three confirmed technical blockers exist: (1) `www` does not redirect to apex, (2) root has a 2-hop 302 chain, and (3) canonical/sitemap URLs use trailing slashes while the runtime 308-redirects them away. This plan fixes those blockers first, then runs diagnostic investigations to unlock Wave 2/3 quick-wins (meta optimization, sitemap lastmod, /en/help fix) and content-activation work gated on guide indexation evidence. Backlink acquisition and GBP work run as parallel ongoing workstreams.

## Active tasks
- [ ] TASK-01a: Cloudflare Bulk Redirects — www→apex host redirect
- [ ] TASK-01b: Fix root redirect in _redirects (302→301, slashless target)
- [ ] TASK-01c: Pages Functions preflight check (INVESTIGATE)
- [ ] DECISION-01: Confirm slashless canonical policy (operator checkpoint)
- [ ] TASK-02: Align trailing-slash canonical policy across canonicals, hreflang, sitemap, and tests
- [ ] TASK-03a: GSC URL Inspection canonical sample — pre-change baseline
- [ ] TASK-03b: GSC URL Inspection canonical sample — post-change validation
- [ ] TASK-04: hreflang reciprocity sampling
- [ ] TASK-05: Structured-data validation sample
- [ ] TASK-06: /en/help bounce query pull
- [ ] TASK-07: Homepage title/H1/meta optimization
- [ ] TASK-08: /en/rooms meta description optimization
- [x] TASK-09: Sitemap lastmod timestamp source feasibility (Complete 2026-02-22)
- [x] TASK-19: Lastmod eligibility matrix and URL-source mapping (Complete 2026-02-22)
- [ ] TASK-10: Internal link coverage audit
- [ ] TASK-11: GSC Page indexing + guide coverage sample
- [ ] CHECKPOINT-01: Wave 3 gate — reassess downstream plan
- [ ] TASK-12: Implement sitemap lastmod with accurate timestamps (Blocked, replan required)
- [ ] TASK-13: Content quality pass on top transportation guides (Phase B, post-CHECKPOINT-01)
- [ ] TASK-14: Homepage featured guides section (Phase B, post-CHECKPOINT-01)
- [ ] TASK-15: Italian locale meta/title quality pass
- [ ] TASK-16: Google Business Profile audit and refresh
- [ ] TASK-17: Backlink outreach targeting (Phase B)
- [ ] TASK-18: GSC Links baseline pull (INVESTIGATE)

## Goals

- Fix confirmed URL normalization blockers (www, root redirect chain, canonical-to-redirect mismatch)
- Verify canonical consolidation via GSC URL Inspection post-fix
- Improve CTR on rooms page (393 impressions, 0.5% CTR) and homepage rankings
- Diagnose /en/help high-bounce page and resolve mismatched intent
- Gate and execute content-activation work on guide pages (gated on indexation evidence)
- Start GBP and backlink authority workstreams in parallel

## Non-goals

- Conversion rate optimisation
- Paid search / PPC
- Google Tag Manager migration
- Social media growth strategy
- Core Web Vitals audit (separate concern)

## Constraints & Assumptions

- Constraints:
  - Static export (Cloudflare Pages) — no server-side rendering; dynamic routes pre-generated at build time
  - 18 locales — any technical change must apply consistently across all languages
  - No paid SEO tools (Ahrefs, SEMrush) — using GSC + GA4 + Cloudflare data only
  - `public/_redirects` is the edge-layer redirect mechanism (Cloudflare Pages); middleware handles slug rewrites only
- Assumptions:
  - Canonical URL policy: **slashless** (matches runtime 308 redirect behavior) — see Proposed Approach
  - Operator confirmation required before TASK-02 executes (policy choice is architectural), captured as DECISION-01
  - Guide pages at hostel-positano.com are not currently ranking due to indexation quality and authority gaps, not crawler access (Cloudflare confirms active crawling)
  - `ensureTrailingSlash` production call-sites: 8 calls in 4 source files — `seo.ts:160,238`, `metadata.ts:46,61`, `buildMetadata.ts:49,67`, `buildAlternates.ts:30,37` (confirmed via critique-round-3 grep). `generate-public-seo.ts` uses an independent `normalizePathname` function (lines 21-26), not `ensureTrailingSlash` — scope is a function body rewrite in that file, not a call-site removal.

## Fact-Find Reference

- Related brief: `docs/plans/brikette-seo-traffic-growth/fact-find.md`
- Key findings used:
  - E1: Five distinct homepage URL variants in GSC (http, www, apex, /en, /en/) — confirmed signal split
  - E3: Live curl probes confirming: `www` → no apex redirect; root `/` → 302 → /en/ → 308 → /en (2-hop, starts temporary)
  - E4: `ensureTrailingSlash` enforced in 4 code files + tests; sitemap also forces trailing slash; runtime 308 strips slashes
  - E7: Cloudflare confirms active crawling (~1,400–2,000 baseline PV/day (mixed traffic) after anomaly days excluded)
  - GSC: 112 clicks/90 days; "hostel positano" at position 22.1 (114 impressions); rooms at position 8.7 (393 impressions, 0.5% CTR)
  - GA4 window: active since 2026-02-10 only (13 days); 22 organic sessions; /en/help 87.5% bounce rate

## Proposed Approach

- **Option A — Slashless policy** (recommended): Remove trailing-slash enforcement from canonical/hreflang/sitemap generation; update metadata tests to assert slashless URLs; no changes to runtime (308 already produces slashless). This makes canonical targets match runtime final URLs.
- **Option B — Trailing-slash policy**: Add a 308 redirect rule to `public/_redirects` for all `/path` → `/path/`; keep `ensureTrailingSlash` calls in metadata/sitemap. Requires testing redirect interaction with existing rules and roughly doubles the variant surface per URL path (slash and non-slash forms for all locales).
- **Chosen approach: Option A — Slashless.** Simpler, fewer moving parts, matches existing runtime behavior. **Operator confirmation required before TASK-02 executes (DECISION-01 gate).**
- www→apex (Cloudflare Bulk Redirects dashboard) and root 302→301 fixes are policy-independent and can ship immediately after pre-change canonical baseline capture (TASK-03a); canonical-policy approval (DECISION-01) gates only TASK-02.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: No (reset after structural changes)
- Auto-build eligible: No (plan-only mode; no explicit auto-build instruction)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01c | INVESTIGATE | Pages Functions preflight check | 90% | S | Pending | - | TASK-01a, TASK-01b |
| TASK-01a | IMPLEMENT | Cloudflare Bulk Redirects — www→apex | 85% | S | Pending | TASK-01c, TASK-03a | TASK-07, TASK-08, TASK-03b |
| TASK-01b | IMPLEMENT | Fix root redirect in _redirects (302→301) | 80% | S | Pending | TASK-01c, TASK-03a | TASK-07, TASK-08, TASK-03b |
| TASK-03a | INVESTIGATE | GSC URL Inspection — pre-change baseline | 85% | S | Pending | - | TASK-01a, TASK-01b, DECISION-01, TASK-02, TASK-07 |
| DECISION-01 | DECISION | Confirm slashless canonical policy (operator checkpoint) | 95% | S | Pending | TASK-03a | TASK-02 |
| TASK-02 | IMPLEMENT | Trailing-slash canonical policy alignment | 75% | M | Pending | TASK-03a, DECISION-01 | CHECKPOINT-01, TASK-03b, TASK-07, TASK-08, TASK-12 |
| TASK-03b | INVESTIGATE | GSC URL Inspection — post-change validation | 90% | S | Pending | TASK-01a, TASK-01b, TASK-02 | - |
| TASK-04 | INVESTIGATE | hreflang reciprocity sampling (pre/post TASK-02) | 80% | S | Pending | - | CHECKPOINT-01 |
| TASK-05 | INVESTIGATE | Structured-data validation | 80% | S | Pending | - | CHECKPOINT-01 |
| TASK-06 | INVESTIGATE | /en/help bounce query pull | 75% | S | Pending | - | - |
| TASK-07 | IMPLEMENT | Homepage title/H1/meta for "hostel positano" | 75% | S | Pending | TASK-01a, TASK-01b, TASK-02, TASK-03a | TASK-08 |
| TASK-08 | IMPLEMENT | /en/rooms meta description optimization | 75% | S | Pending | TASK-01a, TASK-01b, TASK-02, TASK-07 | - |
| TASK-09 | INVESTIGATE | Sitemap lastmod timestamp source feasibility | 85% | S | Complete (2026-02-22) | - | TASK-19 |
| TASK-19 | INVESTIGATE | Lastmod eligibility matrix + URL-source mapping | 85% | S | Complete (2026-02-22) | TASK-09 | TASK-12 |
| TASK-10 | INVESTIGATE | Internal link coverage audit | 85% | S | Pending | - | CHECKPOINT-01 |
| TASK-11 | INVESTIGATE | GSC Page indexing + guide coverage | 85% | S | Pending | - | CHECKPOINT-01 |
| TASK-18 | INVESTIGATE | GSC Links baseline pull | 85% | S | Pending | - | TASK-17 |
| CHECKPOINT-01 | CHECKPOINT | Wave 3 gate — reassess downstream plan | 95% | S | Pending | TASK-02, TASK-04, TASK-05, TASK-10, TASK-11 | TASK-13, TASK-14, TASK-15 |
| TASK-12 | IMPLEMENT | Sitemap lastmod implementation | 75% | M | Blocked (replan required) | TASK-02, TASK-19 | - |
| TASK-13 | IMPLEMENT | Content quality pass — top transportation guides | 60% | M | Deferred (Phase B) | CHECKPOINT-01 | - |
| TASK-14 | IMPLEMENT | Homepage featured guides section | 65% | M | Deferred (Phase B) | CHECKPOINT-01 | - |
| TASK-15 | IMPLEMENT | Italian locale meta/title quality pass | 75% | S | Pending | CHECKPOINT-01 | - |
| TASK-16 | IMPLEMENT | Google Business Profile audit and refresh | 75% | S | Pending | - | - |
| TASK-17 | IMPLEMENT | Backlink outreach targeting | 60% | M | Deferred (Phase B) | TASK-18 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01c, TASK-03a, TASK-04 (pre-pass), TASK-05, TASK-06, TASK-09, TASK-10, TASK-11, TASK-18 | None | All independent; run in parallel. TASK-04 captures pre-TASK-02 hreflang baseline in this wave. TASK-01c and TASK-03a must both complete before Wave 2 can start. TASK-18 runs alongside Wave 1 to establish backlink baseline. |
| Ongoing | TASK-16 | None | Manual GBP ops; start any time; no code dependency |
| 2 | DECISION-01, TASK-19 | DECISION-01: TASK-03a; TASK-19: TASK-09 | DECISION-01 is operator checkpoint for TASK-02. TASK-19 converts TASK-09 findings into an actionable URL-class eligibility contract for TASK-12. |
| 3 | TASK-01a, TASK-01b, TASK-02 | TASK-01a+01b: after TASK-01c AND TASK-03a; TASK-02: after TASK-03a + DECISION-01 | TASK-01a and TASK-01b deploy together. TASK-02 is blocked until DECISION-01 is recorded. |
| 4 | TASK-03b, TASK-04 (post-pass), TASK-07 | TASK-03b: after TASK-01a + TASK-01b + TASK-02 and no earlier than T+7 days or verified recrawl; TASK-04 post-pass: after TASK-02 (with pre-pass already captured in Wave 1); TASK-07: after TASK-01a + TASK-01b + TASK-02 + TASK-03a | TASK-07 now waits for canonical rollout to avoid attribution ambiguity. TASK-03b validates canonical consolidation after recrawl window. TASK-04 post-pass verifies hreflang format/reciprocity after slashless rollout. |
| 5 | TASK-08 | TASK-01a, TASK-01b, TASK-02, TASK-07 (file overlap: metadata.ts) | TASK-08 must not run concurrently with TASK-07; start after TASK-07 completes |
| CHECKPOINT | CHECKPOINT-01 | TASK-02, TASK-04, TASK-05, TASK-10, TASK-11 | Gate enforces post-indexing reassessment before Phase B content activation |
| 6 | TASK-12, TASK-15 | TASK-12: after TASK-02 + TASK-19 (file overlap: generate-public-seo.ts); TASK-15: after CHECKPOINT-01 | TASK-12 remains blocked until precursor evidence from TASK-19 is complete. |
| Deferred (Phase B) | TASK-13, TASK-14, TASK-17 | TASK-13/14: after CHECKPOINT-01; TASK-17: after TASK-18 | Out of current-phase confidence scope; execute only after CHECKPOINT-01 replan confirms viability |

**Max parallelism:** 9 tasks (Wave 1: TASK-01c, TASK-03a, TASK-04, TASK-05, TASK-06, TASK-09, TASK-10, TASK-11, TASK-18)
**Critical path:** TASK-03a → DECISION-01 → TASK-02 → CHECKPOINT-01 → TASK-15 (6 waves minimum)
**Total tasks:** 24 tasks + 1 checkpoint (DECISION-01, TASK-01a, TASK-01b, TASK-01c, TASK-02, TASK-03a, TASK-03b, TASK-04–TASK-19)

---

## Tasks

---

### TASK-01c: Pages Functions preflight check

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-01c-pages-functions-check.md` — confirmation of whether any Pages Functions are active and whether they intercept /, /en, or www-origin requests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-01c-pages-functions-check.md`
- **Depends on:** -
- **Blocks:** TASK-01a, TASK-01b
- **Confidence:** 90%
  - Implementation: 95% — check Cloudflare Pages project for `/functions/` directory in repo; check Pages dashboard for deployed Functions
  - Approach: 90% — `_redirects` rules do NOT apply to requests served by Pages Functions; if Functions are active on /, /en, or * routes, the redirect rules will be silently bypassed
  - Impact: 90% — prevents "deploy and nothing happens" scenario where redirects are shadowed by Functions
- **Questions to answer:**
  - Does the repo contain a `functions/` directory (or equivalent Pages Functions configuration)?
  - Are any Pages Functions deployed on the hostel-positano.com Cloudflare Pages project?
  - If yes: do they intercept `/`, `/en`, or wildcard patterns that would shadow TASK-01a/01b redirects?
- **Acceptance:**
  - Definitive answer: "No Functions active — _redirects rules will apply as expected" OR "Functions present on [routes] — TASK-01a/01b must be restructured to avoid shadowing"
  - If Functions active on shadowing routes: create a DECISION task before TASK-01a/01b can proceed
- **Validation contract:** Artifact written with explicit yes/no conclusion and evidence cited
- **Planning validation:** None: S investigate task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact; if Functions shadow concern found, raise DECISION task via `/lp-do-replan`

---

### TASK-01a: Cloudflare Bulk Redirects — www→apex host redirect

- **Type:** IMPLEMENT
- **Deliverable:** Cloudflare Bulk Redirects configured end-to-end: (1) Redirect List entry with source `www.hostel-positano.com/` (no scheme), target `https://hostel-positano.com`, and parameters `SUBPATH_MATCHING=TRUE`, `PRESERVE_PATH_SUFFIX=TRUE`, `PRESERVE_QUERY_STRING=TRUE`; plus (2) enabled Bulk Redirect Rule referencing that list with permanent redirect status. TC-verified with curl probes and documented in `docs/plans/brikette-seo-traffic-growth/task-01a-bulk-redirects.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Cloudflare dashboard (Bulk Redirects rules)
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** Redirect List entry screenshot + Bulk Redirect Rule (enabled) screenshot + curl TC-01a passing
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-01a-bulk-redirects.md`, `docs/plans/brikette-seo-traffic-growth/task-01-redirect-chain-baseline.md`
- **Depends on:** TASK-01c, TASK-03a
- **Blocks:** TASK-07, TASK-08, TASK-03b
- **Confidence:** 85%
  - Implementation: 90% — Cloudflare Bulk Redirects requires both list entry and enabled rule; source without scheme applies to both HTTP and HTTPS; subpath/suffix/query parameters preserve full request shape
  - Approach: 90% — Bulk Redirects is the correct mechanism for host-level (domain-to-domain) redirects on Cloudflare; `_redirects` file is path-based only and cannot perform host-level redirects
  - Impact: 85% — E1 shows www variant in GSC with its own impressions (11 clicks, 625 impressions); Google has NOT auto-consolidated it; host-level consolidation is the only fix
  - Overall: min(90, 90, 85) = 85%
- **Acceptance:**
  - Redirect List entry exists with source `www.hostel-positano.com/` and target `https://hostel-positano.com`; `SUBPATH_MATCHING`, `PRESERVE_PATH_SUFFIX`, and `PRESERVE_QUERY_STRING` are all enabled
  - Bulk Redirect Rule referencing the list is enabled with permanent redirect behavior
  - `https://www.hostel-positano.com/` → `301` → `https://hostel-positano.com/` (single host-normalization hop; curl TC-01a)
  - `https://www.hostel-positano.com/en` → `301` → `https://hostel-positano.com/en` (path preserved)
  - `https://www.hostel-positano.com/en/rooms` → `301` → `https://hostel-positano.com/en/rooms` (arbitrary path preserved)
  - `http://www.hostel-positano.com/en/rooms?ref=test` resolves to `https://hostel-positano.com/en/rooms?ref=test` with path/query preserved
  - TASK-01 atomicity gate: TASK-01 is considered complete only when TASK-01a (Bulk Redirects live) AND TASK-01b (root redirect deployed) AND post-change curl probes (TC-01a, TC-01b) all pass
- **Validation contract (TC-01a):**
  - TC-01a: `curl -IL https://www.hostel-positano.com/` → first response is `301` with `Location: https://hostel-positano.com/` → final response is `200`
  - TC-01a-path: `curl -IL https://www.hostel-positano.com/en/rooms` → `301` with `Location: https://hostel-positano.com/en/rooms` → `200`
  - TC-01a-http-query: `curl -IL 'http://www.hostel-positano.com/en/rooms?ref=test'` → host is normalized to apex with path/query preserved; no temporary (`302`) hop in chain
  - TC-01a-root-e2e: with TASK-01b live, `curl -IL https://www.hostel-positano.com/` resolves to `https://hostel-positano.com/en` in <=2 permanent hops, no `302`, final `200`
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm TASK-01c (no Pages Functions conflict); confirm TASK-03a baseline captured; capture pre-deploy redirect baseline artifact at `docs/plans/brikette-seo-traffic-growth/task-01-redirect-chain-baseline.md` (`http://www.../`, `https://www.../`, `https://apex/`, `https://apex/en/`, `https://apex/en`); document current state of www apex redirect (TC-01a expected: no 301, likely no response or direct 200)
  - Green: Configure Redirect List entry in Cloudflare dashboard with source `www.hostel-positano.com/` and target `https://hostel-positano.com`; set `SUBPATH_MATCHING=TRUE`, `PRESERVE_PATH_SUFFIX=TRUE`, `PRESERVE_QUERY_STRING=TRUE`; create/enable Bulk Redirect Rule referencing the list; run TC-01a, TC-01a-path, and TC-01a-http-query
  - Refactor: Verify no loop introduced (apex→www→apex); submit www variant URLs to GSC recrawl; document list parameters + enabled rule + baseline/after curl evidence in audit artifact
- **Planning validation:**
  - Checks run: Confirmed `_redirects` does not contain a www→apex rule (critique round 1 verification); confirmed Cloudflare Bulk Redirects supports host-level redirects without Pages Functions
  - Validation artifacts: E3 (fact-find curl probes showing www not redirected); E1 (GSC www variant)
- **Scouts:** TASK-01c must complete before starting; if TASK-01c finds Functions conflict, stop and raise DECISION task
- **Edge Cases & Hardening:**
  - Bulk Redirect rules take precedence over `_redirects` file rules — verify no double-redirect for www paths (www → apex → locale redirect from _redirects should be 2 hops max)
  - Redirect List source URL cannot include query string; rely on `PRESERVE_QUERY_STRING=TRUE` for query passthrough
  - If HTTPS certificate for www subdomain isn't provisioned, Bulk Redirect will fail — verify SSL coverage on www first
- **What would make this ≥90%:** Staging test via Cloudflare Preview deployment confirming Bulk Redirect behavior before production enable
- **Rollout / rollback:**
  - Rollout: Enable the Bulk Redirect rule in Cloudflare dashboard; immediate effect
  - Rollback: Disable the Bulk Redirect rule in dashboard; no code changes needed
- **Documentation impact:**
  - Write audit artifact at `docs/plans/brikette-seo-traffic-growth/task-01a-bulk-redirects.md` documenting list/rule configuration and TC evidence
  - Write redirect-chain baseline artifact at `docs/plans/brikette-seo-traffic-growth/task-01-redirect-chain-baseline.md` for pre/post comparison

---

### TASK-01b: Fix root redirect in _redirects (302→301, slashless target)

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/public/_redirects` — root rule changed from `/ /en/ 302` to `/ /en 301`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/public/_redirects`
- **Depends on:** TASK-01c, TASK-03a
- **Blocks:** TASK-07, TASK-08, TASK-03b
- **Confidence:** 80%
  - Implementation: 90% — confirmed two-character change at line ~6 of `_redirects` (302 → 301; `/en/` → `/en`); simple config edit
  - Approach: 85% — `_redirects` path-based rules apply correctly to `https://hostel-positano.com/` (apex root); no host-level ambiguity for root path
  - Impact: 80% — E3 confirms current root starts with a 302 (temporary); upgrading to 301 signals permanence; slashless target eliminates one extra 308 hop from target to /en. Held-back test: "What if Cloudflare already caches this as permanent?" — no, 302 is explicitly not cached; upgrade to 301 is the correct fix.
  - Overall: min(90, 85, 80) = 80%
- **Acceptance:**
  - `https://hostel-positano.com/` → `301` → `https://hostel-positano.com/en` (slashless, single hop; curl TC-01b)
  - No `302` in any redirect chain for the root URL
  - Existing locale-specific redirect rules unaffected (check 5 representative paths)
- **Validation contract (TC-01b):**
  - TC-01b: `curl -IL https://hostel-positano.com/` → first response is `301` with `Location: https://hostel-positano.com/en` → `200` final; chain ≤ 2 hops total
  - TC-01b-existing: 5 representative locale URLs resolve correctly (not affected by root rule change)
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm TASK-01c and TASK-03a complete; document current state with TC-01b (expected: 302)
  - Green: Change `/ /en/ 302` to `/ /en 301` in `_redirects`; deploy to staging; run TC-01b and TC-01b-existing
  - Refactor: Deploy to production; run TC-01b against production; submit root URL to GSC recrawl; document in build evidence
- **Planning validation:**
  - Checks run: Read `apps/brikette/public/_redirects` — confirmed root rule `/ /en/ 302` at line ~6; 725 total lines; no interaction with www rules (those are in a separate section for stepfreepositano.com)
  - Validation artifacts: E3 (curl probe confirming 302 chain); `_redirects` file inspection
- **Edge Cases & Hardening:**
  - Root rule change from `/ /en/ 302` to `/ /en 301`: slashless target because runtime strips slashes; if canonical policy in TASK-02 selects trailing-slash instead, revert root target to `/en/`
  - The `stepfreepositano.com` full-URL rules (lines 16–21) redirect that domain to `/en/apartment/` — these are dead code (domain not owned; DNS not pointed at this Pages project) and are unaffected by the root rule change
- **What would make this ≥90%:** Staging deploy + TC-01b passing before production; operator confirmation that slashless `/en` target is correct once TASK-02 policy is confirmed
- **Rollout / rollback:**
  - Rollout: Deploy via standard Cloudflare Pages build; takes effect immediately on next deploy
  - Rollback: Revert the single changed line in `_redirects`; redeploy
- **Documentation impact:**
  - Update `docs/plans/brikette-seo-traffic-growth/fact-find.md` Technical SEO State table (root redirect row) post-deploy

---

### DECISION-01: Confirm slashless canonical policy (operator checkpoint)

- **Type:** DECISION
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/decision-01-canonical-policy.md` — explicit operator confirmation of slashless policy (Option A) or rejection with replan requirement
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/decision-01-canonical-policy.md`
- **Depends on:** TASK-03a
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% — 5-minute checkpoint with explicit yes/no record
  - Approach: 95% — converts narrative operator confirmation into an enforceable dependency
  - Impact: 95% — prevents TASK-02 execution on unapproved policy, which would create avoidable rework
- **Acceptance:**
  - Decision document records one of: `Approved: slashless (Option A)` OR `Rejected: slashless; run /lp-do-replan for Option B`
  - Decision timestamp and approver identity recorded
  - TASK-02 remains blocked until this decision artifact exists
- **Validation contract:** Decision artifact exists and is linked from Decision Log
- **Planning validation:** TASK-03a baseline evidence attached to decision for traceability
- **Rollout / rollback:** None: control gate only
- **Documentation impact:** Adds durable audit trail for canonical policy choice

---

### TASK-02: Align trailing-slash canonical policy (slashless)

- **Type:** IMPLEMENT
- **Deliverable:** Slashless canonical URLs across hreflang, metadata canonicals, and sitemap; updated metadata tests; updated sitemap test
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/utils/seo.ts`, `apps/brikette/src/app/_lib/metadata.ts`, `packages/seo/src/metadata/buildMetadata.ts`, `packages/seo/src/metadata/buildAlternates.ts`, `apps/brikette/scripts/generate-public-seo.ts`, `apps/brikette/src/test/lib/metadata.test.ts`, `[readonly] packages/seo/src/metadata/ensureTrailingSlash.ts`
- **Depends on:** TASK-03a, DECISION-01
- **Blocks:** CHECKPOINT-01, TASK-03b, TASK-07, TASK-08, TASK-12 (file overlap: generate-public-seo.ts)
- **Confidence:** 75%
  - Implementation: 75% — 8 call-sites of `ensureTrailingSlash` confirmed in 4 source files (critique round 3 grep); M effort due to breadth (4 source files + tests + shared package + normalizePathname rewrite in generate-public-seo.ts); gap: packages/seo test files also assert trailing-slash URLs and need updating (not yet enumerated in full)
  - Approach: 75% — slashless matches runtime 308 behavior (recommended in fact-find); but operator confirmation required before execution; if operator selects Option B (trailing-slash), execution plan changes substantially
  - Impact: 80% — E1/E3 confirms canonical-to-redirect mismatch is actively causing signal split (5 URL variants in GSC); slashless canonicals will eliminate the redirect hop from canonical target. Held-back test: "Would Google already handle this via the 308?" — E1 shows 5 variants including both `/en` and `/en/` each with independent impressions/clicks, proving the 308 is NOT consolidating GSC signals. Held-back test passes.
- **Acceptance:**
  - `<link rel="canonical">` for all pages returns slashless URL (e.g. `https://hostel-positano.com/en`, not `/en/`)
  - hreflang alternates use slashless URLs for all 18 locales
  - `sitemap.xml` `<loc>` entries are slashless
  - All canonical target URLs return `200` with `curl -I` (no redirect from canonical target)
  - Existing metadata tests pass with updated assertions
  - No regression in hreflang self-reference or reciprocity (validated by TASK-04)
- **Validation contract (TC-05/06/07):**
  - TC-05: `curl -I https://hostel-positano.com/en` → `200` (canonical target is final URL); `curl -I https://hostel-positano.com/en/` → `308` → `/en` (slashless form is runtime canonical)
  - TC-06: Parse rendered `<head>` from 5 representative pages; confirm `rel="canonical"` href has no trailing slash; confirm all hreflang alternates have no trailing slash
  - TC-07: Validate `sitemap.xml` `<loc>` values are slashless on a 10-URL sample
  - TC-08: Run existing metadata unit tests → all pass (failures indicate incorrect assertion updates)
- **Execution plan:** Red → Green → Refactor
  - Red: Run TC-05/06/07 before change; document current state (trailing-slash canonicals, slashless runtime → mismatch confirmed)
  - Green: Remove `ensureTrailingSlash` wrapping from 8 call-sites across 4 source files (seo.ts:160,238; metadata.ts:46,61; buildMetadata.ts:49,67; buildAlternates.ts:30,37 — 2 calls each); rewrite `normalizePathname` body in `generate-public-seo.ts` (lines 21-26) to strip rather than enforce trailing slash; update metadata test assertions; regenerate sitemap; run TCs on staging
  - Refactor: Verify no other `ensureTrailingSlash` callers missed (search codebase for remaining usages); run full test suite; deploy to production; submit sitemap for recrawl in GSC
- **Planning validation (M task):**
  - Checks run: Confirmed all production consumers of `ensureTrailingSlash` via grep — **8 call-sites in 4 source files** (2 per file): `seo.ts:160,238`; `metadata.ts:46,61`; `buildMetadata.ts:49,67`; `buildAlternates.ts:30,37`. `packages/seo` re-exports the function at `src/index.ts` (not a call site). `generate-public-seo.ts` does **NOT** call `ensureTrailingSlash` — it has an independent `normalizePathname` function (lines 21-26) that also enforces trailing slashes via a different code path; TASK-02 must rewrite that function body directly, not remove an `ensureTrailingSlash` call.
  - Validation artifacts: E4 (fact-find code evidence); consumer trace confirmed via critique-round-3 grep
  - Unexpected findings: `packages/seo` test files also assert slash-suffixed URLs — these need to be updated alongside source changes (adds scope to M estimate)
- **Consumer tracing (new outputs / modified behavior):**
  - New behavior: `buildMetadata()` (in `packages/seo`) will output slashless alternates → consumed by: `apps/brikette/src/app/_lib/metadata.ts` (generates page `<head>`); `apps/brikette/src/test/lib/metadata.test.ts` (snapshot assertions)
  - New behavior: `generate-public-seo.ts` will output slashless `<loc>` → consumed by: `apps/brikette/public/sitemap.xml` (static file); GSC sitemap submission
  - `ensureTrailingSlash` itself is NOT deleted — it remains in `packages/seo/src/metadata/` for potential future use; its call-sites are updated, not the function itself
  - `apps/brikette/src/utils/seo.ts` re-exports `ensureTrailingSlash` — if other consumers import it via this re-export and are not in the enumerated list, they could silently continue using it; must verify no other callers before marking complete
- **Scouts:** DECISION-01 must be complete before starting; if operator selects trailing-slash, stop and route to `/lp-do-replan`
- **Edge Cases & Hardening:**
  - Ensure `packages/seo` changes don't affect other apps in the monorepo that may import from `@acme/seo` and rely on trailing-slash behavior
  - Add a regression test that asserts no `<canonical>` href ends in `/` (guards against future re-introduction)
- **What would make this ≥90%:**
  - Operator confirmation that slashless policy is approved
  - Full enumeration of `packages/seo` test files asserting trailing-slash URLs
  - Post-deploy GSC URL Inspection confirming declared = selected canonical for 5 sample URLs
- **Rollout / rollback:**
  - Rollout: Deploy as part of standard Cloudflare Pages build; immediate effect on static output
  - Rollback: Revert 4 source files + tests + sitemap; redeploy
- **Documentation impact:**
  - Fact-find Technical SEO State → Canonicals row: update to ✅ once complete
- **Notes / references:**
  - Depends on TASK-03 (GSC URL Inspection) to confirm policy benefits before investing in M-effort change
  - `ensureTrailingSlash` source: `packages/seo/src/metadata/ensureTrailingSlash.ts`
  - Runtime 308 behavior: `apps/brikette/src/middleware.ts` handles slug rewrites only (uses 301). The 308 stripping slashes is empirically confirmed via E3 (live curl: `/en/ → 308 → /en`); `apps/brikette/next.config.mjs` contains no explicit `trailingSlash` config, so the 308 likely originates from Cloudflare Pages file-serving behavior for directory-form static paths rather than a Next.js configuration setting. The fix (slashless canonicals) is correct regardless of the mechanism source.

---

### TASK-03a: GSC URL Inspection — pre-change canonical baseline

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md` — table of declared vs Google-selected canonicals for 8+ representative URLs, captured BEFORE any redirect or canonical changes deploy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md`
- **Depends on:** -
- **Blocks:** TASK-01a, TASK-01b, DECISION-01, TASK-02, TASK-07
- **Confidence:** 85%
  - Implementation: 85% — GSC URL Inspection API available via service account; pattern established in fact-find; straightforward API call
  - Approach: 90% — pre-change baseline must be captured before TASK-01a or TASK-01b deploy; running after deployment makes the baseline state unknowable and non-repeatable
  - Impact: 85% — confirms canonical mismatch state before any changes; required gate for TASK-02 (confirms priority) and TASK-07 (confirms canonical fix should precede meta optimization); enables TASK-03b comparison
- **Questions to answer:**
  - For the homepage (`/en`): does Google's selected canonical match the declared canonical?
  - What % of sampled URLs show declared ≠ Google-selected canonical?
  - Do any sampled URLs show `NOT_INDEXED` or `CRAWLED_CURRENTLY_NOT_INDEXED`?
  - Does www variant appear as a separate canonical in any inspected URLs?
- **Acceptance:**
  - Minimum 8 URLs inspected BEFORE any TASK-01a/01b deploy: homepage (apex), /en, /en/rooms, /en/experiences, 3× guide pages in different categories, www homepage
  - Each URL: declared canonical URL, Google-selected canonical, index status, timestamp of inspection
  - Canonical mismatch rate calculated and documented
  - Decision output: "TASK-02 confirmed high priority" OR "mismatch rate low — revisit TASK-02 priority"
  - Artifact explicitly labelled as pre-change baseline (timestamp recorded)
- **Validation contract:** Investigation complete when: (a) artifact written with sample results table, (b) decision output stated, (c) mismatch rate quantified, (d) inspection timestamp pre-dates any TASK-01a/01b deploy
- **Planning validation:** GSC URL Inspection API confirmed available via service account with `webmasters.readonly` scope (fact-find Phase 3)
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact at `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md`; update fact-find Confidence Adjustments section with findings
- **Notes / references:**
  - Auth pattern: see `memory/data-access.md` Search Console section
  - API: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `siteUrl: sc-domain:hostel-positano.com`
  - Critical timing: must complete before TASK-01a or TASK-01b deploys; if deployment races with this task, baseline is invalidated

---

### TASK-03b: GSC URL Inspection — post-change canonical validation

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md` — same 8+ URL sample re-inspected AFTER TASK-01a+01b+02 are deployed; comparison table with TASK-03a baseline
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md`
- **Depends on:** TASK-01a, TASK-01b, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — same `searchconsole.googleapis.com/v1/urlInspection/index:inspect` pattern as TASK-03a; runs after deployments
  - Approach: 90% — post-deploy inspection confirms whether Google has re-assessed canonicals; run no earlier than T+7 days after deploy or after recrawl evidence appears in GSC URL Inspection
  - Impact: 90% — closes the validation loop: confirms canonical consolidation is working or surfaces remaining issues early enough to course-correct before CHECKPOINT-01
- **Questions to answer:**
  - Have the mismatch URLs from TASK-03a been resolved?
  - Is the www variant still appearing as a separate canonical post-TASK-01a?
  - Are declared canonicals (slashless, post-TASK-02) now matching Google-selected canonicals?
  - Any new indexation anomalies introduced by the canonical policy change?
- **Acceptance:**
  - Same URL set as TASK-03a re-inspected post-deploy
  - Earliest-run gate: run no earlier than T+7 days after TASK-01a+01b+02 deploy OR after GSC URL Inspection indicates fresh recrawl on sampled URLs
  - Mismatch rate delta documented (TASK-03a baseline vs TASK-03b result)
  - Decision output: "Canonical consolidation confirmed — Acceptance Criteria met" OR "X URLs still mismatched — escalate via /lp-do-replan before CHECKPOINT-01"
  - Explicitly references TASK-03a artifact for baseline comparison
- **Validation contract:** Artifact written with before/after comparison; ≥90% declared = Google-selected for critical templates (homepage, rooms, locale roots) required to pass overall Acceptance Criteria
- **Planning validation:** None: S investigate task; depends on TASK-03a and TASK-01a+01b+02 being complete
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact at `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md`; update Observability GSC URL Inspection section with post-change results
- **Notes / references:**
  - API: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `siteUrl: sc-domain:hostel-positano.com`

---

### TASK-04: hreflang reciprocity sampling (pre/post TASK-02)

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-04-hreflang-sample.md` — two-pass report (pre-TASK-02 baseline + post-TASK-02 verification) for reciprocity and canonical alignment across 5 locale pairs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-04-hreflang-sample.md`
- **Depends on:** -
- **Blocks:** CHECKPOINT-01
- **Confidence:** 80%
  - Implementation: 85% — rendered page inspection via curl or headless browser; hreflang tags are in static HTML
  - Approach: 85% — check self-reference, reciprocity (A→B and B→A), and canonical alignment across 5 locale pairs
  - Impact: 80% — fact-find assesses hreflang as ✅; this confirms or denies. Held-back test: "What if hreflang is already clean?" — possible; but canonical-format mismatch from TASK-02 will affect hreflang alternates too, so this sample before/after is a useful baseline
- **Questions to answer:**
  - Does each locale page include a self-referencing hreflang?
  - For locale pair EN/IT: does the EN page link to the IT equivalent and vice versa?
  - Are hreflang `href` values trailing-slash vs slashless consistent in pre-pass and corrected in post-pass?
  - Does the `x-default` hreflang point to the correct fallback URL?
- **Acceptance:**
  - Pre-pass completed before TASK-02 deploy (5 locale pairs: EN/IT, EN/DE, EN/FR, EN/ES, EN/JA)
  - Post-pass completed after TASK-02 deploy on the same 5 locale pairs
  - Self-reference ✅/❌ per locale (both passes)
  - Reciprocity ✅/❌ per pair (both passes)
  - Canonical/hreflang URL-format consistency delta recorded (pre vs post)
- **Validation contract:** Two tables (pre and post) with all 5 pairs × 4 checks; decision: "hreflang clean after TASK-02" or "issues remain and require replan"
- **Planning validation:** None: S investigate task; no code changes
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact with pre/post diff; update fact-find hreflang section if post-pass issues remain
- **Notes / references:** hreflang builder: `apps/brikette/src/utils/seo.ts`

---

### TASK-05: Structured-data validation sample

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-05-schema-validation.md` — error/warning counts for homepage, rooms, and 5 guide URLs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-05-schema-validation.md`
- **Depends on:** -
- **Blocks:** CHECKPOINT-01
- **Confidence:** 80%
  - Implementation: 85% — manual Rich Results Test (rich-results-test.com) + Schema Markup Validator (validator.schema.org) for URL-based checking without API dependency
  - Approach: 80% — validate 7 representative URLs; document error/warning classes. Held-back test: "What if no errors exist?" — still worth checking given 30+ schema component types; confirms eligibility state
  - Impact: 80% — even minor errors can affect eligibility; findings directly determine whether schema fixes are in scope for Wave 3. Held-back test: "Would this result in no actionable fixes?" — possible; outcome is still valuable as confirmation. Held-back test passes.
- **Questions to answer:**
  - Are there Critical errors blocking rich-result eligibility on any template type?
  - Which schema types have warnings?
  - Are HowTo/FAQ schemas eligible and error-free (these are Wave 3 targets)?
  - Any required fields missing across Hotel, HotelRoom, Article, BreadcrumbList types?
- **Acceptance:**
  - 7 URLs validated: homepage, rooms page, 2 transportation guides, 1 beach guide, 1 activity guide, 1 assistance article
  - Error/warning count per URL and per schema type
  - Decision: "No schema fixes needed" OR "X critical/major issues require TASK-XX schema fixes"
- **Validation contract:** Artifact written with results table; actionable schema fix list (or explicit "none") documented
- **Planning validation:** None: S investigate task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact; if errors found, add schema fix IMPLEMENT task to Wave 3 via `/lp-do-replan` post-CHECKPOINT-01
- **Notes / references:** Schema builders: `apps/brikette/src/utils/schema/builders.ts`; existing unit tests: `apps/brikette/src/test/seo-extraction-contract.test.ts`

---

### TASK-06: /en/help bounce query pull

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-06-help-page-queries.md` — GSC query list for /en/help with intent classification
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-06-help-page-queries.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 90% — GSC searchAnalytics API with page filter on `/en/help`; same auth pattern as fact-find
  - Approach: 90% — direct data pull; low uncertainty
  - Impact: 75% — 87.5% bounce rate on /en/help is a confirmed anomaly (E2), but if there are no search queries the fix path shifts to referral/direct intent handling; score is down-biased for that uncertainty
  - Overall confidence: min(90, 90, 75) = 75% (re-computed; earlier 80% was optimistic)
  Note: Overall corrected to 75% per held-back test. Covered by no upstream INVESTIGATE (Wave 1 task); this task IS the investigation. Acceptable for INVESTIGATE tasks (≥60).
- **Questions to answer:**
  - What queries are driving traffic to /en/help?
  - What is the GA4 source/medium split for /en/help sessions (organic vs referral vs direct) in the same analysis window?
  - Are users searching for hostel FAQ/support content, or misrouted from other intent?
  - Is the bounce pattern consistent with "wrong page" vs "content missing/broken"?
- **Acceptance:**
  - Top 20 queries landing on /en/help (or all if <20)
  - GA4 source/medium segmentation for /en/help sessions documented and quantified
  - Intent classification per query: navigational / informational / transactional / misrouted
  - Recommendation: content fix, redirect to better page, or structural change
- **Validation contract:** Artifact written with GSC query table + GA4 source/medium segmentation + recommendation
- **Planning validation:** None: S investigate task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact; if redirect recommended, add IMPLEMENT task via `/lp-do-replan`
- **Notes / references:** GA4 shows 8 sessions to /en/help with 87.5% bounce and 0.7s avg duration (E2); include source/medium split before assuming a search-intent mismatch fix

---

### TASK-07: Homepage title/H1/meta optimization

- **Type:** IMPLEMENT
- **Deliverable:** Updated `buildAppMetadata()` input for homepage; updated or new title/description copy for "hostel positano" and "amalfi coast hostels" keywords
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/_lib/metadata.ts`, `[readonly] apps/brikette/src/app/[lang]/page.tsx`
- **Depends on:** TASK-01a, TASK-01b, TASK-02, TASK-03a
- **Blocks:** TASK-08 (file overlap: metadata.ts)
- **Confidence:** 75%
  - Implementation: 85% — well-established pattern; `buildAppMetadata()` is the path; existing test coverage protects regressions
  - Approach: 75% — target keywords clear from GSC (E1); but current homepage title not verified in planning; if title already includes "hostel positano" naturally, approach needs refinement. Held-back test: "What if the current title is already optimized?" — likely not given position 22, but not confirmed. Score stays 75%.
  - Impact: 75% — GSC position 22.1 for "hostel positano" → realistic ceiling 15–18 from meta changes alone; OTA authority gap caps top-10 achievement; genuine but bounded impact
  - Overall: min(85, 75, 75) = 75%. Gated behind TASK-02 so CTR/ranking deltas are not confounded by unresolved canonical mismatch.
- **Acceptance:**
  - Homepage title tag includes "hostel positano" naturally (not keyword-stuffed)
  - Homepage meta description references "Amalfi Coast" and book/hostel intent
  - H1 on homepage consistent with title strategy
  - Existing metadata snapshot tests pass (or updated to reflect intentional copy changes)
  - No regressions in other locale meta output (spot check 3 locales)
- **Validation contract (TC-09/10):**
  - TC-09: Render `/en` in staging; assert title contains "hostel positano" (case-insensitive)
  - TC-10: Existing metadata tests pass after copy update
- **Execution plan:** Red → Green → Refactor
  - Red: Pull current homepage title/description via curl or browser inspection; document current state
  - Green: Update metadata inputs; deploy to staging; run TCs
  - Refactor: Check 3 locale variants for consistency (IT, DE, FR should have translated equivalents)
- **Planning validation:** None: S task; pattern well-understood
- **Scouts:** Read current homepage title before executing; if "hostel positano" already present naturally, scope narrows to description optimization only
- **Edge Cases & Hardening:** Ensure translations of updated title/description are queued (translated meta should reflect the same keyword strategy in each locale; may require native-speaker review for IT)
- **What would make this ≥90%:** Post-deploy GSC position tracking for "hostel positano" over 28-day window showing position movement
- **Rollout / rollback:**
  - Rollout: Standard deploy; no feature flag needed for copy changes
  - Rollback: Revert metadata inputs
- **Documentation impact:** Update fact-find OPP-03 status
- **Notes / references:** E1: "hostel positano" position 22.1, 114 impressions; "amalfi coast hostels" position 9.1, 120 impressions

---

### TASK-08: /en/rooms meta description optimization

- **Type:** IMPLEMENT
- **Deliverable:** Updated rooms page metadata — title and description copy targeting booking-intent queries
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/_lib/metadata.ts`, `[readonly] apps/brikette/src/app/[lang]/rooms/page.tsx`
- **Depends on:** TASK-01a, TASK-01b, TASK-02, TASK-07 (file overlap: apps/brikette/src/app/_lib/metadata.ts)
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 85% — same pattern as TASK-07; well-understood
  - Approach: 75% — rooms page has 393 impressions at position 8.7 (E1); 0.5% CTR is very low for page 1; meta description is the most likely fix. Current meta description not verified in planning — could be generic or missing CTA.
  - Impact: 75% — position 8.7 on page 1; improving CTR from 0.5% to 2–3% would be meaningful; uncertainty is whether current description is the blocker vs rich snippet competition
  - Overall: min(85, 75, 75) = 75%. Covered by TASK-01 + TASK-02 upstream; metadata iteration starts only after canonical normalization to keep measurement interpretable.
- **Acceptance:**
  - Meta description for /en/rooms includes price signal or booking CTA ("from €X/night", "book now", "private rooms")
  - Title includes "positano" and room type
  - Existing metadata tests pass
  - 28-day post-deploy CTR delta measurable in GSC (VC tracked in measurement plan)
- **Validation contract (TC-11):**
  - TC-11: Render `/en/rooms` in staging; assert meta description includes a booking-intent signal phrase
- **Execution plan:** Red → Green → Refactor
  - Red: Document current rooms meta title/description
  - Green: Update to booking-intent copy; deploy to staging; run TC-11
  - Refactor: Check locale variants consistent
- **Planning validation:** None: S task
- **Scouts:** Read current rooms meta before executing
- **Edge Cases & Hardening:** Translations of updated copy for IT, DE, FR rooms pages (currently 1.9% CTR for Italian market)
- **What would make this ≥90%:** Post-deploy 28-day GSC CTR comparison showing improvement from 0.5% baseline
- **Rollout / rollback:** Rollout: standard deploy; Rollback: revert metadata inputs
- **Documentation impact:** Update fact-find OPP-05 status
- **Notes / references:** E1: `/en/rooms` — 393 impressions, 0.5% CTR, position 8.7

---

### TASK-09: Sitemap lastmod timestamp source feasibility

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-09-lastmod-feasibility.md` — timestamp source evaluation and implementation recommendation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-09-lastmod-feasibility.md`, `[readonly] apps/brikette/src/data/generate-guide-slugs.ts`, `[readonly] apps/brikette/scripts/generate-public-seo.ts`
- **Depends on:** -
- **Blocks:** TASK-19
- **Confidence:** 85%
  - Implementation: 90% — read guide definition files and sitemap generator; straightforward investigation
  - Approach: 90% — evaluation criteria clear: does a stable, content-meaningful timestamp exist per URL?
  - Impact: 85% — determines whether TASK-12 is a safe investment; prevents "bulk today" timestamp risk documented in fact-find
- **Questions to answer:**
  - Do guide definitions in `generate-guide-slugs.ts` include an `updatedAt` or last-modified field?
  - Is there a stable per-page data file whose mtime is a reliable proxy for content change?
  - Can git log provide per-guide-data-file last-commit dates at build time?
  - What is the risk of all URLs appearing with the same lastmod (e.g. build date)?
- **Acceptance:**
  - One of these conclusions: (a) stable per-URL timestamp source exists → proceed to TASK-12; (b) git-log approach is viable → document implementation spec; (c) no reliable source → recommend against lastmod (cancel TASK-12 via replan)
  - Decision is explicit and actionable
- **Validation contract:** Artifact written with one of the three conclusions stated; if (a) or (b), include implementation spec for TASK-12
- **Planning validation:** None: S investigate task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact; if conclusion (c), raise TASK-12 cancellation via CHECKPOINT-01 replan
- **Notes / references:** Fact-find OPP-06: "Use a stable timestamp source of truth, not 'build time now'"

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-09-lastmod-feasibility.md`
- Key evidence captured:
  - `generate-guide-slugs.ts` has no timestamp fields.
  - EN guide content date coverage is partial (`40/168` files with `lastUpdated` or `seo.lastUpdated`).
  - Filesystem mtime is unreliable in this checkout (all 168 EN guide files share one mtime date).
  - Git history can produce per-file dates in current repo (`is-shallow=false`, multiple commit-date buckets).
- Decision output: conclusion **(c)** — no reliable all-URL timestamp source in current pipeline; route TASK-12 to replan before implementation.
- Downstream propagation: TASK-12 remains `Blocked (replan required)` and now gates through TASK-19 precursor evidence.

---

### TASK-19: Lastmod eligibility matrix and URL-source mapping

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-19-lastmod-eligibility-matrix.md` — URL-class eligibility matrix for sitemap `lastmod`, source-of-truth mapping, and go/no-go recommendation for TASK-12 scope
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-19-lastmod-eligibility-matrix.md`, `[readonly] apps/brikette/scripts/generate-public-seo.ts`, `[readonly] apps/brikette/src/routing/routeInventory.ts`, `[readonly] apps/brikette/src/locales/en/guides/content/*.json`
- **Depends on:** TASK-09
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 90% — read-only mapping/audit work on known route inventory and content files
  - Approach: 85% — turns TASK-09 conclusion into explicit eligibility policy instead of all-or-nothing implementation
  - Impact: 85% — removes core uncertainty that keeps TASK-12 blocked and prevents untrusted `<lastmod>` output
- **Questions to answer:**
  - Which sitemap URL classes have authoritative date sources today? (guides, routes, static pages, rooms)
  - What date fields are available per class (`lastUpdated`, `seo.lastUpdated`, git commit date), and what normalization rules are needed?
  - What % of current sitemap URLs are eligible for trustworthy `lastmod` under strict rules?
  - Should TASK-12 proceed as scoped implementation, or be cancelled/deferred?
- **Acceptance:**
  - URL-class matrix with source mapping and reliability rating (`authoritative`, `weak`, `none`)
  - Eligibility coverage quantified with exact counts and percentages
  - Explicit recommendation: `Proceed with scoped TASK-12` OR `Cancel/defer TASK-12`
  - If proceed: include implementation spec inputs (field precedence, parser rules, fallback prohibition)
- **Validation contract:** Artifact written with matrix + coverage + decision; TASK-12 dependency gate can be evaluated from this artifact alone
- **Planning validation:** Seed evidence from TASK-09 artifact (`docs/plans/brikette-seo-traffic-growth/task-09-lastmod-feasibility.md`)
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact and update TASK-12 replan update block with resolved conditional confidence

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-19-lastmod-eligibility-matrix.md`
- URL-class matrix completed for all `4,093` sitemap URLs with reliability ratings (`authoritative` / `none`)
- Strict eligibility quantified: `681 / 4,093 = 16.64%` (all eligible URLs are guide-detail class)
- Decision output: proceed only as scoped TASK-12 implementation; full-sitemap `<lastmod>` remains unsupported by current data coverage
- Downstream propagation: TASK-12 remains blocked until `/lp-do-replan` updates scope/validation to align with TASK-19 findings

---

### TASK-10: Internal link coverage audit

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-10-internal-link-audit.md` — click-depth map from homepage to priority guide categories
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-10-internal-link-audit.md`
- **Depends on:** -
- **Blocks:** CHECKPOINT-01
- **Confidence:** 85%
  - Implementation: 90% — click-depth trace from homepage via link inspection; partially verified in fact-find (E6: homepage → /en/experiences → 27 guides visible)
  - Approach: 90% — URL graph extraction or manual trace; 3-click max is the target
  - Impact: 85% — if priority guides are unreachable within 3 clicks, internal link gaps block efficient PageRank flow to guides; confirms Wave 3 priority
- **Questions to answer:**
  - Are all 25 how-to-get-here guides reachable from homepage in ≤3 clicks?
  - Are all 20+ beach and activity guides linked?
  - Are transportation guides linked from the main navigation or category pages?
  - Are there orphan guides (linked only from sitemap, not from any page)?
- **Acceptance:**
  - Click-depth map: {guide category} → {click depth from homepage} for all 5 main guide categories
  - Count of orphan guides (if any)
  - Recommendation: "internal links are sufficient" OR specific gap list for TASK-14 scope
- **Validation contract:** Artifact with click-depth map; decision on TASK-14 scope confirmed
- **Planning validation:** None: S investigate
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact; findings feed TASK-14 (featured guides section scope)
- **Notes / references:** E6: homepage → /en/experiences → 27 direct guides; 165 total guides means /en/experiences surface is partial; token-link system: `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`

---

### TASK-11: GSC Page indexing and guide coverage sample

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md` — indexation status breakdown for 30 representative guide URLs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md`
- **Depends on:** -
- **Blocks:** CHECKPOINT-01
- **Confidence:** 85%
  - Implementation: 85% — GSC URL Inspection API; same auth and pattern as TASK-03
  - Approach: 90% — 30-URL sample (10 EN guides, 10 IT guides, 10 transport guides) per fact-find Wave 3 diagnostic spec
  - Impact: 90% — determines whether Wave 3 content activation work is viable; critical gate
- **Questions to answer:**
  - What % of sampled guide URLs are `Indexed`?
  - What % are `Crawled — currently not indexed`?
  - What % show `Duplicate — Google chose different canonical`?
  - Are transport guides being treated as duplicate/thin content vs unique content?
- **Acceptance:**
  - 30 URLs inspected (10 EN guides, 10 IT transport guides, 10 EN transport guides)
  - Indexation status breakdown: Indexed/Not-indexed/Crawled-not-indexed/Duplicate
  - Decision: "indexation is healthy → Wave 3 proceed" OR "high crawled-not-indexed → content quality issue blocks Wave 3"
  - Per fact-find Wave 3 diagnostic spec: if >`10%` Duplicate/crawled-not-indexed, Wave 3 gated on content quality first
- **Validation contract:** Artifact with status breakdown + Wave 3 go/no-go recommendation
- **Planning validation:** None: S investigate
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact; CHECKPOINT-01 uses findings to calibrate TASK-13 scope
- **Notes / references:** Fact-find Wave 3 diagnostic spec; E5 (sitemap): 4,093 indexable URLs; no lastmod

---

### CHECKPOINT-01: Wave 3 gate — reassess downstream plan

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan with TASK-12/13/14/15 confidence recalibrated from Wave 2 investigation evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/plan.md`
- **Depends on:** TASK-02, TASK-04, TASK-05, TASK-10, TASK-11
- **Blocks:** TASK-13, TASK-14, TASK-15
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution on Wave 3
  - Impact: 95% — controls Wave 3 risk (thin-content penalty scenario documented in fact-find Risks table)
- **Acceptance:**
  - `/lp-do-build` CHECKPOINT executor run
  - `/lp-do-replan` run on TASK-12, TASK-13, TASK-14, TASK-15
  - Wave 3 task confidence recalibrated using TASK-05 (schema) + TASK-10 (internal links) + TASK-11 (GSC indexation) evidence
  - If TASK-11 shows >10% Duplicate/crawled-not-indexed: TASK-13 (content quality pass) becomes the Wave 3 priority; TASK-14 (featured guides) may be deprioritized until indexation improves
  - Plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - Guide pages are indexed at acceptable rates (TASK-11 gate)
  - Internal link gaps are bounded and addressable within a single homepage section (TASK-10 gate)
  - No schema errors blocking Wave 3 rich-result eligibility (TASK-05 gate)
  - Canonical policy from TASK-02 is deployed and recrawl has started
- **Validation contract:** Plan `Last-updated` timestamp updated; TASK-13/14/15 confidence recalibrated and written into plan
- **Planning validation:** Replan evidence path: `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md` (primary gate); `task-10-internal-link-audit.md`; `task-05-schema-validation.md`
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Update plan `Last-updated` and Wave 3 task confidence values

---

### TASK-12: Implement sitemap lastmod with accurate timestamps

- **Type:** IMPLEMENT
- **Deliverable:** Updated `generate-public-seo.ts` emitting `<lastmod>` per URL from verified timestamp source; updated sitemap.xml; guard test against bulk-"today" outputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Blocked (replan required)
- **Affects:** `apps/brikette/scripts/generate-public-seo.ts`, `apps/brikette/public/sitemap.xml`
- **Depends on:** TASK-02, TASK-19 (file overlap: apps/brikette/scripts/generate-public-seo.ts)
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 80% — implementation approach comes from TASK-09; M effort due to timestamp source integration and guard test. Held-back test: "What if TASK-09 concludes no reliable source exists?" — then TASK-12 would be cancelled. Held-back test: this is a real scenario → score to 75%.
  - Approach: 80% — approach defined in TASK-09 output; conditional on TASK-09 conclusion (a) or (b). Held-back test: same scenario — if TASK-09 finds no reliable source, approach is moot. → 75%.
  - Impact: 75% — accurate lastmod improves recrawl prioritization; Google ignores inaccurate timestamps; net neutral if implemented cautiously
  - Overall: min(75, 75, 75) = 75%. Covered by TASK-19 upstream (fed by TASK-09 evidence). ✓
- **Acceptance:**
  - All `<loc>` entries in sitemap.xml have `<lastmod>` in ISO 8601 format
  - Guard test asserts: if >90% of URLs have the same lastmod date, CI fails (blocks bulk-"today" accident)
  - Spot check: 5 guide URLs — lastmod matches expected content-modified date
  - No new warnings in GSC Sitemap coverage report after resubmission
- **Validation contract (TC-12/13):**
  - TC-12: Parse generated sitemap.xml; assert all `<url>` elements have `<lastmod>` child; assert dates are valid ISO 8601
  - TC-13: Guard test: generate sitemap with mocked "all today" timestamps; assert test fails
- **Execution plan:** Red → Green → Refactor
  - Red: Current sitemap has no `<lastmod>`; document baseline with TC-12 run (expected fail)
  - Green: Integrate timestamp source from TASK-19 eligibility spec; regenerate sitemap; TC-12 passes; TC-13 passes
  - Refactor: Add to CI build validation; resubmit sitemap to GSC; monitor for errors
- **Planning validation (M task):**
  - Checks run: Confirmed `generate-public-seo.ts` is the sitemap generation script; `normalizePathname` function at lines 21–26 handles URL format
  - Validation artifacts: E5 (fact-find): sitemap.xml has 4,093 entries and no `<lastmod>` tags
  - Unexpected findings: Timestamp source TBD pending TASK-19
- **Scouts:** TASK-19 output is the precursor; do not start TASK-12 until TASK-19 decision artifact is written
- **Edge Cases & Hardening:**
  - Guard test is mandatory (blocking risky bulk-today accidents)
  - **Shallow clone risk:** If TASK-09 chooses git-log approach, Cloudflare Pages builds use shallow clones. A shallow clone with `--depth=1` returns only the latest commit for all files, making `git log --follow <file>` return a single identical date for everything. Before adopting git-log in TASK-12, verify in the build environment that `git log --follow --format=%ai <data-file>` returns file-specific dates (not a single date), or choose a static timestamp field approach from option (a) instead.
- **What would make this ≥90%:** Post-deploy GSC Sitemap coverage report showing no errors; 7-day monitoring confirms Google accepts the timestamps
- **Rollout / rollback:** Rollout: regenerate sitemap at build time; Rollback: remove lastmod from sitemap generator; redeploy
- **Documentation impact:** Update fact-find OPP-06 status

#### Re-plan Update (2026-02-22)
- Confidence: 75% (-> 85% conditional on TASK-19 completion)
- Key change: TASK-12 no longer proceeds directly from TASK-09; it now requires explicit URL-class eligibility evidence before implementation
- Dependencies: updated to TASK-02 + TASK-19 (TASK-09 replaced by formal precursor output)
- Validation contract: unchanged for implementation execution; precursor gate added via TASK-19 artifact
- Notes: replan derived from `docs/plans/brikette-seo-traffic-growth/task-09-lastmod-feasibility.md`

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
- **Depends on:** CHECKPOINT-01
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 65% — guide content structure is known; content editing is feasible; but scope depends heavily on CHECKPOINT-01 outcome (thin-content penalty scenario may require more extensive rewrites)
  - Approach: 65% — word-count increase + internal linking is the standard approach; but if guides are structurally thin (few HowTo steps, minimal route details), approach needs expansion
  - Impact: 65% — if guides are indexed but weakly ranked (Hypothesis H2 in fact-find): high potential. If guides are in `Crawled — currently not indexed`: content quality pass may help but is not the primary unlock
  - Overall: min(65, 65, 65) = 65%. Covered by CHECKPOINT-01 upstream (CHECKPOINT explicitly recalibrates this task). ✓
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
  - Checks run: Will be informed by CHECKPOINT-01 (TASK-10/11 evidence)
  - Validation artifacts: TASK-11 indexation results (primary input)
  - Unexpected findings: Pending CHECKPOINT-01
- **Scouts:** CHECKPOINT-01 is the precursor; scope of this task will be confirmed or expanded by replan
- **Edge Cases & Hardening:** 18-locale structure — EN updates should not degrade translation parity; use guide-translate skill for IT translation if needed
- **What would make this ≥90%:** CHECKPOINT-01 confirms guides are indexed but weakly ranked (not crawled-not-indexed); content word count audit done before writing
- **Rollout / rollback:** Rollout: standard deploy; Rollback: revert content files
- **Documentation impact:** Update fact-find OPP-08 status

---

### TASK-14: Homepage featured guides section

- **Type:** IMPLEMENT
- **Deliverable:** New "Explore Positano" / featured guides section on the homepage, linking to top 6–8 transportation + beach guides
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Deferred (Phase B)
- **Affects:** `apps/brikette/src/app/[lang]/page.tsx`, `apps/brikette/src/components/` (new section component)
- **Depends on:** CHECKPOINT-01
- **Blocks:** -
- **Confidence:** 65%
  - Implementation: 70% — component structure is known; M effort because 18-locale guide links need to use the token system correctly; TASK-10 determines which guides to feature
  - Approach: 65% — featured section improves PageRank flow from authoritative homepage to guide pages; only worth implementing if TASK-10/11 confirm guides are underlinked or weakly ranked
  - Impact: 65% — if guides are underlinked (TASK-10 outcome), this directly addresses the gap; if guides are already reachable, incremental impact
  - Overall: min(70, 65, 65) = 65%. Covered by CHECKPOINT-01. ✓
- **Acceptance:**
  - 6–8 guide links visible on homepage (EN)
  - Links use `%LINK:guideKey|label%` token system for locale-aware URL generation
  - Section renders correctly across all 18 locales
  - No regression in Core Web Vitals (LCP should not degrade with new section)
- **Validation contract (TC-14):**
  - TC-14: Render `/en` in staging; assert 6+ guide links present in the new section; assert links resolve to 200 in sampled locales
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-10 documents current guide click-depth; homepage link count to guide pages is baseline
  - Green: Build featured section component; integrate into homepage with TASK-10 guide selections; deploy to staging; TC-14
  - Refactor: Check all 18 locales render correctly; verify internal link token resolution
- **Planning validation (M task):**
  - Checks run: Will be informed by TASK-10 (which guides to feature) and TASK-11 (which guides are indexed)
  - Validation artifacts: TASK-10 click-depth map (primary scope input)
  - Unexpected findings: Pending CHECKPOINT-01
- **Scouts:** Read current homepage component structure before executing
- **Edge Cases & Hardening:** Token system must handle all 18 locales; guide keys must exist in slug overrides for all locales
- **What would make this ≥90%:** TASK-10 confirms specific orphan guides to feature; TASK-11 confirms those guides are indexed
- **Rollout / rollback:** Rollout: standard deploy; Rollback: remove new section component
- **Documentation impact:** Update fact-find OPP-11 status; update E6 internal link evidence

---

### TASK-15: Italian locale meta/title quality pass

- **Type:** IMPLEMENT
- **Deliverable:** Updated Italian meta titles and descriptions for top 10 pages by Italian impression volume
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/_lib/metadata.ts`
- **Depends on:** CHECKPOINT-01
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 85% — metadata pattern established; same approach as TASK-07/08 but for IT locale
  - Approach: 75% — 530 Italian impressions at 1.9% CTR in GSC (E1); improving CTR is the lever; but current IT meta quality not inspected — may already be reasonable. Score at 75% due to this gap.
  - Impact: 75% — CTR from 1.9% to 3.5% target (H4 in fact-find) = ~8 extra clicks/90 days; modest but measurable
  - Overall: min(85, 75, 75) = 75%. Covered by CHECKPOINT-01 upstream. ✓
- **Acceptance:**
  - Top 10 Italian pages by impression volume have reviewed/updated IT meta titles and descriptions
  - CTR measurement: GSC Italian CTR tracked for 8 weeks post-deploy (H4 validation)
  - No regressions in EN or other locale metadata
- **Validation contract (VC-02):**
  - VC-02: GSC Italian CTR ≥3.5% within 8 weeks post-deploy (H4 pass threshold); sample: Italian country segment. Deadline: 8 weeks post-deploy.
- **Execution plan:** Red → Green → Refactor
  - Red: Pull current IT CTR from GSC (1.9% baseline) and identify top 10 IT pages
  - Green: Update IT meta copy; deploy to staging; verify metadata renders in IT locale
  - Refactor: Monitor GSC Italian CTR over 4-week window; adjust if no improvement
- **Planning validation:** None: S task; pattern established
- **Scouts:** May need native Italian speaker review for copy quality (flag if quality is substandard)
- **Edge Cases & Hardening:** Ensure EN meta not touched; test that `[lang]=it` metadata routes correctly
- **What would make this ≥90%:** Native Italian speaker review; two iteration cycles with 28-day period-over-period GSC CTR comparison
- **Rollout / rollback:** Standard deploy / revert
- **Documentation impact:** Update fact-find OPP-10 status; record H4 validation start date

---

### TASK-16: Google Business Profile audit and refresh

- **Type:** IMPLEMENT
- **Deliverable:** Completed GBP audit checklist + at minimum: 10 new photos uploaded, Q&A section reviewed, business description updated, one GBP post published
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Google Business Profile for Hostel Brikette
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** GBP audit checklist signed off; screenshots of updated profile
- **Measurement-Readiness:** GBP Insights/Performance monthly (views, searches, calls, direction requests, website clicks) + monthly manual neutral-profile SERP spot-check for 3 target queries
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 85% — manual ops; no API required; checklist is clear
  - Approach: 75% — GBP optimization for local pack is well-established; but current GBP state not audited. Held-back test: "What if GBP is already fully optimized?" — possible; score stays 75%.
  - Impact: 75% — "hostel positano" and "hostels in positano" are local queries; local pack is above organic for these terms; even modest GBP improvements can capture local pack position
  - Overall: min(85, 75, 75) = 75%.
- **Acceptance:**
  - GBP audit checklist completed (photos, description, category, Q&A, posts)
  - At least 10 new photos uploaded
  - Business description updated to include key terms ("hostel positano", "amalfi coast")
  - One GBP post published
- **Validation contract (VC-03):**
  - VC-03: GBP profile score ≥80 on audit checklist by completion; documented with screenshots. Deadline: 2 weeks post-task start.
- **Execution plan:** Red → Green → Refactor
  - Red evidence: Current GBP state documented (photo count, description review, Q&A gaps)
  - Green evidence: All checklist items completed; changes live on GBP
  - Refactor: Monitor local pack appearance for "hostel positano" monthly
- **Planning validation:** None: S ops task
- **Scouts:** None: manual ops
- **Edge Cases & Hardening:** None: no code dependencies
- **What would make this ≥90%:** Audit shows specific optimization gaps; post-update local pack appearance within 30 days
- **Rollout / rollback:** None: manual ops; no code changes
- **Documentation impact:** Write GBP audit checklist artifact at `docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md`
- **Notes / references:** OPP-12: local SEO; "hostel positano" queries likely show Maps/local pack above organic

---

### TASK-17: Backlink outreach targeting

- **Type:** IMPLEMENT
- **Deliverable:** Outreach target list (10 travel blogs/editorial sites) + pitch template + 10 pitches sent (documented)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Deferred (Phase B)
- **Artifact-Destination:** `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** Target list approved; pitch template reviewed; outreach log
- **Measurement-Readiness:** GSC Links report monthly; track referring domain count; Peter / monthly
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Depends on:** TASK-18
- **Blocks:** -
- **Confidence:** 60%
  - Implementation: 75% — outreach process is clear; no tools required beyond research + email
  - Approach: 60% — target identification not done; approach (pitch editorial link placement) is generic without knowing which blogs are active and accepting pitches
  - Impact: 60% — high expected impact (authority is the primary blocker for top-10 non-branded terms); but highly uncertain — depends on response rates and editorial decisions outside our control
  - Overall: min(75, 60, 60) = 60%. Above INVESTIGATE threshold but below IMPLEMENT threshold. Running as IMPLEMENT because the business-artifact execution model (Red → Green → Refactor) is appropriate; failure is defined explicitly.
  Note: confidence below 80% IMPLEMENT threshold. This task is explicitly deferred to Phase B and excluded from current-phase confidence math; run `/lp-do-replan` before execution.
- **Acceptance:**
  - Target list of ≥10 travel blogs/editorial sites identified using tool-free criteria: active Amalfi Coast/Positano content published in last 12 months (verifiable via web search); author email or contact form accessible; editorial (not paid placement) based on link disclosure policy
  - No paid SEO tools (Ahrefs/SEMrush DA scores) required — use tool-free proxies: site age, editorial depth, Google search snippet quality, and GSC Links data from TASK-18 to identify existing referrers
  - Pitch template drafted and reviewed
  - 10 outreach emails sent (documented in outreach log)
- **Validation contract (VC-04):**
  - VC-04: ≥3 editorial responses (positive or interested) within 60 days of pitches sent; OR ≥1 confirmed editorial link published. Deadline: 60 days post-outreach. Minimum sample: 10 pitches sent.
- **Execution plan:** Red → Green → Refactor
  - Red evidence: TASK-18 GSC Links baseline (actual referring domains); current backlink profile documented from TASK-18 artifact; supplement with manual Google search for "site:X positano" to identify active coverage
  - Green evidence: Target list written using tool-free criteria; 10 pitches sent; outreach log started
  - Refactor: 30-day follow-up on non-responses; track GSC Links report for new referring domains monthly
- **Planning validation (M task):**
  - Checks run: None (backlink strategy research is part of the task itself)
  - Validation artifacts: TASK-18 GSC Links baseline (primary); E2 (only Lonely Planet referral visible in GA4 — TASK-18 will confirm whether additional links exist)
  - Unexpected findings: Backlink profile may be stronger than inferred — TASK-18 establishes actual baseline before targeting
- **Scouts:** TASK-18 must complete before starting; use TASK-18 data to seed target list with sites that already mention the hostel (warm contacts)
- **Edge Cases & Hardening:** Do not use link-buying schemes or private blog networks (SEO penalty risk); editorial-only outreach
- **What would make this ≥90%:** Pre-identified warm contacts at target publications; Lonely Planet contact already established via existing referral
- **Rollout / rollback:** None: outreach is irreversible; rollback is not applicable
- **Documentation impact:** Write target list and outreach log at `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Notes / references:** OPP-13: backlink acquisition is the primary lever for head-term top-10 rankings; H5 in fact-find

---

### TASK-18: GSC Links baseline pull

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md` plus raw CSV exports in `docs/plans/brikette-seo-traffic-growth/artifacts/task-18-links-export/` from Search Console UI (Links report: Top linking sites, Top linked pages, and anchors if available)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md`
- **Depends on:** -
- **Blocks:** TASK-17
- **Confidence:** 85%
  - Implementation: 90% — manual export from Search Console UI Links report is straightforward and avoids non-existent API dependencies
  - Approach: 85% — export top linking domains, top linked pages, and anchors (if exposed); establish baseline from first-party Search Console report rather than GA4 inference
  - Impact: 85% — fact-find noted GSC Links not pulled (1-04, confidence gap); TASK-17 requires a real baseline to target effectively; also feeds confidence recalibration for H5
- **Questions to answer:**
  - How many unique referring domains link to hostel-positano.com?
  - Which pages on hostel-positano.com receive the most external links?
  - Are there any unexpected or potentially harmful linking domains?
  - Is the Lonely Planet link the only significant editorial referral, or are there others?
  - What anchor text patterns are used in inbound links?
- **Acceptance:**
  - Top linking sites export captured (full export if available; otherwise max available rows documented)
  - Top linked pages export captured (full export if available; otherwise max available rows documented)
  - Anchor export captured if UI exposes it for this property; if not exposed, explicitly recorded as unavailable
  - Summary table in markdown includes top 20 domains/pages (or all if fewer) with counts
  - Export row limits/constraints explicitly documented in the artifact
  - Decision output: "Backlink profile thinner than assumed — TASK-17 targeting criteria confirmed" OR "Existing referrer relationships identified — warm outreach targets noted"
- **Validation contract:** Artifact written with all data points above; decision output stated; TASK-17 confirms it has read this artifact before execution
- **Planning validation:** Verified approach uses Search Console UI export (Links report), not API endpoints
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Write artifact at `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md`; update fact-find Confidence Adjustments (gap 1-04 noted as resolved)
- **Notes / references:**
  - Method: Search Console UI → Links → External links → Export (CSV/Sheets/Excel)
  - Constraint: export row counts can be capped by UI/report limits; record the exact captured row count in artifact
  - Gap identified in fact-find evidence audit (1-04): "GSC Links report not pulled — backlink thinness inferred from GA4, not measured"

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google has already assessed translated guide corpus as thin/low-value content | Medium | High — invalidates Wave 3 | CHECKPOINT-01 gate enforces TASK-11 indexation evidence before Wave 3 executes |
| OTA authority blocks "hostel positano" top-10 regardless of on-page work | High | Medium — limits realistic ceiling to 15–18 | Expectations set in plan; success metric is position ≤18, not top-10 |
| Canonical policy rollout partially applied (redirects changed, metadata not updated, or vice versa) | Medium | High — worsens recrawl quality | TASK-01a+01b and TASK-02 are separate tasks with explicit TCs; TASK-03b validates canonical state post-TASK-01a+01b+02 deploy |
| `ensureTrailingSlash` call sites missed in TASK-02 | Low | Medium — silent regression; canonical/hreflang stays inconsistent | Consumer trace in planning validation identified all 8 call-sites; TASK-02 acceptance includes codebase-wide grep confirmation before marking complete |
| Operator selects trailing-slash policy (Option B) instead of slashless | Low | Medium — TASK-02 execution plan changes | DECISION-01 gate blocks TASK-02 until operator confirmation; if Option B selected, route to `/lp-do-replan` before executing |
| Backlink acquisition yields zero editorial links in 3 months | High | High for head-term rankings | Backlink work runs as parallel workstream from Wave 1; set realistic long-horizon expectations; authority is separate from on-page work |
| sitemap lastmod implementation introduces build-time errors or bulk "today" timestamps | Low | Low | TASK-09 validates source; TASK-12 guard test blocks bulk-today accident |
| 18-locale hreflang/canonical changes cause indexing regressions | Low | High | TASK-04 runs pre/post TASK-02 reciprocity checks; TC validation covers sampled locales; GSC URL Inspection post-TASK-02 confirms canonical consolidation |

## Observability

- **GSC position tracking:** Weekly check for "hostel positano" (position 22 baseline), "hostels in positano" (11.3), "amalfi coast hostels" (9.1), "positano hostels" (19.7)
- **GSC CTR tracking:** Rooms page (/en/rooms) 0.5% CTR baseline; Italian country segment 1.9% CTR baseline
- **GSC URL Inspection:** Post-TASK-02 canonical mismatch rate (declared vs Google-selected); run on 8 representative URLs
- **GSC organic clicks:** Weekly organic click count; baseline ~112/90 days (~1.2/day); H1 pass: directional improvement in 8 weeks
- **GA4 organic sessions:** Weekly check; baseline ~1.7/day (13-day window); TASK-11 (GSC Page indexing sample) provides guide-page coverage diagnostic
- **GSC Sitemap coverage:** Monitor after TASK-12 for errors/warnings in lastmod processing
- **GSC Links:** Monthly check on referring domain count using TASK-18 UI export baseline
- **GBP Insights:** Monthly GBP Performance metrics (views, searches, calls, directions, website clicks) + neutral-profile SERP spot-check for three core local queries

## Acceptance Criteria (overall)

- [ ] `https://www.hostel-positano.com/en/rooms` resolves to `https://hostel-positano.com/en/rooms` in one permanent host-normalization hop (TC-01a-path)
- [ ] `https://www.hostel-positano.com/` resolves to `https://hostel-positano.com/en` in <=2 permanent hops (www→apex, apex→/en), no `302` in chain, final `200` (TC-01a + TC-01b)
- [ ] Root apex `/` resolves to `/en` via a single permanent redirect with no extra 3xx from `/en` itself (TC-01b)
- [ ] No canonical tag target URL returns a 3xx (all canonical targets return `200` directly)
- [ ] GSC URL Inspection post-TASK-02 (TASK-03b): declared canonical = Google-selected canonical on ≥90% of sampled URLs (100% for homepage, rooms, and locale-root templates we fully control; ≥90% overall)
- [ ] Rooms page CTR ≥1.5% within 28-day GSC window post-TASK-08 (baseline: 0.5%)
- [ ] Homepage "hostel positano" position ≤18 (28-day GSC average) within 8 weeks of TASK-01+02 deploy
- [ ] Wave 3 gate: CHECKPOINT-01 completed; downstream task confidence recalibrated from evidence
- [ ] GBP audit complete; at least one active GBP post published (TASK-16)

## Decision Log

- 2026-02-22: Canonical URL policy recommendation = slashless (Option A). Rationale: matches runtime 308 behavior; eliminates canonical-to-redirect mismatch with no new infrastructure needed. Execution is blocked by DECISION-01 until operator confirmation is recorded.
- 2026-02-22: Wave 3 gated on CHECKPOINT-01 (TASK-05, TASK-10, TASK-11 must complete). Rationale: fact-find risk table — high risk of thin-content penalty on translated guide corpus; confirmation required before investing in content activation.
- 2026-02-22: TASK-13, TASK-14, and TASK-17 are deferred to Phase B and excluded from current-phase confidence scope. Rationale: each is checkpoint-dependent or below IMPLEMENT confidence threshold; defer until CHECKPOINT-01 replan confirms viability.

## Overall-confidence Calculation (Phase A)

Current-phase confidence includes executable Wave 1–6 tasks and excludes deferred Phase B tasks (TASK-13, TASK-14, TASK-17).

| Task | Type | Confidence | Effort | Weighted |
|---|---|---|---|---|
| TASK-01c | INVESTIGATE | 90 | S=1 | 90 |
| TASK-01a | IMPLEMENT | 85 | S=1 | 85 |
| TASK-01b | IMPLEMENT | 80 | S=1 | 80 |
| DECISION-01 | DECISION | 95 | S=1 | 95 |
| TASK-02 | IMPLEMENT | 75 | M=2 | 150 |
| TASK-03a | INVESTIGATE | 85 | S=1 | 85 |
| TASK-03b | INVESTIGATE | 90 | S=1 | 90 |
| TASK-04 | INVESTIGATE | 80 | S=1 | 80 |
| TASK-05 | INVESTIGATE | 80 | S=1 | 80 |
| TASK-06 | INVESTIGATE | 75 | S=1 | 75 |
| TASK-07 | IMPLEMENT | 75 | S=1 | 75 |
| TASK-08 | IMPLEMENT | 75 | S=1 | 75 |
| TASK-09 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-19 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-10 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-11 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-18 | INVESTIGATE | 85 | S=1 | 85 |
| CHECKPOINT-01 | CHECKPOINT | 95 | S=1 | 95 |
| TASK-12 | IMPLEMENT | 75 | M=2 | 150 |
| TASK-15 | IMPLEMENT | 75 | S=1 | 75 |
| TASK-16 | IMPLEMENT | 75 | S=1 | 75 |
| **Total (Phase A scope)** | | | **23** | **1,880** |

**Overall-confidence (Phase A) = 1,880 / 23 = 82%**

Phase-B sensitivity (if deferred tasks are included now):
- Add TASK-13 (120), TASK-14 (130), TASK-17 (120) => full-roadmap confidence `2,250 / 29 = 78%`.

Critique trigger: Phase-A Trigger 1 clears (`82% >= 80%`). Remaining sub-80 IMPLEMENT tasks (TASK-02, TASK-07, TASK-08, TASK-12) are backed by upstream investigate gates (TASK-03a, TASK-01c, TASK-09, TASK-19). Phase-B tasks remain intentionally deferred until CHECKPOINT-01-driven replan.
