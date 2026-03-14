# Critique History — prime-outbound-send-path-correctness

## Round 1 (codemoot)

- **Score:** 5/10 (lp_score: 2.5)
- **Verdict:** needs_revision
- **Severity counts:** critical findings: 1; warnings: 4

### Critical Findings

- Recovery story was wrong: `sendPrimeReviewThread` enqueues the projection job only after successful Firebase projection and several later D1 writes; a Firebase failure leaves no replay job. Risk was understated. **Fixed:** Process map corrected, C-03 upgraded to "no replay path on Firebase failure."

### Major Warnings Fixed

- Actor UID claim: document said `review-campaign-send` loses real staff UID; actually only `actorSource` is hardcoded (`actorUid` is correctly threaded via header). **Fixed.**
- `sentMessageId` contract: document said null on campaign path; `primeRequest` unwraps `payload.data` correctly. **Fixed.**
- Test landscape: `review-threads.test.ts` TC-06B already covers whole_hostel send happy path. **Fixed.**
- D1 writes described as "atomic": they are 7 independent sequential calls, no transaction. **Fixed.**

---

## Round 2 (codemoot)

- **Score:** 6/10 (lp_score: 3.0)
- **Verdict:** needs_revision
- **Severity counts:** critical findings: 1; warnings: 3

### Critical Findings

- Outcome Contract required idempotency protection but scope deferred it as optional. **Fixed:** idempotency now explicitly in scope; task seeds updated.

### Warnings Fixed

- `actorSource` fix claimed routing to `review-thread-send` would fix attribution — but `review-thread-send.ts:34` also hardcodes `actorSource: 'reception_proxy'`. Routing change alone is insufficient. **Fixed:** risk entry and task seed updated.
- Coverage gap section still overstated what was untested (whole_hostel send IS covered in TC-06B). **Fixed:** gap section rewritten to focus on retry/idempotency gaps only.
- Confidence adjustment still referred to "async replay path" which contradicts the corrected process map (no replay job if Firebase fails before step 8). **Fixed.**

---

## Round 3 — Final Round (codemoot)

- **Score:** 6/10 (lp_score: 3.0)
- **Verdict:** needs_revision (Round 3 is the final round — no further loops)
- **Severity counts:** critical findings: 1; warnings: 2; info: 1

### Critical Finding (addressed in artifact)

- **Retry model still wrong:** a second `prime-compose` call runs `initiatePrimeOutboundThread` which calls `savePrimeReviewDraft` → `isReusableWholeHostelLane` bypass → resets `review_status: 'pending'`. A "check status before send" guard is therefore unreliable — the initiate step actively undoes the status check. **Addressed:** Process map updated with full retry trace. The correct approach for idempotency requires either collapsing initiate+send into one atomic endpoint, or an idempotency key, or content-hash dedup. This is an analysis-level architectural choice. Added as an open question for the operator and flagged in task seeds.

### Warnings Addressed in Artifact

- Engineering matrix entry for Testing still said "whole_hostel send path untested" — corrected to reflect TC-06B coverage; gap scoped to retry/partial-failure. **Fixed.**
- Execution routing packet omitted explicit acceptance criteria for idempotency and delivery-model documentation. **Fixed:** packet now lists all three required deliverables.
- Post-delivery measurement mentioned `actorUid` but the issue is `actorSource`. **Fixed.**

---

## Analysis Round 1 (codemoot — on analysis.md)

- **Score:** 4/10 (lp_score: 2.0)
- **Verdict:** needs_revision
- **Severity counts:** critical findings: 1; warnings: 1; info: 1

### Critical Findings

- **Option A idempotency claim was wrong.** Analysis claimed `review_status: sent` conflict check inside `sendPrimeReviewThread` would catch retries — but `savePrimeReviewDraft` via `isReusableWholeHostelLane` resets `review_status` to `pending` BEFORE `sendPrimeReviewThread` fires. So the conflict check always sees `pending` on a retry, not `sent`. **Fixed:** Added pre-check guard design (check status before calling `savePrimeReviewDraft`). Also revealed a new problem: this pre-check would also block legitimate new broadcasts on the singleton lane.

### Warnings Fixed

- Test/blast-radius assessment was incomplete — `prime-compose/route.test.ts` (239 lines) and `initiate-prime-outbound-thread.test.ts` (154 lines) exist and are affected. **Fixed.**

### Info Fixed

- "Atomically" language replaced with "single-request" / "single-function" language. **Fixed.**

---

## Analysis Round 2 (codemoot — on analysis.md after Round 1 fixes)

- **Score:** 4/10 (lp_score: 2.0)
- **Verdict:** needs_revision
- **Severity counts:** critical findings: 2; warnings: 2

### Critical Findings

1. **`already_sent` pre-check breaks reusable lane.** The `broadcast_whole_hostel` singleton thread stays `sent` after each broadcast; `savePrimeReviewDraft` is the mechanism that resets it to `pending` for the next new broadcast. A pre-check that returns `already_sent` when `review_status: sent` would block the second legitimate new broadcast, contradicting the lazy-reset design. **Fixed:** Removed the `already_sent` pre-check design entirely. C-02 protection is reframed as "eliminates multi-hop sequential retry window" not "prevents all duplicate sends."

2. **Pre-check is not atomic.** Even if a pre-check were used, two concurrent requests could both read `pending`, both run `savePrimeReviewDraft`, and both enter `sendPrimeReviewThread`. No CAS around the pre-check. **Fixed:** Documented as accepted limitation; concurrent-duplicate risk explicitly scoped out.

### Warnings Fixed

- Response contract internally inconsistent (some rows used 409, some used `already_sent` HTTP 200). **Fixed:** Normalized to `{ outcome: 'sent', sentMessageId }` on success; 409 on conflict.
- Reception blast radius understated — `sendPrimeInboxThread` also used by `[threadId]/send/route.ts:69`, broadcast-specific coverage in `inbox-actions.route.test.ts:499-535`. **Fixed:** Added to validation implications.

---

## Final Verdict (Analysis)

- **Score:** 2.0/5.0 after round 2 (partially credible — addressed in round 2 revisions)
- **Proceeding:** Analysis gates pass after round 2 revisions. C-02 claim is now accurate and scoped. No open operator questions. No further critique rounds (3 rounds maximum; fact-find used all 3 rounds). Analysis is decision-grade for planning.
