# Critique History — reception-room-cleaning-status-pipeline

## Plan Stage

## Round 1 (2026-03-14)

- **Score:** 6/10 — lp_score: 3.0
- **Verdict:** needs_revision
- **Criticals (1):**
  - Line 248: `isToday(dbStatus.cleaned)` guard incorrect — `cleaned` is a full ISO timestamp; `isToday()` compares only `YYYY-MM-DD`. Fixed → epoch comparison with string narrowing.
- **Warnings (4):**
  - Line 81: Wrong checkins entry point (`live/page.tsx` redirects; correct is `checkin/page.tsx`). Fixed.
  - Line 267: Subscription dedup overclaimed. `useFirebaseSubscription` creates per-instance listeners. Fixed.
  - Line 136: `saveRoomStatus` error handling inaccurate. Fixed.
  - Line 154: Test coverage overstated. Fixed.
- **Infos (1):**
  - Line 119: Prepare-side wiring underspecified. Fixed.

---

## Round 2 (2026-03-14)

- **Score:** 8/10 — lp_score: 4.0
- **Verdict:** needs_revision
- **Criticals (0)**
- **Warnings (2):**
  - Line 50: Stale Firebase dedup claim in Assumptions. Fixed.
  - Line 248: Guard description in task seed still used `isToday`. Fixed with epoch + string narrowing.
- **Infos (2):**
  - Line 229: Risk table still referenced `isToday`. Fixed.
  - Line 277: Remaining Assumptions still had stale dedup claim. Fixed.

---

## Round 3 (2026-03-14) — Final Round

- **Score:** 8/10 — lp_score: 4.0
- **Verdict:** credible (final round, no further loops)
- **Criticals (0)**
- **Warnings (2) — all fixed:**
  - Line 51: Guard not type-safe — `typeof dbStatus.cleaned === "string"` narrowing required before `toEpochMillis()`. Fixed.
  - Line 293: Rehearsal trace internally inconsistent on prepare-side wiring. Fixed.
- **Infos (2) — all fixed:**
  - Line 90: `BookingRow` option still presented per-row subscription as viable. Tightened to prop-threading only. Fixed.
  - Line 91: 8th-cell impact understated — `TableHeader.tsx` and `colSpan={7}` also need updating. Fixed.

### Plan Round 1 (2026-03-14)

- **Score:** 7/10 — lp_score: 3.5
- **Verdict:** needs_revision
- **Criticals (0)**
- **Warnings (4) — fixed:**
  - Line 285: `useCallback([], [saveRoomStatus])` is not valid React API usage (first arg must be a function). Fixed: `useCallback((roomNumber: string) => ..., [saveRoomStatus])`.
  - Line 295: Green step only shows `disabled={!isToday}` but acceptance requires `disabled={isWriting || !isToday}` too. Fixed: added `isWriting` to button disabled state + threaded as prop.
  - Line 484: Mock path `../../hooks/data/useRoomStatus` wrong for `CheckinsTable.test.tsx` (existing mocks use `../../../hooks/...`). Fixed: `../../../hooks/data/useRoomStatus`.
  - Line 479: Snapshot regeneration instructions referenced `--updateSnapshot` locally, conflicting with CI-only testing policy. Fixed: delete `.snap` file and push to CI.
- **Infos (1) — fixed:**
  - Line 17: `Overall-confidence: 83%` inconsistent with calculated 85% at line 545; `Confidence-Method` didn't describe the bias. Fixed: changed to 85%, removed bias description.

### Plan Round 2 (2026-03-14)

- **Score:** 8/10 — lp_score: 4.0
- **Verdict:** needs_revision
- **Criticals (0)**
- **Warnings (1) — fixed:**
  - Line 296: Single `useState<boolean>` pending flag would disable entire table during one room write. Fixed: changed to per-room `useState<string | null>` (`writingRoom`); only the active room's button disables; other rooms remain interactive.
- **Infos (1) — fixed:**
  - Line 127: Performance note said "called once" for `useRoomStatusMutations()` but it's also used inside `usePrepareDashboardData()`. Clarified: `useRoomStatusMutations()` has no subscription overhead; the single-subscription constraint applies only to `useRoomStatusData()`.

### Plan Round 3 (2026-03-14) — Final Round

- **Score:** 7/10 — lp_score: 3.5
- **Verdict:** needs_revision (final round — applied fixes, no further critique)
- **Criticals (0)**
- **Warnings (3) — all fixed:**
  - Line 285: `string | null` pending state has race condition when two rooms clicked quickly. Fixed: reverted to `useState<boolean>` global write lock, documented explicitly as intentional product decision for single-operator cleaning tool.
  - Line 458: No test for pending state behavior. Fixed: added TC-03 to TASK-06 — during pending write, all Mark Clean buttons disabled.
  - Line 479: "Delete .snap and push" instruction incompatible with CI `--ci` flag (blocks snapshot auto-regeneration). Fixed: changed `TableHeader` test to use explicit `getByText` assertions instead of `toMatchSnapshot()` — avoids the constraint entirely.

**Final lp_score: 3.5** (score 7/10, normalized). Round 3 is the terminal round per critique loop protocol.
