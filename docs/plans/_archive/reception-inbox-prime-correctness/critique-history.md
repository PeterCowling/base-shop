---
Type: Critique-History
Status: Archived
Feature-Slug: reception-inbox-prime-correctness
---

# Critique History: reception-inbox-prime-correctness

## Fact-Find Critique

### Round 1 — 2026-03-08

**Route:** codemoot
**Score:** 7/10 → lp_score 3.5 (partially credible)
**Verdict:** needs_revision
**Findings:** 4 warnings (Major), 1 info (Minor)

Findings applied: Issue A task seed incomplete; `InboxRequestInit` signal description contradictory; Issue B goal vs default inconsistency; deployment risk overstated; test inventory understated.

### Round 2 — 2026-03-08

**Route:** codemoot
**Score:** 8/10 → lp_score 4.0 (credible)
**Verdict:** needs_revision (score credible; 3 remaining warnings fixed post-round)
**Findings:** 3 warnings (Major), 1 info (Minor)

Findings applied: Entry Points description corrected; API/contracts section aligned with two-layer fix; sendDraft race mitigation corrected; execution packet softened.

---

## Plan Critique

### Round 1 — 2026-03-08

**Route:** codemoot
**Score:** 8/10 → lp_score 4.0 (credible)
**Verdict:** needs_revision
**Findings:** 4 warnings (Major), 1 info (Minor)

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 4 |
| Minor | 1 |

Findings applied:
1. [Major] TASK-04 surface incomplete — `InboxMessageApiModel` must be extended, not just mapper. Fixed: `api-models.server.ts` added to TASK-04 Affects.
2. [Major] TASK-05 wrong test surface — `inbox-actions.route.test.ts` can't test hook. Fixed: new `useInbox.test.ts` hook test with `renderHook`.
3. [Major] TASK-06 same wrong test surface. Fixed: same `useInbox.test.ts` hook file.
4. [Major] `audience` dropped from TASK-03/04 scope. Fixed: added throughout.
5. [Minor] Confidence math 83.1% stated as 85%. Fixed: corrected to 80% (downward bias rule).

---

### Round 2 — 2026-03-08

**Route:** codemoot
**Score:** 8/10 → lp_score 4.0 (credible)
**Verdict:** needs_revision (score credible; 3 remaining warnings fixed post-round)
**Findings:** 3 warnings (Major), 1 info (Minor)

Findings applied:
1. [Major] Client `InboxMessage` type in `useInbox.ts` not updated — added to TASK-04 Affects; five optional fields on both server and client types.
2. [Major] Attachment shape incompatibility (`{filename,mimeType,size}` vs `{kind,url,...}`) — fixed by using separate `primeAttachments` field rather than reusing `attachments`.
3. [Major] TASK-05 hook test not executable via `jest.mock` on same-module functions — fixed: use `global.fetch = jest.fn()` as the correct seam.
4. [Info] TASK-03 execution plan said "four" fields; now five. Fixed.

**Final verdict: credible (4.0). No Critical findings. Proceeding to delivery rehearsal.**
