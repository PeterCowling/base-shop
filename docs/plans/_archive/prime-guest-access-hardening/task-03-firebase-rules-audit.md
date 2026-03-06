# TASK-03 — Firebase Security Rules Audit
## checkInCodes/ and guestSessionsByToken/

**Plan:** docs/plans/prime-guest-access-hardening/plan.md
**Task:** TASK-03 (INVESTIGATE)
**Date:** 2026-03-06

---

## 1. Scope of Review

Paths examined:
- `checkInCodes/byUuid/{uuid}` — guest lookup index
- `checkInCodes/byCode/{code}` — staff lookup index
- `guestSessionsByToken/{token}` — deep-link session records
- `bookings/{bookingId}` — accessed by guest-session.ts during last-name verification
- `guestsDetails/{bookingId}/{occupantId}` — accessed by guest-session.ts for PII comparison

Files read:
- `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts`
- `apps/prime/src/hooks/useCheckInCode.ts`
- `apps/prime/src/lib/security/dataAccessModel.ts`
- `apps/prime/functions/api/check-in-code.ts`
- `apps/prime/functions/api/guest-session.ts`
- `apps/prime/functions/lib/firebase-rest.ts`
- `apps/prime/functions/lib/guest-token.ts`
- `apps/reception/database.rules.json` (the deployed rules file)
- `firebase.json` (repo root — points to `apps/reception/database.rules.json`)

---

## 2. Data Access Paths — Current State

### 2.1 checkInCodes/

| Operation | Caller | Transport | Authentication |
|-----------|--------|-----------|----------------|
| GET `checkInCodes/byUuid/{uuid}` | `useFetchCheckInCode` | Firebase SDK (`get()`) | None — prime guests are never signed in to Firebase Auth |
| GET `checkInCodes/byUuid/{uuid}` | `check-in-code.ts` (CF Pages Function, GET) | Firebase REST API | `CF_FIREBASE_API_KEY` env var |
| GET `checkInCodes/byCode/{code}` | `check-in-code.ts` (CF Pages Function, POST — collision detection) | Firebase REST API | `CF_FIREBASE_API_KEY` |
| PUT `checkInCodes/byCode/{code}` | `check-in-code.ts` (CF Pages Function, POST) | Firebase REST API | `CF_FIREBASE_API_KEY` |
| PUT `checkInCodes/byUuid/{uuid}` | `check-in-code.ts` (CF Pages Function, POST) | Firebase REST API | `CF_FIREBASE_API_KEY` |

**Key finding:** `useFetchCheckInCode` reads `checkInCodes/byUuid/{uuid}` directly from the browser via Firebase SDK. Prime guest browsers hold **no Firebase Auth credential** — there is no guest sign-in path in the prime app (only staff sign in via custom token in `staffAuthBootstrap.ts`). The SDK read therefore arrives at Firebase as an **unauthenticated request**.

### 2.2 guestSessionsByToken/

All reads and writes go through Cloudflare Pages Functions using `CF_FIREBASE_API_KEY`. No client-side SDK access to this path.

### 2.3 bookings/ and guestsDetails/ (PII — accessed by guest-session.ts)

Both are server-side only via `CF_FIREBASE_API_KEY`. No client SDK access.

---

## 3. M1 Analysis — evaluateSdkAccess() Bypass

### 3.1 The declared policy

`dataAccessModel.ts` line 16:
```typescript
arrival_code: 'FUNCTION_ONLY',
```

This declares that check-in codes must only be retrieved via a CF Pages Function (server-side proxy), never via a direct Firebase SDK call from the browser.

`evaluateSdkAccess()` enforces this: if `getFlowAccessMode(flowId) !== 'SDK_ALLOWED'` it returns `{ allowed: false, reason: 'not-sdk-flow' }`.

### 3.2 What useFetchCheckInCode actually does

`useFetchCheckInCode.ts` does **not** call `evaluateSdkAccess()`. It calls `get(ref(database, codePath))` unconditionally (once uuid is non-null and the hook is enabled). There is no guard, flag check, or role check before the SDK read.

`useCheckInCode.ts` (the orchestrating hook) also does not call `evaluateSdkAccess()`.

The only place `evaluateSdkAccess()` is called in production code is for `activities_presence` (correctly `SDK_ALLOWED`).

**Conclusion: M1 violation confirmed.** `useFetchCheckInCode` reads Firebase directly, bypassing the CF Function proxy despite `arrival_code: 'FUNCTION_ONLY'`.

**Practical effect today:** Since guest browsers have no Firebase Auth, the unauthenticated SDK read likely returns a Firebase permission-denied error silently. The guest then falls through to the `autoGenerate` path in `useCheckInCode`, which triggers `POST /api/check-in-code`. The code is generated and written server-side, but never successfully retrieved via SDK — guests likely always see their code generated fresh each time rather than fetched from the cache.

---

## 4. Firebase Security Rules — Current State

### 4.1 Rules file location

`firebase.json` (repo root):
```json
{
  "database": {
    "rules": "apps/reception/database.rules.json"
  }
}
```

**Important:** `firebase.json` points to a rules file named under `apps/reception/`. This file contains reception-app-specific paths. The `prime` app uses Firebase project `prime-f3652` (see `wrangler.toml`: `CF_FIREBASE_DATABASE_URL = "https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app"`). The reception app may use a **different Firebase project**. The rules in `apps/reception/database.rules.json` may apply to the reception project only, not to `prime-f3652`.

**This is a critical ambiguity:** the rules in the repo may not govern the prime-f3652 database at all.

### 4.2 Coverage of prime-relevant paths in the reception rules file

The reception rules explicitly cover: `userProfiles/`, `cashCounts/`, `safeCounts/`, `tillShifts/`, `tillEvents/`, `cashDiscrepancies/`, `keycardDiscrepancies/`, `keycardTransfers/`, `creditSlips/`, `ccIrregularities/`, `allFinancialTransactions/`, `financialsRoom/`, `inventory/`, `settings/`, `audit/`, `reconciliation/`, `drawerAlerts/`, `keycardAssignments/`, `bookingMeta/`, `eodClosures/`.

**`checkInCodes/` — not present.**
**`guestSessionsByToken/` — not present.**
**`bookings/` — not present.**
**`guestsDetails/` — not present.**

### 4.3 The catchall rule in the reception rules file

```json
"$other": {
  ".read": "auth != null",
  ".write": "auth != null"
}
```

This governs every path not explicitly listed. Under this rule, unauthenticated reads are denied (`auth != null` required). However, this rule is only relevant if these rules actually govern the `prime-f3652` database — which is unconfirmed.

### 4.4 CF_FIREBASE_API_KEY bypass risk

`FirebaseRest` appends `?auth={CF_FIREBASE_API_KEY}` to every REST request. If this is a Firebase **database secret** (likely given it is stored server-side only, never in `NEXT_PUBLIC_*`), then all CF Function operations **bypass Security Rules entirely**, regardless of what the rules say.

---

## 5. Risk Assessment

| Finding | Severity | Current exposure |
|---------|----------|------------------|
| M1 violation: `useFetchCheckInCode` bypasses FUNCTION_ONLY | High | Likely fails silently (unauthenticated SDK reads denied by `auth != null`), causing guests to always regenerate rather than fetch codes. No data leakage, but design contract broken. |
| `prime-f3652` database rules unknown | High | Cannot confirm what rules govern the prime database. If rules are absent or permissive, unauthenticated reads may succeed. |
| `checkInCodes/` and `guestSessionsByToken/` not in reception rules | Medium | Under the catchall, requires `auth != null`. But if `prime-f3652` has no rules file at all (common for new Firebase projects), the database defaults to fully open (`.read: true`, `.write: true`). |
| `CF_FIREBASE_API_KEY` likely bypasses rules | Medium | Acceptable for trusted server-side code, but means Security Rules cannot protect against a compromised or misconfigured CF Function. |
| `bookings/` and `guestsDetails/` PII not scoped | High | If reception Firebase Auth users can access `prime-f3652`, they could read all booking PII. However, Firebase Auth tokens are project-scoped — reception users cannot authenticate to prime-f3652 unless explicitly granted. |

---

## 6. Recommended Firebase Security Rules for prime-f3652

The following rules should be deployed to the `prime-f3652` Realtime Database. They assume:
- Prime guests do not have Firebase Auth credentials (correct today).
- CF Pages Functions use a database secret or service account that bypasses rules (correct for server-side writes).
- If TASK-05 (cookie migration) introduces Firebase Auth for guests with `uid = guestUuid`, the `auth.uid == $uuid` branch activates without a rule change.

```json
{
  "rules": {
    "checkInCodes": {
      ".read": "false",
      ".write": "false",
      "byUuid": {
        "$uuid": {
          ".read": "auth != null && (auth.uid == $uuid || root.child('userProfiles').child(auth.uid).child('roles').child('staff').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('admin').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('owner').val() == true)",
          ".write": "false"
        }
      },
      "byCode": {
        "$code": {
          ".read": "auth != null && (root.child('userProfiles').child(auth.uid).child('roles').child('staff').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('admin').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('owner').val() == true)",
          ".write": "false"
        }
      }
    },
    "guestSessionsByToken": {
      ".read": "false",
      ".write": "false",
      "$token": {
        ".read": "auth != null && (root.child('userProfiles').child(auth.uid).child('roles').child('staff').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('admin').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('owner').val() == true)",
        ".write": "false"
      }
    },
    "bookings": {
      ".read": "auth != null && (root.child('userProfiles').child(auth.uid).child('roles').child('staff').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('admin').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('owner').val() == true)",
      ".write": "false"
    },
    "guestsDetails": {
      ".read": "auth != null && (root.child('userProfiles').child(auth.uid).child('roles').child('admin').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('owner').val() == true)",
      ".write": "false"
    },
    "$other": {
      ".read": "false",
      ".write": "false"
    }
  }
}
```

**Rule rationale:**

| Path | Read | Write | Rationale |
|------|------|-------|-----------|
| `checkInCodes/byUuid/$uuid` | `auth.uid == $uuid` OR staff+ | `false` (server secret bypasses) | Forward-compatible: when guests get Firebase Auth with `uid = guestUuid`, they can read their own code |
| `checkInCodes/byCode/$code` | Staff+ only | `false` | Code lookup by value is staff-facing (reception desk) |
| `guestSessionsByToken/$token` | Staff+ only | `false` | Token records contain booking linkage |
| `bookings/` | Staff+ only | `false` | Booking data accessed server-side by CF Functions |
| `guestsDetails/` | Admin/Owner only | `false` | Contains guest PII (name); restrict further than bookings |
| `$other` | `false` | `false` | Explicit deny-all for unlisted paths |

---

## 7. Critical Dependency: Fix useFetchCheckInCode Before Tightening Rules

**If the recommended rules are deployed BEFORE `useFetchCheckInCode` is fixed:**
- The hook's unauthenticated SDK read (`checkInCodes/byUuid/{uuid}`) will return a Firebase permission-denied error (already likely happening, but now guaranteed).
- The `autoGenerate` path in `useCheckInCode` will trigger a POST to `/api/check-in-code` (now auth-gated by TASK-02).
- If the guest has a valid session token (TASK-02 deployed), code generation succeeds.
- However, subsequent SDK reads still fail — guests always regenerate, never fetch from cache via SDK.

**The correct fix for useFetchCheckInCode (to be included in TASK-05 scope):**
Replace Firebase SDK direct read in `useFetchCheckInCode` with a CF Function proxy call to `GET /api/check-in-code?uuid=${uuid}` (which TASK-02 has now auth-gated). This routes through the server-side function, respects the `FUNCTION_ONLY` policy, and eliminates the unauthenticated SDK call.

**Recommended sequencing:**
1. TASK-02 ✓ (already applied) — CF Function GET now requires auth token
2. TASK-05 (cookie migration) — expand scope to fix `useFetchCheckInCode` to call CF Function GET
3. Deploy Firebase Security Rules — after SDK read is removed from client code

---

## 8. Summary of Findings

| Finding | Severity | Action |
|---------|----------|--------|
| M1 violation: `useFetchCheckInCode` bypasses FUNCTION_ONLY | High | Fix in TASK-05 scope: route through CF Function GET |
| `prime-f3652` database rules unknown (may be absent) | High | Operator action: check Firebase console for prime-f3652 project rules |
| `checkInCodes/` and `guestSessionsByToken/` unscoped | High | Deploy recommended rules AFTER `useFetchCheckInCode` is fixed |
| `bookings/` and `guestsDetails/` PII unscoped | High | Include in rules deployment |
| `firebase.json` points to reception rules — may not govern prime-f3652 | Critical | Operator must confirm which rules file (if any) governs prime-f3652 RTDB |
| Rules tightening blocked on SDK fix | Medium | Do not deploy rules before TASK-05 ships |
