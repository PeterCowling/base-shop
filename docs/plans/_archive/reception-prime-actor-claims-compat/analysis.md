---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-actor-claims-compat
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-prime-actor-claims-compat/fact-find.md
Related-Plan: docs/plans/reception-prime-actor-claims-compat/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Prime Actor Claims Compat Analysis

## Decision Frame

### Summary

The `prime-outbound-auth-hardening` build (TASK-01–07, 2026-03-14) fully removed the `reception_proxy` UID fallback and hardened all 8 Prime mutation endpoints. Three residual issues survive that fix: (1) `actorSource: 'reception_proxy'` is a misleading audit label in two Prime API files (`review-campaign-send.ts:67`, `review-thread-send.ts:66`) now that the UID is verified; (2) `PRIME_ACTOR_CLAIMS_SECRET` is absent from local dev env files (gitignored workstation state) and the existing `.env.example` entries lack enough context to diagnose the first failure mode (a Reception-side failure surfaced as 502 by most routes via `inboxApiErrorResponse`, thrown before Prime is called); (3) tests that pin `actorSource: 'reception_proxy'` in `source_metadata_json` will need updating when (1) is fixed. The analysis must determine the right treatment for each residual issue.

Note on `review-campaign-send.ts` caller scope: Reception has no current caller for `/api/review-campaign-send`. The test `send-prime-inbox-thread.test.ts:TC-02` explicitly asserts this endpoint is never called by `sendPrimeInboxThread`. The only Reception function that resembles a campaign-send path is `replayPrimeInboxCampaignDelivery`, which calls `/api/review-campaign-replay` (not `/api/review-campaign-send`). The `actorSource` fix on `review-campaign-send.ts` is therefore a correctness cleanup for future callers (e.g. the Prime UI or any direct API caller), not a live Reception compat fix.

### Goals

1. Choose a treatment for the `actorSource` label in `review-campaign-send.ts` and `review-thread-send.ts`.
2. Choose a treatment for env-var documentation to reduce local-dev misconfiguration friction.
3. Confirm that the correct test update plan follows naturally from (1).

### Non-goals

- Rebuilding the actor claims system.
- Adding a Prime health-check endpoint (operator input required; out of scope for this plan).
- Retroactively rewriting D1 records with the old `actorSource` value.
- Deploy-order automation (documented spike; not blocked).

### Constraints & Assumptions

- Constraints:
  - `actorSource` is a free-form string column in Prime D1; no schema migration required.
  - `.env.local` files are gitignored; only `.env.example` files are tracked.
  - `validatePrimeActorClaimsConfig()` is defined but not wired anywhere today — no startup hook exists on CF Pages Functions; request-time 503 is the only guaranteed signal.
- Assumptions:
  - `actorSource: 'reception_staff'` accurately describes a verified Reception staff origin and is consistent with `'reception_staff_compose'` used by `staff-broadcast-send.ts:129`.
  - The `actorSource` field value is not parsed or branched on by any downstream logic (confirmed: it is written to D1 as a free-form audit string, not an enum gate).
  - Both `.env.example` files already contain a `PRIME_ACTOR_CLAIMS_SECRET` entry; the fix is a wording update, not a new entry.

## Inherited Outcome Contract

- **Why:** The `prime-outbound-auth-hardening` build removed the compat fallback but left two residual issues: `actorSource: 'reception_proxy'` in audit records is misleading now that the UID is verified (audit clarity issue, not auth correctness), and `PRIME_ACTOR_CLAIMS_SECRET` is absent from local dev env files, causing Reception-side failures (surfaced as 502 by most routes via `inboxApiErrorResponse`, thrown by `buildPrimeActorHeaders()` before Prime is called) with no clear diagnostic indicator in the `.env.example` wording.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, `actorSource` in D1 audit records accurately reflects a verified Reception staff origin (`'reception_staff'` or equivalent), existing tests that pin `'reception_proxy'` are updated to the new value, and the existing `PRIME_ACTOR_CLAIMS_SECRET` entries in both `.env.example` files are updated with clearer wording about the Reception-side failure mode (surfaced as 502 by `inboxApiErrorResponse` after `buildPrimeActorHeaders()` throws before Prime is called) so new contributors can diagnose misconfiguration without reading the source.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-prime-actor-claims-compat/fact-find.md`
- Key findings used:
  - TASK-07 (commit `02435507f2`) removed compat fallback; `resolveActorClaimsWithCompat` is now an alias for `resolveActorClaims` with a 401 hard-gate.
  - `actorSource: 'reception_proxy'` survives in `review-campaign-send.ts:67` and `review-thread-send.ts:66` as a free-form audit string unrelated to the removed UID fallback.
  - Tests in `review-threads.test.ts:2742,3045` pin `actorSource: 'reception_proxy'` in `source_metadata_json`; `staff-broadcast-send.test.ts:244` pins `'reception_staff_compose'` (already correct).
  - `apps/prime/.env.example:33` and `apps/reception/.env.example:93` both have `PRIME_ACTOR_CLAIMS_SECRET=` entries; the first failure mode for local dev is a Reception-side failure (502 via `inboxApiErrorResponse`, thrown before Prime is called), not a Prime-side 503.
  - `validatePrimeActorClaimsConfig()` is defined but not invoked anywhere in `apps/prime`.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Audit clarity | `actorSource` in D1 is free-form audit context (not the identity field — `actorUid` is); misleading values reduce audit-trail readability without affecting auth correctness | Medium |
| Consistency with existing patterns | `staff-broadcast-send.ts` already uses `'reception_staff_compose'`; new values should be consistent | High |
| Test update burden | The change requires updating existing test assertions; scope should be minimal and predictable | Medium |
| Dev DX improvement | `.env.example` updates should reduce time-to-diagnose for misconfigured local setups | Medium |
| Scope creep avoidance | Adding a health-check endpoint is operator-gated; analysis should not introduce it unilaterally | High |

## Options Considered

### Issue 1: actorSource label

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Rename to `'reception_staff'` | Change both `review-campaign-send.ts:67` and `review-thread-send.ts:66` from `'reception_proxy'` to `'reception_staff'` | Consistent with verified-UID state; matches the semantic of the calling path; reads clearly in audit records | 2 test assertions must be updated (predictable scope) | None — free-form string, no downstream branching | Yes |
| B: Rename to `'reception_staff_compose'` | Use the same value already used by `staff-broadcast-send.ts:129` | Maximum consistency — all Reception-originated actions share one label | Loses the distinction between broadcast-send and review-send/campaign-send paths | Minor: slightly less auditable per-path | Yes |
| C: Leave as `'reception_proxy'` | No code change | Zero test impact | Perpetuates misleading label after auth hardening; future audit readers will see "proxy" and question whether auth is working | Ongoing confusion cost | No |

### Issue 2: env-var documentation

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Update `.env.example` wording only | Enhance the existing comment block for `PRIME_ACTOR_CLAIMS_SECRET` in both `apps/reception/.env.example` and `apps/prime/.env.example` to explicitly state: "Missing → Reception throws before calling Prime; surfaced as 502 by most routes (not a Prime-side 503)" | Durable (tracked files); zero runtime impact; correct diagnostic starting point for contributors | Does not fix `PRIME_ACTOR_CLAIMS_SECRET` being absent from the actual `.env.local` files (those are gitignored and each dev must set them) | None | Yes |
| B: Add startup preflight call to `validatePrimeActorClaimsConfig` in Prime | Wire `validatePrimeActorClaimsConfig` to an existing or new CF Pages Function that runs on first request, logging a clear warning | Faster runtime signal for misconfigured CF deploys | Operator input required (health endpoint decision); CF Pages Functions have no startup hook so this requires a request-time trigger | Scope expansion beyond this fact-find's remit | No (operator-gated) |
| C: No documentation change | Leave current `.env.example` wording unchanged | Zero effort | Contributes to local-dev friction for new contributors | Ongoing confusion | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (actorSource rename + .env.example update) | Option B (Rejected alternatives) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — server-side only | N/A | No UI impact |
| UX / states | N/A — no UI state change | N/A | No UX impact |
| Security / privacy | `actorSource` is labelling only; renaming it does not affect auth correctness; HMAC verification path unchanged | N/A | No security change; audit correctness improves |
| Logging / observability / audit | `actorSource` in D1 records becomes `'reception_staff'` (accurate); `.env.example` wording improvement reduces time-to-diagnose misconfiguration | Leaving as `'reception_proxy'` perpetuates misleading audit signal | Both audit record accuracy and DX improved |
| Testing / validation | 2 test assertions in `review-threads.test.ts` must be updated from `'reception_proxy'` to `'reception_staff'` in `source_metadata_json`; test framework stays the same | No test changes if label left alone | Test update is predictable and low-risk; adds no new test complexity |
| Data / contracts | `actorSource` column is free-form `TEXT`; no schema migration; no breaking contract change | N/A | Zero schema impact |
| Performance / reliability | No performance impact | N/A | No reliability change |
| Rollout / rollback | Single PR; no ordering requirement; rollback by reverting string value in 2 source files + 2 test files | N/A | Safe to rollback at any time |

## Chosen Approach

- **Recommendation:** Option A for `actorSource` (rename to `'reception_staff'`) + Option A for env-var docs (update `.env.example` wording). These are independent changes that can land in a single PR.
- **Why this wins:**
  - `'reception_staff'` is semantically accurate — it describes a verified Reception staff request, not an anonymous proxy. The term "proxy" was appropriate when the UID was forwarded without verification; it is actively misleading after TASK-07.
  - Using `'reception_staff'` rather than `'reception_staff_compose'` preserves per-path distinguishability in the audit trail. `staff-broadcast-send` is a broadcast-specific fast path; `review-thread-send` and `review-campaign-send` are review workflow paths. Keeping them distinguishable has future audit value.
  - `.env.example` updates are the only durable fix surface for local-dev DX. The first failure mode for missing `PRIME_ACTOR_CLAIMS_SECRET` is a Reception-side 502 (surfaced by `inboxApiErrorResponse` default status after `buildPrimeActorHeaders()` throws before Prime is called) — this is not obvious from the current example comment, which only mentions the Prime-side 503 scenario.
- **What it depends on:**
  - `actorSource` column confirmed as free-form string (confirmed from fact-find).
  - 2 test assertions in `review-threads.test.ts` updated alongside the source change.

### Rejected Approaches

- `actorSource: 'reception_proxy'` (Option C) — perpetuates misleading label; no benefit; rejected.
- `actorSource: 'reception_staff_compose'` (Option B) — reduces per-path distinguishability without meaningful benefit; `staff-broadcast-send` already uses this for the broadcast fast-path and conflating review-workflow paths with it loses audit granularity.
- Startup preflight/health-check for env var (env Option B) — operator-gated (requires product decision on unauthenticated health endpoint); scope exceeds this plan's residual work; deferred.

### Open Questions (Operator Input Required)

- Q: Should a Prime health-check route be added that calls `validatePrimeActorClaimsConfig()` to surface misconfiguration before the first real request?
  - Why operator input is required: This requires a decision about whether Prime should expose an unauthenticated health/status endpoint — a product and security trade-off.
  - Planning impact: If yes, adds one new CF Pages Function and expands scope. If no (default), plan proceeds with `.env.example` wording only.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| actorSource in D1 (review-thread-send, review-campaign-send) | `actorSource: 'reception_proxy'` written to D1 audit records for thread sends (live path via Reception) and campaign sends (no current Reception caller — `replayPrimeInboxCampaignDelivery` calls `/api/review-campaign-replay`, not this endpoint) | PR merged and deployed to Prime CF Pages | `actorSource: 'reception_staff'` written to all new D1 audit records from these two paths; historical records with `'reception_proxy'` remain as-is | All other actorSource values unchanged (`'reception_staff_compose'` for broadcast fast-path, `'reception'` for resolve/dismiss) | Historical records remain stale — acceptable; `review-campaign-send` label fix is preemptive correctness for future direct callers |
| Test assertions for actorSource | `review-threads.test.ts:2742,3045` pin `'reception_proxy'` in `source_metadata_json` | Source rename in previous step | Test assertions updated to `'reception_staff'` and CI passes | `staff-broadcast-send.test.ts` assertion for `'reception_staff_compose'` unchanged | None |
| Local-dev env-var documentation | `.env.example` comment for `PRIME_ACTOR_CLAIMS_SECRET` does not describe the Reception-side failure mode | PR merged | Both `.env.example` files updated with clear comment: "Missing → Reception throws before calling Prime; surfaced as 502 by most routes (not a Prime-side 503)" | All other env var entries and values unchanged | Does not fix the `.env.local` values (gitignored); dev must still set the secret manually |

## Planning Handoff

- Planning focus:
  - TASK-01: Rename `actorSource: 'reception_proxy'` → `'reception_staff'` in `review-campaign-send.ts:67` and `review-thread-send.ts:66`. Note: `review-campaign-send` has no current Reception caller (`replayPrimeInboxCampaignDelivery` calls `/api/review-campaign-replay`, not this endpoint; `TC-02` asserts Reception never calls review-campaign-send); the rename is a correctness fix for any future direct caller.
  - TASK-02: Update `review-threads.test.ts:2742` and `review-threads.test.ts:3045` — change `'actorSource':'reception_proxy'` to `'actorSource':'reception_staff'` in `source_metadata_json` fixture strings
  - TASK-03: Update both `.env.example` files — enhance the `PRIME_ACTOR_CLAIMS_SECRET` comment block to describe the Reception-side 502 failure mode explicitly (thrown by `buildPrimeActorHeaders()` before Prime is called; surfaced as 502 via `inboxApiErrorResponse`, not a Prime-side 503)
- Validation implications:
  - TASK-01 and TASK-02 must land in the same PR (TASK-02 is the test update required by TASK-01; they are not independently deployable without a transient CI failure)
  - TASK-03 is independent and can be included in the same PR or a separate one
  - No D1 schema migration required
  - CI test run will confirm the 2 updated `review-threads.test.ts` assertions pass
- Sequencing constraints:
  - TASK-02 must be done alongside TASK-01; merging TASK-01 without TASK-02 will break CI
  - TASK-03 has no sequencing requirement
- Risks to carry into planning:
  - Historical D1 records: `actorSource: 'reception_proxy'` in pre-fix records will be inconsistent with post-fix records. No mitigation needed — this is expected and documented.
  - If any future operator tool reads `actorSource` to filter or display audit records, the value change could break that tool. Current investigation found no such consumer; low risk.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Undiscovered `actorSource` consumer | Low | Medium | Static search confirmed no branch/filter on this value; but dynamic usage in operator tooling not fully auditable | Planning should note the value change and confirm no BOS or reception reporting queries filter by `actorSource: 'reception_proxy'` |
| Test assertion update missed | Low | Low | The 2 fixtures are explicitly identified (lines 2742, 3045 of `review-threads.test.ts`) | Plan must include both line references in TASK-02 acceptance criteria |

## Planning Readiness

- Status: Go
- Rationale: Scope is fully bounded, approach is decisive, no blocking operator questions. Three tasks, two of which are coupled (TASK-01 + TASK-02), one independent (TASK-03). All can land in a single PR.
