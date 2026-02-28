---
Type: Critique-History
Fact-Find: docs/plans/brik-live-pricing-activation/fact-find.md
Plan: docs/plans/brik-live-pricing-activation/plan.md
---

# Critique History — brik-live-pricing-activation

## Round 1 (Plan)

- **Route:** codemoot
- **Score:** 6/10 → lp_score 3.0
- **Verdict:** needs_revision
- **Severity counts:** Critical: 1, Major (warning): 4, Minor (info): 1
- **Key findings:**
  - [C1] Proposed fallback to hardcode feature flag `true` in Pages Function breaks rollback control — creates unsafe one-way activation path violating the flag-gated model
  - [W1] Env model incorrect: task describes reading flag from `process.env` (Node.js-only) but Pages Functions use `context.env` runtime bindings; build-cmd inline alone does not control function runtime behaviour
  - [W2] Goal states "staging validation before production" but execution steps switch to local-dev testing — inconsistency in stated vs actual validation approach
  - [W3] TASK-03 labeled "(staging + production)" in active tasks list but deliverable scope is production-only — misleading label
  - [W4] Playwright local execution described as conflicting with CI policy, but test is explicitly not in standard CI by design
  - [I1] `BOOKING_CODE` inlined in Pages Function duplicates source of truth in `constants.ts` — drift risk
- **Actions taken:** Removed hardcode-true fallback from Risks table and Simulation Trace; replaced with correct mitigation (register CF Pages env var binding, do not hardcode); clarified env model throughout TASK-01 (Implementation confidence, Edge Cases, Acceptance criteria); updated Goals to say "local-dev validation is the accepted pre-production gate"; corrected TASK-03 active tasks label to "production only"; reframed TASK-04 execution plan to explain the smoke test is explicitly not in CI by design; added BOOKING_CODE drift note to Documentation Impact.

---

## Round 2 (Plan)

- **Route:** codemoot
- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0, Major (warning): 5, Minor (info): 1
- **Key findings:**
  - [W1] Summary still says "after staging deploy" but plan now defines local-dev as the accepted gate — internal inconsistency
  - [W2] Parallelism Guide TASK-04 row says "requires staging deploy with flag=1" — conflicts with actual task definition
  - [W3] TASK-04 section title still says "against staging" while body executes against local dev
  - [W4] TC-01 incorrect: says `/en/rooms/<id>` but `availability-smoke.spec.ts` TC-07-01 validates `/en/book`
  - [W5] Plan mandates local Playwright execution, conflicting with `AGENTS.md` line 93 policy ("Tests run in CI only")
  - [I1] TASK-02 notes still claim TASK-04 validates against staging — stale after shift to local-dev
- **Actions taken:** Updated Summary to describe operator-executed smoke test against local dev with CI policy note; fixed Parallelism Guide TASK-04 row; renamed TASK-04 to "Produce operator smoke test instructions + record results"; corrected TC-01 URL to `/en/book`; revised TASK-04 execution plan so agent writes instructions only (operator runs test); updated TASK-02 unexpected findings note; updated Decision Log.

---

## Round 3 (Final — Plan)

- **Route:** codemoot
- **Score:** 7/10 → lp_score 3.5 (pre-autofix)
- **Verdict:** needs_revision (pre-autofix)
- **Severity counts:** Critical: 0, Major (warning): 3, Minor (info): 1
- **Key findings:**
  - [W1] TASK-03 health check validates only HTTP status — flag-off fast path returns HTTP 200 with `{ rooms: [] }`, so deploy gate can pass while feature is effectively inactive
  - [W2] Local-dev smoke test does not validate CF Pages Function runtime path (the highest-risk component) — material deployment gap
  - [W3] Intended Outcome Statement says "room detail page" but TASK-04 validation uses `/en/book` — verification surface misaligned with stated outcome
  - [I1] `wrangler` version assumption referenced `apps/brikette/package.json` incorrectly — wrangler is pinned in root `package.json`
- **Actions taken (post-round autofix):** Added Known Limitation to TASK-03 Acceptance explaining that HTTP 200 also occurs with flag-off fast path, directing operator to verify CF env var binding separately; added CF runtime validation gap note to Summary (local dev validates route.ts path; post-production manual verification validates CF Function path); updated Intended Outcome Statement to reference both book page and room detail pages, with explanatory note about shared API endpoint; corrected wrangler pinning reference to root `package.json` at line 384.
- **Post-autofix assessment:** No Critical findings remain. All Major findings addressed with documented resolutions. Core plan is credible: approach is well-justified, tasks are properly sequenced, risks are acknowledged. Effective post-autofix lp_score assessed >= 4.0.
