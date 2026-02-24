---
Type: Plan
Status: Draft
Domain: SEO | Data | Infra
Workstream: Mixed
Created: 2026-02-22
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Last-sequenced: 2026-02-23
Relates-to charter: none
Feature-Slug: brikette-seo-traffic-growth
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo
Overall-confidence: 83% (Phase A execution scope, post-TASK-20)
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
---

# Brikette SEO Traffic Growth Plan

## Summary

hostel-positano.com has ~4,093 indexable URLs, full hreflang, and broad structured data coverage, yet generates near-zero non-branded organic traffic (~1.7 organic sessions/day). Three confirmed technical blockers existed and are now fixed: (1) `www` host normalization to apex, (2) root redirect chain permanence and hop reduction, and (3) canonical/sitemap trailing-slash mismatch versus runtime slashless URLs. Current Wave-3 gate evidence shows a discovery/indexation constraint on sampled guide URLs, so this plan now prioritizes internal surfacing before content expansion while preserving post-canonical validation and backlink baseline dependencies.

## Active tasks
- [x] TASK-01a: Cloudflare Bulk Redirects — www→apex host redirect (Complete 2026-02-22)
- [x] TASK-01b: Fix root redirect in _redirects (302→301, slashless target) (Complete 2026-02-22)
- [x] TASK-01c: Pages Functions preflight check (Complete 2026-02-22)
- [x] DECISION-01: Confirm slashless canonical policy (Complete 2026-02-22)
- [x] TASK-02: Align trailing-slash canonical policy across canonicals, hreflang, sitemap, and tests (Complete 2026-02-22)
- [x] TASK-03a: GSC URL Inspection canonical sample — pre-change baseline (Complete 2026-02-22)
- [ ] TASK-03b: GSC URL Inspection canonical sample — post-change validation (Run no earlier than 2026-03-01 unless fresh recrawl)
- [x] TASK-04: hreflang reciprocity sampling (Complete 2026-02-22)
- [x] TASK-05: Structured-data validation sample (Complete 2026-02-22)
- [x] TASK-06: /en/help bounce query pull (Complete 2026-02-22)
- [x] TASK-07: Homepage title/H1/meta optimization (Complete 2026-02-22)
- [x] TASK-08: /en/rooms meta description optimization (Complete 2026-02-22)
- [x] TASK-09: Sitemap lastmod timestamp source feasibility (Complete 2026-02-22)
- [x] TASK-19: Lastmod eligibility matrix and URL-source mapping (Complete 2026-02-22)
- [x] TASK-10: Internal link coverage audit (Complete 2026-02-22)
- [x] TASK-11: GSC Page indexing + guide coverage sample (Complete 2026-02-22)
- [x] CHECKPOINT-01: Wave 3 gate — reassess downstream plan (Complete 2026-02-22)
- [x] TASK-12: Implement scoped sitemap lastmod for eligible guide URLs (Complete 2026-02-22)
- [ ] TASK-13: Content quality pass on top transportation guides (Phase B, post-CHECKPOINT-01)
- [x] TASK-14: Homepage featured guides section (Complete 2026-02-22)
- [x] TASK-15: Italian locale meta/title quality pass (Complete 2026-02-22)
- [x] TASK-16: Google Business Profile audit and refresh (Complete 2026-02-23; manual execution attested, description UI exception logged)
- [ ] TASK-17: Backlink outreach targeting (Phase B)
- [x] TASK-18: GSC Links baseline pull (Complete 2026-02-23)
- [x] TASK-20: Backlink target vetting + contactability matrix (Complete 2026-02-23; Phase B precursor)
- [ ] TASK-21: Outreach pack rehearsal + approval gate (Blocked: awaiting reviewer sign-off evidence)

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
  - Operator confirmation was required before TASK-02 execution (policy choice is architectural), captured as DECISION-01
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
- **Chosen approach: Option A — Slashless.** Simpler, fewer moving parts, matches existing runtime behavior. Operator confirmation captured in DECISION-01.
- www→apex (Cloudflare Bulk Redirects dashboard) and root 302→301 fixes are policy-independent and can ship immediately after pre-change canonical baseline capture (TASK-03a); canonical-policy approval (DECISION-01) gates only TASK-02.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: No (reset after structural changes)
- Auto-build eligible: No (plan-only mode; no explicit auto-build instruction)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01c | INVESTIGATE | Pages Functions preflight check | 90% | S | Complete (2026-02-22) | - | TASK-01a, TASK-01b |
| TASK-01a | IMPLEMENT | Cloudflare Bulk Redirects — www→apex | 85% | S | Complete (2026-02-22) | TASK-01c, TASK-03a | TASK-07, TASK-08, TASK-03b |
| TASK-01b | IMPLEMENT | Fix root redirect in _redirects (302→301) | 80% | S | Complete (2026-02-22) | TASK-01c, TASK-03a | TASK-07, TASK-08, TASK-03b |
| TASK-03a | INVESTIGATE | GSC URL Inspection — pre-change baseline | 85% | S | Complete (2026-02-22) | - | TASK-01a, TASK-01b, DECISION-01, TASK-02, TASK-07 |
| DECISION-01 | DECISION | Confirm slashless canonical policy (operator checkpoint) | 95% | S | Complete (2026-02-22) | TASK-03a | TASK-02 |
| TASK-02 | IMPLEMENT | Trailing-slash canonical policy alignment | 80% | M | Complete (2026-02-22) | TASK-03a, DECISION-01 | CHECKPOINT-01, TASK-03b, TASK-07, TASK-08, TASK-12 |
| TASK-03b | INVESTIGATE | GSC URL Inspection — post-change validation | 90% | S | Pending (time-gated: >=2026-03-01 or fresh recrawl) | TASK-01a, TASK-01b, TASK-02 | - |
| TASK-04 | INVESTIGATE | hreflang reciprocity sampling (pre/post TASK-02) | 80% | S | Complete (2026-02-22) | - | CHECKPOINT-01 |
| TASK-05 | INVESTIGATE | Structured-data validation | 80% | S | Complete (2026-02-22) | - | CHECKPOINT-01 |
| TASK-06 | INVESTIGATE | /en/help bounce query pull | 75% | S | Complete (2026-02-22) | - | - |
| TASK-07 | IMPLEMENT | Homepage title/H1/meta for "hostel positano" | 82% | S | Complete (2026-02-22) | TASK-01a, TASK-01b, TASK-02, TASK-03a | TASK-08 |
| TASK-08 | IMPLEMENT | /en/rooms meta description optimization | 82% | S | Complete (2026-02-22) | TASK-01a, TASK-01b, TASK-02, TASK-07 | - |
| TASK-09 | INVESTIGATE | Sitemap lastmod timestamp source feasibility | 85% | S | Complete (2026-02-22) | - | TASK-19 |
| TASK-19 | INVESTIGATE | Lastmod eligibility matrix + URL-source mapping | 85% | S | Complete (2026-02-22) | TASK-09 | TASK-12 |
| TASK-10 | INVESTIGATE | Internal link coverage audit | 85% | S | Complete (2026-02-22) | - | CHECKPOINT-01 |
| TASK-11 | INVESTIGATE | GSC Page indexing + guide coverage | 85% | S | Complete (2026-02-22) | - | CHECKPOINT-01 |
| TASK-18 | INVESTIGATE | GSC Links baseline pull | 85% | S | Complete (2026-02-23) | - | TASK-17 |
| CHECKPOINT-01 | CHECKPOINT | Wave 3 gate — reassess downstream plan | 95% | S | Complete (2026-02-22) | TASK-02, TASK-04, TASK-05, TASK-10, TASK-11 | TASK-13, TASK-14, TASK-15 |
| TASK-12 | IMPLEMENT | Scoped sitemap lastmod (eligible guide URLs) | 80% | M | Complete (2026-02-22) | TASK-02, TASK-19 | - |
| TASK-13 | IMPLEMENT | Content quality pass — top transportation guides | 45% | M | Deferred (Phase B) | CHECKPOINT-01, TASK-03b | - |
| TASK-14 | IMPLEMENT | Homepage featured guides section | 82% | M | Complete (2026-02-22) | CHECKPOINT-01 | - |
| TASK-15 | IMPLEMENT | Italian locale meta/title quality pass | 82% | S | Complete (2026-02-22) | CHECKPOINT-01 | - |
| TASK-16 | IMPLEMENT | Google Business Profile audit and refresh | 75% | S | Complete (2026-02-23; manual execution attested) | - | - |
| TASK-17 | IMPLEMENT | Backlink outreach targeting | 65% (->82% conditional on TASK-21) | M | Deferred (Phase B; TASK-21 gate pending) | TASK-18, TASK-20, TASK-21 | - |
| TASK-20 | INVESTIGATE | Backlink target vetting + contactability matrix | 85% | S | Complete (2026-02-23) | TASK-18 | TASK-17 |
| TASK-21 | INVESTIGATE | Outreach pack rehearsal + approval gate | 80% | S | Blocked (awaiting reviewer sign-off evidence) | TASK-20 | TASK-17 |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01c, TASK-03a, TASK-04 (pre-pass), TASK-05, TASK-06, TASK-09, TASK-10, TASK-11, TASK-18 | None | Complete for all listed tasks, including TASK-18 via operator-provided Search Console UI exports. |
| Ongoing | TASK-16 | None | Complete (2026-02-23): manual dashboard execution completed via operator attestation; API entitlement (case `1-1062000040302`) remains pending only for future automation use. |
| 2 | DECISION-01, TASK-19 | DECISION-01: TASK-03a; TASK-19: TASK-09 | DECISION-01 is operator checkpoint for TASK-02. TASK-19 converts TASK-09 findings into an actionable URL-class eligibility contract for TASK-12. |
| 3 | TASK-01a, TASK-01b, TASK-02 | TASK-01a+01b: after TASK-01c AND TASK-03a; TASK-02: after TASK-03a + DECISION-01 | TASK-01a and TASK-01b deploy together. TASK-02 gate was satisfied by DECISION-01 and is now complete. |
| 4 | TASK-03b, TASK-04 (post-pass), TASK-07 | TASK-03b: after TASK-01a + TASK-01b + TASK-02 and no earlier than T+7 days or verified recrawl; TASK-04 post-pass: after TASK-02 (with pre-pass already captured in Wave 1); TASK-07: after TASK-01a + TASK-01b + TASK-02 + TASK-03a | TASK-04 post-pass and TASK-07 are complete. TASK-03b run-gate check completed but full validation is deferred until `2026-03-01` unless fresh recrawl appears earlier. |
| 5 | TASK-08 | TASK-01a, TASK-01b, TASK-02, TASK-07 (sequence gate for attribution) | Complete (2026-02-22). |
| CHECKPOINT | CHECKPOINT-01 | TASK-02, TASK-04, TASK-05, TASK-10, TASK-11 | Complete (2026-02-22). Output: TASK-14 promoted, TASK-13 remains deferred, TASK-12/TASK-15 confidence reduced, TASK-03b date-gated. |
| 6 | TASK-12, TASK-14, TASK-15 | TASK-12: after TASK-02 + TASK-19 (file overlap: generate-public-seo.ts); TASK-14/TASK-15: after CHECKPOINT-01 | TASK-12, TASK-14, and TASK-15 are complete. |
| 7 (Phase B precursor) | TASK-20 | TASK-20: after TASK-18 | Complete (2026-02-23): target-quality/contactability evidence captured for TASK-17 promotion path. |
| 8 (Phase B precursor) | TASK-21 | TASK-21: after TASK-20 | Blocked (2026-02-23): outreach pack drafted; awaiting reviewer sign-off evidence before promotion. |
| Deferred (Phase B) | TASK-13, TASK-17 | TASK-13: after CHECKPOINT-01 plus TASK-03b recrawl/indexation signal; TASK-17: after TASK-21 | TASK-17 remains below IMPLEMENT threshold until TASK-21 is completed; re-run `/lp-do-replan` after TASK-21 if still below threshold. |

**Max parallelism:** 9 tasks (Wave 1: TASK-01c, TASK-03a, TASK-04, TASK-05, TASK-06, TASK-09, TASK-10, TASK-11, TASK-18)
**Critical path:** TASK-03a → DECISION-01 → TASK-02 → CHECKPOINT-01 → TASK-12 (6 waves minimum)
**Total tasks:** 26 tasks + 1 checkpoint (DECISION-01, TASK-01a, TASK-01b, TASK-01c, TASK-02, TASK-03a, TASK-03b, TASK-04–TASK-21)

---

## Tasks

---

### TASK-01c: Pages Functions preflight check

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-01c-pages-functions-check.md` — confirmation of whether any Pages Functions are active and whether they intercept /, /en, or www-origin requests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-01c-pages-functions-check.md`
- Repo scan found no Brikette `functions/` directory; `functions/` paths exist only under `apps/prime/`
- Deploy pipeline evidence confirms static Pages deploy (`wrangler pages deploy out`) from `apps/brikette/out`
- Conclusion recorded: no Functions shadowing blocker for TASK-01a/TASK-01b in repo-managed deploy path

---

### TASK-01a: Cloudflare Bulk Redirects — www→apex host redirect

- **Type:** IMPLEMENT
- **Deliverable:** Cloudflare Bulk Redirects configured end-to-end: (1) Redirect List entry with source `www.hostel-positano.com/` (no scheme), target `https://hostel-positano.com`, and parameters `SUBPATH_MATCHING=TRUE`, `PRESERVE_PATH_SUFFIX=TRUE`, `PRESERVE_QUERY_STRING=TRUE`; plus (2) enabled Bulk Redirect Rule referencing that list with permanent redirect status. TC-verified with curl probes and documented in `docs/plans/brikette-seo-traffic-growth/task-01a-bulk-redirects.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** Cloudflare dashboard (Bulk Redirects rules)
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** Cloudflare API evidence (list ID, list item, ruleset/rule IDs, enabled state) + curl TC-01a probes
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

**Build completion evidence (2026-02-22):**
- Redirect list created: `brikette_www_to_apex` (`a0ea9ccf37284ee1923a6121922af712`) with item `www.hostel-positano.com/` → `https://hostel-positano.com` and params `SUBPATH_MATCHING=TRUE`, `PRESERVE_PATH_SUFFIX=TRUE`, `PRESERVE_QUERY_STRING=TRUE`, status `301`.
- Redirect phase ruleset created: `418b67f09e0340dbb49919915e2cf175` with enabled rule `brikette_www_to_apex` (`54a6c9f6fc5d4f9ea7f7be4c4d514b8f`), expression `http.request.full_uri in $brikette_www_to_apex`.
- TC probes pass for host/path/query normalization (`https://www.../en`, `https://www.../en/rooms`, `http://www.../en/rooms?ref=test`).
- Post-deploy production probes confirm root now resolves with permanent redirects only (`https://hostel-positano.com/` → `301` → `/en` → `200`); TASK-01 atomicity gate is satisfied.

---

### TASK-01b: Fix root redirect in _redirects (302→301, slashless target)

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/public/_redirects` — root rule changed from `/ /en/ 302` to `/ /en 301`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Root rule updated in generator source: `apps/brikette/scripts/generate-static-export-redirects.ts` (`/  /en/  302` -> `/  /en  301`)
- Redirect file regenerated via `pnpm --filter @apps/brikette generate:static-redirects`
- Generated output now contains slashless permanent root redirect: `apps/brikette/public/_redirects` line 6 = `/  /en  301`
- Generator hardening: preserved existing `stepfreepositano.com` host rules in script output to avoid accidental rule loss on future regeneration
- Environment limitation: live external `curl -IL https://hostel-positano.com/` verification could not be completed in this runtime (DNS resolution failure observed previously)

---

### DECISION-01: Confirm slashless canonical policy (operator checkpoint)

- **Type:** DECISION
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/decision-01-canonical-policy.md` — explicit operator confirmation of slashless policy (Option A) or rejection with replan requirement
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Decision artifact created: `docs/plans/brikette-seo-traffic-growth/decision-01-canonical-policy.md`
- Operator confirmation recorded: `Approved: slashless (Option A)` via chat instruction ("go with option a")
- Approver identity recorded in artifact: Peter Cowling (operator)
- Downstream effect: TASK-02 policy-choice uncertainty removed; confidence uplift completed (`75% -> 80%`) and execution unblocked

---

### TASK-02: Align trailing-slash canonical policy (slashless)

- **Type:** IMPLEMENT
- **Deliverable:** Slashless canonical URLs across hreflang, metadata canonicals, and sitemap; updated metadata tests; updated sitemap test
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/utils/seo.ts`, `apps/brikette/src/app/_lib/metadata.ts`, `packages/seo/src/metadata/buildMetadata.ts`, `packages/seo/src/metadata/buildAlternates.ts`, `packages/seo/src/metadata/ensureNoTrailingSlash.ts`, `packages/seo/src/metadata/index.ts`, `packages/seo/src/index.ts`, `apps/brikette/scripts/generate-public-seo.ts`, `apps/brikette/public/sitemap.xml`, `apps/brikette/src/test/lib/metadata.test.ts`, `apps/brikette/src/test/utils/seo.test.ts`, `apps/brikette/src/test/utils/seo.logic.test.ts`, `apps/brikette/src/test/seo-extraction-contract.test.ts`, `packages/seo/src/__tests__/metadata.test.ts`, `[readonly] packages/seo/src/metadata/ensureTrailingSlash.ts`
- **Depends on:** TASK-03a, DECISION-01
- **Blocks:** CHECKPOINT-01, TASK-03b, TASK-07, TASK-08, TASK-12 (file overlap: generate-public-seo.ts)
- **Confidence:** 80%
  - Implementation: 80% — 8 call-sites of `ensureTrailingSlash` confirmed in 4 source files and key regression test surfaces are now explicitly identified (`packages/seo/src/__tests__/metadata.test.ts`, `apps/brikette/src/test/lib/metadata.test.ts`, `apps/brikette/src/test/utils/seo.test.ts`, `apps/brikette/src/test/seo-extraction-contract.test.ts`). Scope remains M, but uncertainty about where slash assertions live is reduced.
  - Approach: 85% — DECISION-01 is now approved for slashless policy (Option A), removing policy ambiguity while retaining the same execution approach.
  - Impact: 80% — E1/E3 confirms canonical-to-redirect mismatch is actively causing signal split (5 URL variants in GSC); slashless canonicals will eliminate the redirect hop from canonical target. Held-back test: "Would Google already handle this via the 308?" — E1 shows 5 variants including both `/en` and `/en/` each with independent impressions/clicks, proving the 308 is NOT consolidating GSC signals. Held-back test passes.
  - Overall: min(80, 85, 80) = 80%.
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
- **Scouts:** DECISION-01 completed with Option A (slashless). If policy is later reversed, stop and route to `/lp-do-replan` before execution.
- **Edge Cases & Hardening:**
  - Ensure `packages/seo` changes don't affect other apps in the monorepo that may import from `@acme/seo` and rely on trailing-slash behavior
  - Add a regression test that asserts no `<canonical>` href ends in `/` (guards against future re-introduction)
- **What would make this ≥90%:**
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

#### Re-plan Update (2026-02-22)
- Confidence: `75% -> 80%` after DECISION-01 completion and explicit test-surface enumeration
- Key change: policy uncertainty removed (Option A approved) and implementation risk narrowed to known files/tests
- Dependencies: unchanged (`TASK-03a`, `DECISION-01`) and both are complete

**Build completion evidence (2026-02-22):**
- Slashless canonical/hreflang rollout shipped in code:
  - `apps/brikette/src/utils/seo.ts`
  - `apps/brikette/src/app/_lib/metadata.ts`
  - `packages/seo/src/metadata/buildAlternates.ts`
  - `packages/seo/src/metadata/buildMetadata.ts`
  - `apps/brikette/scripts/generate-public-seo.ts`
- Shared slashless helper added and exported:
  - `packages/seo/src/metadata/ensureNoTrailingSlash.ts`
  - `packages/seo/src/metadata/index.ts`
  - `packages/seo/src/index.ts`
- Slashless assertions updated:
  - `apps/brikette/src/test/lib/metadata.test.ts`
  - `apps/brikette/src/test/utils/seo.test.ts`
  - `apps/brikette/src/test/utils/seo.logic.test.ts`
  - `apps/brikette/src/test/seo-extraction-contract.test.ts`
  - `packages/seo/src/__tests__/metadata.test.ts`
- Sitemap regenerated with slashless `<loc>` values: `apps/brikette/public/sitemap.xml`
- Validation passed:
  - `pnpm --filter @acme/seo test -- src/__tests__/metadata.test.ts`
  - `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts src/test/utils/seo.test.ts src/test/utils/seo.logic.test.ts src/test/seo-extraction-contract.test.ts`
  - `pnpm --filter @acme/seo lint`
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
- Environment limitation: live `curl -I https://hostel-positano.com/...` checks were attempted but DNS resolution failed in this runtime (`curl: (6) Could not resolve host`).

---

### TASK-03a: GSC URL Inspection — pre-change canonical baseline

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md` — table of declared vs Google-selected canonicals for 8+ representative URLs, captured BEFORE any redirect or canonical changes deploy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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
- **Documentation impact:** Write artifact at `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md`; use findings to calibrate TASK-02/TASK-11 execution priority
- **Notes / references:**
  - Auth pattern: see `memory/data-access.md` Search Console section
  - API: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `siteUrl: sc-domain:hostel-positano.com`
  - Critical timing: must complete before TASK-01a or TASK-01b deploys; if deployment races with this task, baseline is invalidated

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md`
- Required 8-URL pre-change sample captured via URL Inspection API on `2026-02-22T21:08:36Z -> 2026-02-22T21:09:28Z`
- Canonical mismatch measured at `50%` on rows with both canonicals exposed (`2/4`; mismatches on `/en` and `/en/rooms`)
- Non-indexed signals observed in same sample (`URL is unknown to Google` on 4 category/guide URLs), feeding TASK-11 indexing diagnostics
- Decision output: TASK-02 remains high priority; no confidence uplift applied to TASK-02 because DECISION-01 dependency and policy-choice uncertainty remain active

---

### TASK-03b: GSC URL Inspection — post-change canonical validation

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md` — same 8+ URL sample re-inspected AFTER TASK-01a+01b+02 are deployed; comparison table with TASK-03a baseline
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending (time-gated; full run no earlier than 2026-03-01 unless fresh recrawl observed)
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

**Build evidence update (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md`
- Recrawl gate check run against TASK-03a sample; fresh recrawl after deploy: `0/8`
- Earliest compliant full-run date recorded: `2026-03-01`

---

### TASK-04: hreflang reciprocity sampling (pre/post TASK-02)

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-04-hreflang-sample.md` — two-pass report (pre-TASK-02 baseline + post-TASK-02 verification) for reciprocity and canonical alignment across 5 locale pairs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-04-hreflang-sample.md`
- Pre-pass and post-pass completed for 5 required locale pairs
- Result: reciprocity/self-reference/canonical alignment all pass; slashless `x-default` normalization confirmed post-TASK-02

---

### TASK-05: Structured-data validation sample

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-05-schema-validation.md` — error/warning counts for homepage, rooms, and 5 guide URLs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-05-schema-validation.md`
- Raw scan saved: `docs/plans/brikette-seo-traffic-growth/artifacts/task-05-schema-scan.json`
- Result: `5` critical hygiene findings (`Article.datePublished` missing on sampled guide/article pages); no warning-level findings

---

### TASK-06: /en/help bounce query pull

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-06-help-page-queries.md` — GSC query list for /en/help with intent classification
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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
- **Deliverable:** Updated homepage locale metadata/H1 copy for "hostel positano" and "amalfi coast hostels" keywords, served through existing `buildAppMetadata()` wiring
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/locales/en/landingPage.json`, `[readonly] apps/brikette/src/app/[lang]/page.tsx`, `[readonly] packages/ui/src/organisms/LandingHeroSection.tsx`, `apps/brikette/src/test/app/homepage-metadata-copy.test.ts`, `docs/plans/brikette-seo-traffic-growth/task-07-homepage-metadata.md`
- **Depends on:** TASK-01a, TASK-01b, TASK-02, TASK-03a
- **Blocks:** TASK-08 (sequence gate for attribution clarity)
- **Confidence:** 82%
  - Implementation: 90% — execution was localized to the actual metadata/H1 source (`landingPage` locale keys) with deterministic test coverage.
  - Approach: 82% — held-back test is now resolved: pre-change EN title did not contain `hostel positano`, so scoped title/meta/H1 alignment is justified.
  - Impact: 82% — for a query currently at position `22.1`, this is a realistic relevance/CTR improvement lever while acknowledging OTA authority ceilings.
  - Overall: min(90, 82, 82) = 82%.
- **Acceptance:**
  - Homepage title tag includes "hostel positano" naturally (not keyword-stuffed)
  - Homepage meta description references "Amalfi Coast" and book/hostel intent
  - H1 on homepage consistent with title strategy
  - Existing metadata snapshot tests pass (or updated to reflect intentional copy changes)
  - No regressions in other locale meta output (spot check 3 locales)
- **Validation contract (TC-09/10):**
  - TC-09: Source-level metadata contract test asserts EN homepage title contains "hostel positano" (case-insensitive) and H1 remains aligned
  - TC-10: Existing metadata tests pass after copy update
- **Execution plan:** Red → Green → Refactor
  - Red: Pull current homepage title/description via curl or browser inspection; document current state
  - Green: Update metadata inputs; run TC-09/10 and metadata regression tests
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

#### Re-plan Update (2026-02-22)
- Confidence: **75% -> 82%**
- Key change: the held-back uncertainty ("is homepage title already optimized?") was closed using the live EN source copy in `landingPage.json`; exact `hostel positano` phrase was missing pre-change.
- Scope expansion rationale: implementation moved from `metadata.ts` to locale copy files because homepage metadata/H1 source-of-truth is translation content, not metadata builder logic.

**Build completion evidence (2026-02-22):**
- Updated EN homepage SEO/H1 copy source: `apps/brikette/src/locales/en/landingPage.json`
- Added focused validation test: `apps/brikette/src/test/app/homepage-metadata-copy.test.ts`
- Task artifact created: `docs/plans/brikette-seo-traffic-growth/task-07-homepage-metadata.md`
- Validation passed:
  - `pnpm --filter @apps/brikette test -- src/test/app/homepage-metadata-copy.test.ts`
  - `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts`
  - `pnpm --filter @apps/brikette typecheck`

---

### TASK-08: /en/rooms meta description optimization

- **Type:** IMPLEMENT
- **Deliverable:** Updated rooms page metadata copy — title and description targeting booking-intent queries
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/locales/en/roomsPage.json`, `[readonly] apps/brikette/src/app/[lang]/rooms/page.tsx`, `apps/brikette/src/test/app/rooms-metadata-copy.test.ts`, `docs/plans/brikette-seo-traffic-growth/task-08-rooms-metadata.md`
- **Depends on:** TASK-01a, TASK-01b, TASK-02, TASK-07 (sequence gate for cleaner attribution of snippet changes)
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 90% — update landed in the confirmed metadata source with dedicated contract tests.
  - Approach: 82% — copy now includes explicit booking CTA + numeric price anchor aligned to task acceptance.
  - Impact: 82% — page already sits on page 1 with low CTR baseline, so snippet optimization remains a bounded but meaningful lever.
  - Overall: min(90, 82, 82) = 82%.
- **Acceptance:**
  - Meta description for /en/rooms includes price signal or booking CTA ("from €X/night", "book now", "private rooms")
  - Title includes "positano" and room type
  - Existing metadata tests pass
  - 28-day post-deploy CTR delta measurable in GSC (VC tracked in measurement plan)
- **Validation contract (TC-11):**
  - TC-11: Source-level metadata contract test asserts EN `/rooms` description includes a booking-intent phrase and price signal
- **Execution plan:** Red → Green → Refactor
  - Red: Document current rooms meta title/description
  - Green: Update to booking-intent copy; run TC-11 and metadata regression tests
  - Refactor: Check locale variants consistent
- **Planning validation:** None: S task
- **Scouts:** Read current rooms meta before executing
- **Edge Cases & Hardening:** Translations of updated copy for IT, DE, FR rooms pages (currently 1.9% CTR for Italian market)
- **What would make this ≥90%:** Post-deploy 28-day GSC CTR comparison showing improvement from 0.5% baseline
- **Rollout / rollback:** Rollout: standard deploy; Rollback: revert metadata inputs
- **Documentation impact:** Update fact-find OPP-05 status
- **Notes / references:** E1: `/en/rooms` — 393 impressions, 0.5% CTR, position 8.7

**Build completion evidence (2026-02-22):**
- Updated EN rooms metadata copy source: `apps/brikette/src/locales/en/roomsPage.json`
- Added focused validation test: `apps/brikette/src/test/app/rooms-metadata-copy.test.ts`
- Task artifact created: `docs/plans/brikette-seo-traffic-growth/task-08-rooms-metadata.md`
- Validation passed:
  - `pnpm --filter @apps/brikette test -- src/test/app/rooms-metadata-copy.test.ts`
  - `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts`
  - `pnpm --filter @apps/brikette typecheck`

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
- Downstream propagation: TASK-19 established precursor evidence; TASK-12 scope/validation now handled in follow-on replan update.

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
- Downstream propagation: TASK-12 replan scope/validation updated using TASK-19 evidence (see TASK-12 Re-plan Update block)

---

### TASK-10: Internal link coverage audit

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-10-internal-link-audit.md` — click-depth map from homepage to priority guide categories
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-10-internal-link-audit.md`
- Raw crawl output saved: `docs/plans/brikette-seo-traffic-growth/artifacts/task-10-link-depth.json`
- Result: `55/119` EN guide URLs not reachable within 3-click homepage graph; transport/help clusters underlinked

---

### TASK-11: GSC Page indexing and guide coverage sample

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md` — indexation status breakdown for 30 representative guide URLs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
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

**Build completion evidence (2026-02-22):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md`
- Raw inspection output saved: `docs/plans/brikette-seo-traffic-growth/artifacts/task-11-url-inspection-sample.json`
- Result: `30/30` sampled guide URLs returned `URL is unknown to Google`; Wave-3 content activation remains gated

---

### CHECKPOINT-01: Wave 3 gate — reassess downstream plan

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan with TASK-12/13/14/15 confidence recalibrated from Wave 2 investigation evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `docs/plans/brikette-seo-traffic-growth/plan.md`
- **Depends on:** TASK-02, TASK-04, TASK-05, TASK-10, TASK-11
- **Blocks:** TASK-13, TASK-14, TASK-15
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution on Wave 3
  - Impact: 95% — controls Wave 3 risk (thin-content penalty scenario documented in fact-find Risks table)
- **Acceptance:**
  - `/lp-do-build` CHECKPOINT executor run
  - `/lp-do-replan` run on TASK-12, TASK-13, TASK-14, TASK-15, TASK-17
  - Wave 3 task confidence recalibrated using TASK-05 (schema) + TASK-10 (internal links) + TASK-11 (GSC indexation) evidence
  - If TASK-11 returns predominantly `URL is unknown to Google`: hold TASK-13 and prioritize discovery/internal-link surfacing first
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

**Build completion evidence (2026-02-22):**
- Checkpoint artifact created: `docs/plans/brikette-seo-traffic-growth/checkpoint-01-wave3-gate.md`
- Replan outputs applied: TASK-14 promoted (82%), TASK-13 remains deferred (45%), TASK-12 reduced to 80%, TASK-15 reduced to 65%, TASK-17 reduced to 55%
- TASK-03b run window enforced (no full run before `2026-03-01` unless recrawl freshness condition is met)

---

### TASK-12: Implement sitemap lastmod with accurate timestamps

- **Type:** IMPLEMENT
- **Deliverable:** Updated `generate-public-seo.ts` emitting `<lastmod>` only for guide-detail URLs with authoritative semantic date fields (`lastUpdated` or `seo.lastUpdated`); non-eligible URL classes remain without `<lastmod>`; updated sitemap.xml and guard tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/scripts/generate-public-seo.ts`, `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`, `apps/brikette/public/sitemap.xml`, `docs/plans/brikette-seo-traffic-growth/task-12-sitemap-lastmod.md`
- **Depends on:** TASK-02, TASK-19 (file overlap: apps/brikette/scripts/generate-public-seo.ts)
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — `TASK-19` provides explicit URL-class mapping, field precedence, and coverage counts (`681/4093`) so the implementation surface is bounded and testable.
  - Approach: 80% — scoped emission on authoritative guide fields is sound, but sitemap freshness signaling impact is secondary while guide discovery/indexation remains constrained.
  - Impact: 80% — avoids misleading freshness signals across `3,412` non-eligible URLs while enabling `lastmod` on eligible guides; net impact is meaningful but not a primary unlock at current gate state.
  - Overall: min(85, 80, 80) = 80%.
- **Acceptance:**
  - Sitemap emits `<lastmod>` only for eligible guide-detail URLs backed by `lastUpdated` or `seo.lastUpdated`
  - Non-guide classes (`/`, `/directions/*`, locale home, static sections, room detail, tag pages) emit no `<lastmod>`
  - Emitted `<lastmod>` values are normalized ISO-8601 UTC timestamps
  - When both fields exist and differ, precedence is deterministic: `lastUpdated` over `seo.lastUpdated`
  - Guard test asserts a bulk-today accident is blocked for emitted `<lastmod>` values
  - No new warnings in GSC Sitemap coverage report after resubmission
- **Validation contract (TC-12/13):**
  - TC-12: Parse generated sitemap.xml and assert: (a) every URL with `<lastmod>` is an eligible guide-detail URL from source scan; (b) no non-eligible URL contains `<lastmod>`; (c) all emitted values are valid ISO-8601 timestamps
  - TC-13: Guard test with mocked source dates forcing emitted entries to "today" verifies failure (prevents accidental bulk-now timestamps)
- **Execution plan:** Red → Green → Refactor
  - Red: Current sitemap has no `<lastmod>`; document baseline with TC-12 run (expected fail)
  - Green: Implement TASK-19 eligibility scanner + field precedence (`lastUpdated` > `seo.lastUpdated`), emit scoped `<lastmod>`, regenerate sitemap, run TC-12/13
  - Refactor: Add coverage guard assertion to CI, resubmit sitemap to GSC, monitor for errors/warnings
- **Planning validation (M task):**
  - Checks run: Confirmed `generate-public-seo.ts` is the sitemap generation script; `normalizePathname` function at lines 21–26 handles URL format
  - Validation artifacts: E5 (fact-find): sitemap.xml has 4,093 entries and no `<lastmod>` tags
  - Unexpected findings: TASK-19 confirmed full-sitemap coverage is unsupported; scope now narrowed to authoritative guide subset
- **Scouts:** TASK-19 and TASK-02 prerequisites were complete before execution.
- **Edge Cases & Hardening:**
  - Guard test is mandatory (blocking risky bulk-today accidents on emitted subset)
  - Date conflict handling is mandatory where both `lastUpdated` and `seo.lastUpdated` exist and disagree
  - Do not add git-history fallback in scoped mode; keep semantic fields only
- **What would make this ≥90%:** Post-deploy GSC Sitemap coverage report showing no errors; 7-day monitoring confirms Google accepts the timestamps
- **Rollout / rollback:** Rollout: regenerate sitemap at build time; Rollback: remove lastmod from sitemap generator; redeploy
- **Documentation impact:** Update fact-find OPP-06 status

#### Re-plan Update (2026-02-22)
- Confidence: **80%** (recalibrated at CHECKPOINT-01)
- Key change: scope shifted from full-sitemap `<lastmod>` to **eligible-guide-only** emission based on TASK-19 matrix (`681/4093` URLs currently eligible)
- Dependencies: unchanged (`TASK-02`, `TASK-19`), both now complete
- Status change: `Blocked (replan required)` -> `Pending` (dependencies cleared; ready for build scheduling)
- Validation contract: updated for scoped eligibility assertions (eligible URLs include `<lastmod>`, non-eligible URLs do not)
- Notes: replan derived from `docs/plans/brikette-seo-traffic-growth/task-19-lastmod-eligibility-matrix.md` and `docs/plans/brikette-seo-traffic-growth/checkpoint-01-wave3-gate.md`

**Build completion evidence (2026-02-22):**
- Generator implementation completed in `apps/brikette/scripts/generate-public-seo.ts`: guide-only `<lastmod>` emission, deterministic precedence (`lastUpdated` > `seo.lastUpdated`), and bulk-today guard.
- New contract tests added: `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts` (TC-12 and TC-13).
- Sitemap regenerated: `apps/brikette/public/sitemap.xml` now includes `681` scoped `<lastmod>` entries and excludes `<lastmod>` for non-eligible URL classes.
- Build output confirms semantic-date conflicts counted (`7`) and scoped emission count (`681`).
- Validation executed:
  - `pnpm --filter @apps/brikette test -- src/test/lib/generate-public-seo.lastmod.test.ts`
  - `pnpm --filter @apps/brikette test -- src/test/tsx-runtime-resolution.test.ts`
  - `pnpm --filter @apps/brikette typecheck`

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
- **Depends on:** CHECKPOINT-01, TASK-03b
- **Blocks:** -
- **Confidence:** 45%
  - Implementation: 60% — guide content editing remains feasible, but execution should not start while sampled guides are still `URL is unknown to Google`.
  - Approach: 45% — content enrichment is not currently the first-order constraint; discovery/indexation signal is unresolved.
  - Impact: 45% — low near-term confidence until indexed presence is observed for target guide cohorts.
  - Overall: min(60, 45, 45) = 45%. Below IMPLEMENT threshold; remains deferred pending indexation recovery evidence.
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
- **Scouts:** Defer execution until TASK-03b shows post-change recrawl/indexation signal
- **Edge Cases & Hardening:** 18-locale structure — EN updates should not degrade translation parity; use guide-translate skill for IT translation if needed
- **What would make this ≥90%:** TASK-03b and follow-up indexing sample confirm guides are known/indexed and primarily rank-limited
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
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/app/[lang]/HomeContent.tsx`, `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`, `apps/brikette/src/test/components/featured-guides-section.test.tsx`
- **Depends on:** CHECKPOINT-01
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 85% — component structure is known; locale-aware token links are already established in guide link utilities.
  - Approach: 82% — CHECKPOINT-01 evidence confirms underlinked guide clusters (transport/help) from homepage graph.
  - Impact: 82% — this is the most direct in-product lever to improve guide discoverability before content-expansion work.
  - Overall: min(85, 82, 82) = 82%.
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
  - Checks run: TASK-10 and TASK-11 evidence reviewed at CHECKPOINT-01
  - Validation artifacts: TASK-10 click-depth map (primary scope input)
  - Unexpected findings: sampled guide URLs are largely unknown to Google; discovery surfacing now precedes content expansion
- **Scouts:** Read current homepage component structure before executing
- **Edge Cases & Hardening:** Token system must handle all 18 locales; guide keys must exist in slug overrides for all locales
- **What would make this ≥90%:** Post-launch crawl diff shows reduced orphan count and URL Inspection begins returning indexed/known states for featured guides
- **Rollout / rollback:** Rollout: standard deploy; Rollback: remove new section component
- **Documentation impact:** Update fact-find OPP-11 status; update E6 internal link evidence

**Build completion evidence (2026-02-22):**
- Added homepage section component: `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`
- Integrated section into homepage flow: `apps/brikette/src/app/[lang]/HomeContent.tsx`
- Added focused test: `apps/brikette/src/test/components/featured-guides-section.test.tsx`
- Task artifact created: `docs/plans/brikette-seo-traffic-growth/task-14-homepage-featured-guides.md`
- Validation passed:
  - `pnpm --filter @apps/brikette test -- src/test/components/featured-guides-section.test.tsx`
  - `pnpm --filter @apps/brikette test -- src/test/components/ga4-cta-click-header-hero-widget.test.tsx`
  - `pnpm --filter @apps/brikette typecheck`

---

### TASK-15: Italian locale meta/title quality pass

- **Type:** IMPLEMENT
- **Deliverable:** Updated Italian SEO title/description copy for the 10 Italian transport-guide URLs sampled in `TASK-11`, with explicit metadata coverage validation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/locales/it/guides/content/amalfiPositanoBus.json`, `apps/brikette/src/locales/it/guides/content/amalfiPositanoFerry.json`, `apps/brikette/src/locales/it/guides/content/capriPositanoFerry.json`, `apps/brikette/src/locales/it/guides/content/chiesaNuovaArrivals.json`, `apps/brikette/src/locales/it/guides/content/naplesPositano.json`, `apps/brikette/src/locales/it/guides/content/salernoPositano.json`, `apps/brikette/src/locales/it/guides/content/ferryDockToBrikette.json`, `apps/brikette/src/locales/it/guides/content/fornilloBeachToBrikette.json`, `apps/brikette/src/locales/it/guides/content/chiesaNuovaDepartures.json`, `apps/brikette/src/locales/it/guides/content/briketteToFerryDock.json`, `apps/brikette/src/test/app/it-transport-guide-metadata.test.ts`, `docs/plans/brikette-seo-traffic-growth/task-15-italian-meta-pass.md`
- **Depends on:** CHECKPOINT-01
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 90% — copy edits are localized to 10 known IT guide content files with deterministic metadata read-path (`guides.content.<key>.seo.*`).
  - Approach: 82% — scope is now evidence-backed by the explicit 10-URL IT transport set from `TASK-11`, removing uncertainty about target selection in this cycle.
  - Impact: 82% — limited but measurable CTR quality signal for Italy-market transport intent; does not depend on broad indexation recovery to validate copy correctness.
  - Overall: min(90, 82, 82) = 82%.
- **Acceptance:**
  - The 10 IT transport-guide URLs sampled in `TASK-11` have reviewed/updated IT SEO titles and descriptions
  - CTR measurement: GSC Italian CTR tracked for 8 weeks post-deploy (H4 validation)
  - No regressions in EN or other locale metadata
- **Validation contract (VC-02):**
  - VC-02: GSC Italian CTR ≥3.5% within 8 weeks post-deploy (H4 pass threshold); sample: Italian country segment. Deadline: 8 weeks post-deploy.
- **Execution plan:** Red → Green → Refactor
  - Red: Use existing Italy CTR baseline (1.9%) and explicit IT transport sample list from `TASK-11` as the target set for this cycle
  - Green: Update IT meta copy for the 10 sampled pages; validate SEO field coverage via test
  - Refactor: Monitor GSC Italian CTR over 4-week window; adjust if no improvement
- **Planning validation:** None: S task; pattern established
- **Scouts:** May need native Italian speaker review for copy quality (flag if quality is substandard)
- **Edge Cases & Hardening:** Ensure EN meta not touched; test that `[lang]=it` metadata routes correctly
- **What would make this ≥90%:** Native Italian speaker review; two iteration cycles with 28-day period-over-period GSC CTR comparison
- **Rollout / rollback:** Standard deploy / revert
- **Documentation impact:** Update fact-find OPP-10 status; record H4 validation start date

#### Re-plan Update (2026-02-22)
- Confidence: **65% -> 82%**
- Key change: target set narrowed from ambiguous "top 10 IT pages by impressions" to explicit evidence-backed IT transport sample URLs from `TASK-11`.
- Validation contract retained (VC-02), with deterministic copy-coverage test added for the scoped 10-page set.
- Dependencies unchanged: `CHECKPOINT-01` complete.

**Build completion evidence (2026-02-22):**
- Updated Italian SEO copy in 10 transport guide content files under `apps/brikette/src/locales/it/guides/content/`.
- Added metadata coverage test: `apps/brikette/src/test/app/it-transport-guide-metadata.test.ts`.
- Validation passed:
  - `pnpm --filter @apps/brikette test -- src/test/app/it-transport-guide-metadata.test.ts`
  - `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts`
  - `pnpm --filter @apps/brikette typecheck`

---

### TASK-16: Google Business Profile audit and refresh

- **Type:** IMPLEMENT
- **Deliverable:** Completed GBP audit checklist + at minimum: 10 new photos uploaded, Q&A section reviewed, business description updated, one GBP post published
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23; manual path complete, API approval pending for automation only)
- **Artifact-Destination:** Google Business Profile for Hostel Brikette
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** GBP audit checklist signed off; operator attestation accepted for this execution cycle (screenshot pack waived by explicit instruction)
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
  - Business description updated to include key terms ("hostel positano", "amalfi coast") **or** description edit control unavailable and exception documented
  - One GBP post published
- **Validation contract (VC-03):**
  - VC-03: GBP profile score ≥80 on audit checklist by completion; documented via screenshot pack or operator attestation when explicitly approved. Deadline: 2 weeks post-task start.
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
- **Build completion evidence (2026-02-23):**
  - Artifact created: `docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md` with Red/Green/Refactor checklist, repo photo shortlist, description/post drafts, VC-03 scoring rubric, and screenshot evidence contract.
  - Upload-ready photo pack prepared for GBP ops: `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23` (12 files, jpg/png) to remove conversion friction during manual execution.
  - GBP API access request submitted with support case `1-1062000040302` on 2026-02-23; Google does not provide a guaranteed SLA. Working planning window: 3-10 business days (`2026-02-26` to `2026-03-09`) for first support response.
  - Operator-reported manual execution completed: 10+ photos uploaded, Q&A reviewed with no unresolved items, one GBP update post published.
  - Description edit control was unavailable in current GBP UI; recorded as UI-availability exception in task artifact.
  - Reviewer sign-off completed in artifact with VC-03 total `100/100` under operator-attestation mode; API entitlement remains pending only for follow-on automation/reporting.

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
- **Depends on:** TASK-18, TASK-20, TASK-21
- **Blocks:** -
- **Confidence:** 65%
  - Implementation: 75% — outreach execution path is clear; remaining readiness dependency is template/final draft approval in TASK-21.
  - Approach: 75% — TASK-20 now provides packaged target-quality/contactability evidence and a ranked shortlist; remaining approach uncertainty is message-review quality gating.
  - Impact: 65% — target quality is improved versus prior state, but response/backlink yield uncertainty remains until TASK-21 completion and first-send outcome data.
  - Overall: min(75, 75, 65) = 65%. Below IMPLEMENT threshold; remains deferred in Phase B pending final precursor evidence.
  Note: confidence below 80% IMPLEMENT threshold. This task remains excluded from current-phase confidence math until promoted.
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
  - Red evidence: TASK-18 GSC Links baseline (actual referring domains + anchors) and target/contactability matrix from TASK-20
  - Green evidence: Reviewer-approved outreach pack from TASK-21, then 10 personalized pitches sent with complete log (VC-05)
  - Refactor: 30-day follow-up cadence on non-responses; track GSC Links report monthly for new referring domains and anchor shifts
- **Planning validation (M task):**
  - Checks run: None (backlink strategy research is part of the task itself)
  - Validation artifacts: TASK-18 GSC Links baseline (primary); E2 (only Lonely Planet referral visible in GA4 — TASK-18 will confirm whether additional links exist)
  - Unexpected findings: Backlink profile may be stronger than inferred — TASK-18 establishes actual baseline before targeting
- **Scouts:** Use TASK-20 output to prioritize warm contacts first (existing referring domains with editorial travel relevance and active contact endpoints)
- **Edge Cases & Hardening:** Do not use link-buying schemes or private blog networks (SEO penalty risk); editorial-only outreach
- **What would make this ≥90%:** Pre-identified warm contacts at target publications; Lonely Planet contact already established via existing referral
- **Rollout / rollback:** None: outreach is irreversible; rollback is not applicable
- **Documentation impact:** Write target list and outreach log at `docs/plans/brikette-seo-traffic-growth/task-17-backlink-targets.md`
- **Notes / references:** OPP-13: backlink acquisition is the primary lever for head-term top-10 rankings; H5 in fact-find

#### Re-plan Update (2026-02-23)
- Confidence: **60%** (`-> 82%` conditional on `TASK-20` + `TASK-21`)
- Key change: converted unresolved execution unknowns into explicit precursor chain (target vetting/contactability + outreach pack approval).
- Dependencies: updated to `TASK-18, TASK-20, TASK-21`.
- Validation contract: upgraded from single outcome VC to M-effort three-stage VC contract (readiness, execution completeness, timed outcome).
- Sequencing: topology updated with stable IDs (`TASK-20`, `TASK-21` added; no renumbering).
- Evidence: `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md` confirms measurable baseline (`33` linking domains) and warm-target candidates but does not by itself de-risk send-ready execution.

#### Re-plan Update (2026-02-23, post-TASK-20 evidence)
- Confidence: **60% -> 65%** (Evidence: E2 — `docs/plans/brikette-seo-traffic-growth/task-20-outreach-target-vetting.md`)
- Key change: target-quality/contactability uncertainty converted from unknown to a complete matrix + ranked shortlist.
- Dependencies: unchanged (`TASK-18, TASK-20, TASK-21`); remaining promotion gate is `TASK-21`.
- Validation contract: unchanged (`VC-04/05/06`); readiness promotion still blocked until `TASK-21` approval artifact exists.

---

### TASK-18: GSC Links baseline pull

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md` plus raw CSV exports in `docs/plans/brikette-seo-traffic-growth/artifacts/task-18-links-export/` from Search Console UI (Links report: Top linking sites, Top linked pages, and anchors if available)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-23)
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
  - Gap identified in fact-find evidence audit (1-04) is now closed via this task execution: "GSC Links report baseline captured."

**Build completion evidence (2026-02-23):**
- Imported operator-provided Search Console exports into `docs/plans/brikette-seo-traffic-growth/artifacts/task-18-links-export/`:
  - `task-18-top-linking-sites-2026-02-23.csv`
  - `task-18-top-target-pages-2026-02-23.csv`
  - `task-18-top-linking-text-2026-02-23.csv`
- Completed baseline artifact with top-domain/page/anchor summaries and decision output:
  - `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md`
- Result: TASK-18 unblocked and closed; TASK-17 dependency satisfied, and TASK-17 now runs behind explicit precursor tasks (`TASK-20`, `TASK-21`) before promotion.

---

### TASK-20: Backlink target vetting + contactability matrix

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-traffic-growth/task-20-outreach-target-vetting.md` with scored domain matrix (warm/cold/exclude), contactability proof, and shortlist for outreach
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/brikette-seo-traffic-growth/task-20-outreach-target-vetting.md`
- **Depends on:** TASK-18
- **Blocks:** TASK-17
- **Confidence:** 85%
  - Implementation: 90% — inputs are concrete (`TASK-18` exports + public site/contact pages); artifact schema is deterministic.
  - Approach: 85% — qualification rubric is explicit (editorial relevance, recency, contact route, non-paid placement).
  - Impact: 85% — directly resolves the largest TASK-17 unknown: whether enough send-ready editorial targets exist.
- **Questions to answer:**
  - Which of the exported referrers are editorially relevant vs. low-value directories/aggregators?
  - For each candidate, is a direct contact route available (email/contact form/editor page)?
  - Which domains have published relevant Positano/Amalfi travel content in the last 12 months?
- **Acceptance:**
  - Domain matrix includes all exported linking domains with `warm/cold/exclude` classification and rationale
  - At least 10 send-ready targets meet all criteria: editorial relevance, recency <=12 months, reachable contact route
  - Exclusion list explicitly documents low-value/non-editorial domains to avoid
  - Shortlist ranks top 10 outreach priorities with personalization angles
- **Validation contract:** Artifact written with required columns and shortlist; reviewer spot-checks 5 random rows against source pages for classification accuracy
- **Planning validation:** Evidence source is closed-loop from `TASK-18` artifact + live public pages (no paid tooling)
- **Rollout / rollback:** None: investigation artifact
- **Documentation impact:** Feed qualified shortlist and personalization basis into `TASK-21` and `TASK-17`

**Build completion evidence (2026-02-23):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-20-outreach-target-vetting.md`
- Captured full 33-domain matrix (`warm/cold/exclude`) from TASK-18 exports with rationale and exclusion set.
- Produced ranked 10-domain send-ready shortlist with topic-recency and contactability evidence.
- Reviewer spot-check contract documented (5-row sample) in artifact.

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
- **Depends on:** TASK-20
- **Blocks:** TASK-17
- **Confidence:** 80%
  - Implementation: 85% — pack structure is straightforward once target shortlist exists.
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

**Build completion evidence (2026-02-23):**
- Artifact created: `docs/plans/brikette-seo-traffic-growth/task-21-outreach-pack.md`
- Finalized warm/cold templates with subject variants and mapped 10 personalized draft entries to TASK-20 shortlist domains.
- Validation checklist completed for template and personalization coverage (`10/10`), but reviewer approval evidence remains unsigned.
- Gate result applied: task remains blocked until sign-off checkboxes/timestamp are completed in artifact.

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
- **GSC URL Inspection:** TASK-03b full post-change validation on 8 representative URLs no earlier than `2026-03-01`, or earlier only if fresh recrawl is observed
- **GSC organic clicks:** Weekly organic click count; baseline ~112/90 days (~1.2/day); H1 pass: directional improvement in 8 weeks
- **GA4 organic sessions:** Weekly check; baseline ~1.7/day (13-day window); TASK-11 (GSC Page indexing sample) provides guide-page coverage diagnostic
- **GSC Sitemap coverage:** Monitor after TASK-12 for errors/warnings in lastmod processing
- **GSC Links:** Monthly check on referring domain count using TASK-18 UI export baseline
- **GBP Insights:** Monthly GBP Performance metrics (views, searches, calls, directions, website clicks) + neutral-profile SERP spot-check for three core local queries

## Acceptance Criteria (overall)

- [x] `https://www.hostel-positano.com/en/rooms` resolves to `https://hostel-positano.com/en/rooms` in one permanent host-normalization hop (TC-01a-path)
- [x] `https://www.hostel-positano.com/` resolves to `https://hostel-positano.com/en` in <=2 permanent hops (www→apex, apex→/en), no `302` in chain, final `200` (TC-01a + TC-01b)
- [x] Root apex `/` resolves to `/en` via a single permanent redirect with no extra 3xx from `/en` itself (TC-01b)
- [ ] No canonical tag target URL returns a 3xx (all canonical targets return `200` directly)
- [ ] GSC URL Inspection post-TASK-02 (TASK-03b): declared canonical = Google-selected canonical on ≥90% of sampled URLs (100% for homepage, rooms, and locale-root templates we fully control; ≥90% overall)
- [ ] Rooms page CTR ≥1.5% within 28-day GSC window post-TASK-08 (baseline: 0.5%)
- [ ] Homepage "hostel positano" position ≤18 (28-day GSC average) within 8 weeks of TASK-01+02 deploy
- [x] Wave 3 gate: CHECKPOINT-01 completed; downstream task confidence recalibrated from evidence
- [x] GBP audit complete; at least one active GBP post published (TASK-16)

## Decision Log

- 2026-02-22: Canonical URL policy recommendation = slashless (Option A). Rationale: matches runtime 308 behavior; eliminates canonical-to-redirect mismatch with no new infrastructure needed. Execution is blocked by DECISION-01 until operator confirmation is recorded.
- 2026-02-22: **DECISION-01 confirmed** — operator approved slashless canonical policy (Option A). Decision artifact: `docs/plans/brikette-seo-traffic-growth/decision-01-canonical-policy.md`.
- 2026-02-22: **TASK-02 completed** — slashless canonical/hreflang/sitemap rollout implemented, sitemap regenerated, and targeted `@acme/seo` + Brikette SEO tests passed.
- 2026-02-22: **TASK-01c completed** — no Brikette Pages Functions shadowing detected in repo-managed deploy path; TASK-01a/TASK-01b remain valid and unblocked by Functions risk.
- 2026-02-22: **TASK-01b completed** — root redirect updated to permanent slashless target in generator source and regenerated `_redirects` output (`/  /en  301`).
- 2026-02-22: **TASK-01a completed** — Cloudflare Bulk Redirect list/rule created and enabled for `www`→apex host normalization (`brikette_www_to_apex`); host/path/query probes pass.
- 2026-02-22: **TASK-01 atomicity gate satisfied** — post-deploy probes confirm `https://www.hostel-positano.com/` resolves `301`→`301`→`200` with no `302` in chain, and apex root `https://hostel-positano.com/` resolves `301`→`200`.
- 2026-02-22: **TASK-04 completed** — pre/post hreflang sampling passes for required locale pairs; slashless normalization reflected correctly in alternates/x-default.
- 2026-02-22: **TASK-05 completed** — schema hygiene scan identified 5 critical `Article.datePublished` omissions on sampled guide/article URLs.
- 2026-02-22: **TASK-10 completed** — internal-link audit found `55/119` EN guide URLs unreachable within 3-click homepage graph; transport/help underlinked.
- 2026-02-22: **TASK-11 completed** — 30-URL indexing sample returned `URL is unknown to Google` for all sampled guide URLs; Wave-3 content expansion remains gated.
- 2026-02-22: **TASK-03b run-gate check completed** — full post-change URL Inspection validation deferred until `2026-03-01` (T+7) unless fresh recrawl appears earlier.
- 2026-02-22: **TASK-18 attempted and blocked** — manual GSC Links export requires authenticated operator session; task remains blocked pending login/export.
- 2026-02-22: **CHECKPOINT-01 completed** — recalibration outcome: TASK-14 promoted (82%), TASK-13 remains deferred (45%), TASK-12 to 80%, TASK-15 to 65%, TASK-17 to 55%.
- 2026-02-22: **TASK-14 completed** — homepage featured-guides section shipped with 6-8 `%LINK:` token-driven guide links, test coverage added, and Brikette typecheck/targeted regression tests passing.
- 2026-02-22: **TASK-12 completed** — sitemap generation now emits scoped guide-only `<lastmod>` values (semantic-source only), adds deterministic date precedence + bulk-today guard, and ships with TC-12/TC-13 contract tests.
- 2026-02-22: **TASK-15 replan+build completed** — scope fixed to the explicit 10-URL IT transport sample from TASK-11, Italian SEO titles/descriptions updated in localized guide content, and coverage tests passed.
- 2026-02-22: **TASK-07 replan+build completed** — EN homepage metadata/H1 copy now targets `hostel positano` naturally via locale source updates, with dedicated metadata copy tests and locale spot-check guards.
- 2026-02-22: **TASK-08 completed** — EN `/en/rooms` metadata now includes explicit booking-intent CTA + price signal (`from EUR 55/night`), with focused metadata tests and locale spot-check guards.
- 2026-02-23: **TASK-18 completed** — operator-provided Search Console Links exports were ingested and summarized; backlink baseline now measured (33 linking domains exported), and TASK-17 dependency is satisfied.
- 2026-02-23: **TASK-17 replanned** — added precursor chain (`TASK-20` target vetting, `TASK-21` outreach pack approval), upgraded VC contract coverage (VC-04/05/06), and set conditional promotion (`60% -> 82%` once precursors complete).
- 2026-02-23: **TASK-20 completed** — backlink target vetting artifact delivered with full exported-domain matrix and ranked 10-target shortlist; TASK-21 is now the remaining precursor before TASK-17 promotion.
- 2026-02-23: **TASK-17 replanned (post-TASK-20)** — confidence raised `60% -> 65%` from completed target-vetting evidence (E2), while remaining below IMPLEMENT threshold until `TASK-21` approval evidence is complete.
- 2026-02-23: **TASK-21 drafted and blocked** — outreach pack artifact completed (templates + 10 personalized drafts), but reviewer sign-off evidence is pending; TASK-17 remains deferred behind this gate.
- 2026-02-23: **TASK-16 execution packet prepared and blocked** — GBP audit artifact created (`task-16-gbp-audit.md`) with explicit evidence contract; completion now awaits authenticated GBP dashboard execution and screenshots.
- 2026-02-23: **GBP API access request submitted** — support case `1-1062000040302` opened to unlock `mybusiness.googleapis.com`; until approved, TASK-16 continues via manual dashboard execution.
- 2026-02-23: **TASK-16 manual execution path activated** — run now via GBP UI using `task-16-gbp-audit.md`; API wait no longer blocks checklist completion, only automation follow-on.
- 2026-02-23: **TASK-16 completed (operator-attested manual execution)** — photos uploaded (10+), Q&A reviewed with no unresolved items, and GBP update post published. Description edit control unavailable in current GBP UI was documented as a non-blocking exception; API case `1-1062000040302` remains open for automation follow-on.

## Overall-confidence Calculation (Phase A)

Current-phase confidence includes executable/pending Wave 1–6 tasks and excludes deferred/pending Phase B tasks (TASK-13, TASK-17, TASK-21). (`TASK-20` is complete but outside Phase-A scope.)

| Task | Type | Confidence | Effort | Weighted |
|---|---|---|---|---|
| TASK-01c | INVESTIGATE | 90 | S=1 | 90 |
| TASK-01a | IMPLEMENT | 85 | S=1 | 85 |
| TASK-01b | IMPLEMENT | 80 | S=1 | 80 |
| DECISION-01 | DECISION | 95 | S=1 | 95 |
| TASK-02 | IMPLEMENT | 80 | M=2 | 160 |
| TASK-03a | INVESTIGATE | 85 | S=1 | 85 |
| TASK-03b | INVESTIGATE | 90 | S=1 | 90 |
| TASK-04 | INVESTIGATE | 80 | S=1 | 80 |
| TASK-05 | INVESTIGATE | 80 | S=1 | 80 |
| TASK-06 | INVESTIGATE | 75 | S=1 | 75 |
| TASK-07 | IMPLEMENT | 82 | S=1 | 82 |
| TASK-08 | IMPLEMENT | 82 | S=1 | 82 |
| TASK-09 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-19 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-10 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-11 | INVESTIGATE | 85 | S=1 | 85 |
| TASK-18 | INVESTIGATE | 85 | S=1 | 85 |
| CHECKPOINT-01 | CHECKPOINT | 95 | S=1 | 95 |
| TASK-12 | IMPLEMENT | 80 | M=2 | 160 |
| TASK-14 | IMPLEMENT | 82 | M=2 | 164 |
| TASK-15 | IMPLEMENT | 82 | S=1 | 82 |
| TASK-16 | IMPLEMENT | 75 | S=1 | 75 |
| **Total (Phase A scope)** | | | **25** | **2,085** |

**Overall-confidence (Phase A) = 2,085 / 25 = 83%**

Phase-B sensitivity (if full roadmap tasks are included now):
- Add TASK-13 (90), TASK-17 (130), TASK-20 (85), TASK-21 (80) => full-roadmap confidence `2,470 / 31 = 80%`.

Critique trigger: Phase-A Trigger 1 clears (`83% >= 80%`). No sub-80 IMPLEMENT tasks remain in active execution; deferred Phase-B tasks remain TASK-13 and TASK-17, with TASK-21 as the remaining queued precursor.
