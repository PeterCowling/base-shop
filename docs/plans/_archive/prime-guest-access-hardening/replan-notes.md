---
Replan-round: 1
Invoked-by: CHECKPOINT-04
Date: 2026-03-06
Target-tasks: TASK-05
---

# Replan Notes — prime-guest-access-hardening

## Round 1 — 2026-03-06 (Checkpoint-triggered)

**Trigger:** CHECKPOINT-04 (Wave 1 complete). TASK-05 was at 75% confidence. TASK-03 findings require scope expansion.

### New Evidence

1. **TASK-03 M1 violation confirmed:** `useFetchCheckInCode.ts` reads `checkInCodes/byUuid/{uuid}` via Firebase SDK directly. No `evaluateSdkAccess()` guard. Policy declares `arrival_code: 'FUNCTION_ONLY'` but hook is unenforced.

2. **CF Function GET now auth-gated (TASK-02 complete):** `GET /api/check-in-code?uuid=<uuid>` now requires a valid session token (Bearer or — after TASK-05 — HttpOnly cookie). This is the correct proxy target for `useFetchCheckInCode`.

3. **Firebase rules must not be tightened before SDK bypass is fixed:** Tightening `checkInCodes/byUuid` to `auth != null` before removing the unauthenticated SDK read would break door code display (SDK read returns permission-denied, autoGenerate triggers every visit). Correct order: fix SDK call first, then tighten rules (operator action after TASK-05).

4. **useFetchCheckInCode fix is bounded:** Replace `fetchCheckInCode(uuid, database)` (Firebase SDK `get()`) with a `fetch('/api/check-in-code?uuid=${uuid}')` call. After TASK-05 cookie migration, browser auto-sends the `prime_session` cookie on this same-origin request — no explicit auth header needed. `check-in-code.ts` cookie extraction (already in TASK-05 step 6) serves both `useCheckInCode.ts` and `useFetchCheckInCode.ts`.

### Confidence Delta — TASK-05

| Dimension | Old | New | Reason |
|---|---|---|---|
| Implementation | 75% | 82% | useFetchCheckInCode fix is bounded; TASK-02 confirms CF Function GET shape (`{ code, expiresAt }`); cookie auto-sent on same-origin fetch eliminates need for explicit token in useFetchCheckInCode |
| Approach | 80% | 85% | Cookie extraction already in scope in check-in-code.ts step 6; serves both callers; no additional auth mechanism needed |
| Impact | 90% | 90% | No change |

New confidence: min(82, 85, 90) = **82%** → meets IMPLEMENT ≥80% threshold.

### Scope Expansion Applied

- `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts` added to TASK-05 Affects.
- TASK-05 execution plan step added: replace `fetchCheckInCode()` (Firebase SDK) with fetch to CF Function GET.
- TASK-05 validation contract: added TC-08 (useFetchCheckInCode calls CF Function, not Firebase SDK).

### Topology Change

None. No new tasks added. No dependency changes. `/lp-do-sequence` not required.

### Readiness

TASK-05 is now **Ready** at 82% confidence. Auto-resuming `/lp-do-build prime-guest-access-hardening` from CHECKPOINT-04.
