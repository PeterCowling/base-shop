---
Type: Critique-History
Feature-Slug: reception-prime-projection-job-status
Artifact: fact-find.md
---

# Critique History — reception-prime-projection-job-status

## Round 1

- **Route:** codemoot
- **Score:** 6/10 → lp_score 3.0
- **Verdict:** needs_revision
- **Findings:** 1 Critical, 3 Warnings

### Findings Applied

- **[Critical]** Missing planning blocker: `replayPrimeProjectionJob` rejects non-direct threads. `shadowWritePrimeInboundActivityMessage` also writes `'pending'` jobs for activity-channel threads. A batch processor would require extending the replay helper. Added to Open Questions as blocking constraint.
- **[Warning]** Index `idx_message_projection_jobs_status_updated` on `(status, updated_at)` already exists in `0001_prime_messaging_init.sql:113` — corrected stale "no index" claim in Data & Contracts and Engineering Coverage Matrix.
- **[Warning]** `sendPrimeReviewThread` INSERT status IS tested: `review-threads.test.ts:2848,3195` assert `binds[5] === 'projected'` — corrected stated coverage gap.
- **[Warning]** `activity-message.test.ts:349` has same missing status bind assertion as TC-08 — added to coverage gaps.

---

## Round 2

- **Route:** codemoot
- **Score:** 6/10 → lp_score 3.0
- **Verdict:** needs_revision
- **Findings:** 1 Critical, 2 Warnings

### Findings Applied

- **[Critical]** Path B materially misdiagnosed: `direct-message.ts:168-207` and `activity-message.ts:116-153` already write Firebase server-side inline before calling `shadowWritePrimeInbound*`. The inline-vs-batch architectural question was on the wrong premise. Revised: Firebase sync is already inline in the API handler; shadow-write projection jobs are audit records written with incorrect `'pending'` status. Added API routes to Entry Points and scope.
- **[Warning]** Residual "no index" claim in Data & Contracts at line 126 — fixed to reference the existing index.
- **[Warning]** "Three files" scope claim was too narrow — `direct-message.ts` and `activity-message.ts` are load-bearing and added to scope.

---

## Round 3 (Final)

- **Route:** codemoot
- **Score:** 6/10 → lp_score 3.0
- **Verdict:** needs_revision (final round — all findings addressed per protocol)
- **Findings:** 1 Critical, 3 Warnings

### Findings Applied

- **[Critical]** Outcome Contract still described success as "jobs picked up after being written by a processor" — revised to reflect the actual problem (shadow-write jobs written with `'pending'` status when Firebase already synced; no processor needed or missing).
- **[Warning]** Coverage-gap section was stale (still said assert `'pending'`; task seeds said fix to `'projected'`) — updated to recommend asserting `'projected'` after fix.
- **[Warning]** Default recommendation overstated replay benefit for activity-channel jobs — `replayPrimeProjectionJob` rejects non-direct threads, so activity-channel retained jobs cannot be manually replayed. Clarified in Open Questions.
- **[Warning]** Analysis handoff inconsistency resolved: removed reference to "open architectural question" about inline-vs-batch; that question is confirmed moot. The only open question is record-retention preference.

### Post-Loop Assessment

- **Final lp_score:** 3.0/5.0 (score 6/10)
- **Verdict classification:** partially credible
- **Post-loop gate decision:** Per protocol, Round 3 is always the final round. All findings from each round were applied. The `needs_revision` verdict at score 6 reflects new findings surfaced in each round (not the same unresolved findings persisting). The fact-find artifact contains an accurate and substantially revised diagnosis. Status set to `Needs-input` per the partially-credible threshold gate.
- **Unresolved critical count:** 0
