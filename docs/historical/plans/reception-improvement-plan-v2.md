---
Type: Plan
Status: Complete
Domain: Reception
Created: 2026-01-23
Last-reviewed: 2026-01-23
Completed: 2026-01-23
Carried-forward-from:
  - docs/plans/archive/reception-functionality-improvements-plan.md
  - docs/plans/archive/reception-nextjs-migration-plan.md
---

# Reception Improvement Plan v2

Consolidated plan carrying forward remaining work from the original Reception Functionality Improvements Plan and Next.js Migration Plan. Audited 2026-01-23 against the current codebase.

## Constraints and decisions

- Desktop-only UX. No tablet/mobile layouts or touch-first work.
- Firebase Auth is implemented (no client-shipped credentials).
- Pete and Cristiana are owners; Pete is also developer.
- Offline support is client-side only (service worker + browser cache). No Cloudflare Workers/KV/R2.
- Keep Firebase Realtime Database as the primary data store for now.
- Next.js 15 App Router is the runtime (migration complete).

## Non-goals

- Full UI redesign or new visual system.
- Switching persistence from Realtime Database to Firestore.
- Multi-tenant roles or fine-grained policy engine beyond owner/developer/staff.
- Monorepo-wide test runs.

---

## Completed tasks (verified by audit 2026-01-23)

These tasks were carried forward but the audit found them already implemented:

- [x] REC-AUTH-01: Firebase Auth session + user profile
  - **Audit finding**: Fully implemented. `AuthContext.tsx` uses `signInWithEmailAndPassword`,
    `onAuthStateChanged`, and loads profiles from RTDB (`userProfiles/{uid}`). No
    NEXT_PUBLIC_USERS_JSON usage found.

- [x] REC-AUTH-02: Login UX update (email/password + optional device PIN unlock)
  - **Audit finding**: `Login.tsx` implements email/password login via Firebase Auth with
    optional device PIN (SHA-256 hashed, localStorage key `reception:devicePin`).
    PinLogin no longer exists.

- [x] REC-ROLE-01: Role-based access gates
  - **Audit finding**: Centralized `Permissions` object in `src/lib/roles.ts` with
    `canAccess(user, permission)` utility. Roles: admin, manager, staff, viewer, owner,
    developer. No hardcoded user name checks found.

- [x] REC-NAV-01: Visible navigation and shortcuts
  - **Audit finding**: Persistent collapsible sidebar at `src/components/appNav/AppNav.tsx`
    with 4 permission-gated sections (Operations, Till & Safe, Management, Admin).
    Hamburger toggle, active route highlighting, sign-out button, keyboard shortcut
    hints. All routes reachable on-screen.

---

## Active tasks (all completed 2026-01-23)

### UX Polish

- [x] REC-OPS-02: Replace remaining window.confirm with app UI
  - **Completed 2026-01-23**: Replaced the 2 remaining `window.confirm` calls with
    `useDialog().showConfirm()`:
    - `DOBSection.tsx` — date override confirmation
    - `BookingDetailsModal.tsx` — multi-guest room move confirmation
  - No `window.alert` or `window.confirm` usage remains in Reception UI code.

### Performance & Cleanup

- [x] REC-PERF-01: Reduce bundle size and log noise
  - **Completed 2026-01-23**:
    - `comuni.json` (665 KB): Converted to dynamic import with async `getComuneInfo()`.
      Module-level promise cache ensures single load. Updated `constructAlloggiatiRecord`
      and `useAlloggiatiSender` to async chain.
    - `DocInsertData.ts`: `row2.tsx` converted from static import to `useDocInsertData()`
      hook (lazy-loading hook already existed but wasn't used by row2).
    - Console logging: Added `next.config.mjs` with `compiler.removeConsole` to strip
      `console.log` and `console.warn` in production (preserves `console.error`).

- [x] REC-CLEAN-01: Remove unused drag/drop grid code
  - **Completed 2026-01-23**: Deleted `_.tsx` (DropCell) and `_BookingDraggable.tsx`.
    Neither was imported anywhere. Active grid DnD (`RowCell.tsx`) retained.

### Offline Support

- [x] REC-OFFLINE-01: Create service worker file
  - **Completed 2026-01-23**: Created `public/sw.js` and `public/offline.html`.
    - Network-first for HTML with offline fallback
    - Cache-first for static assets (JS, CSS, fonts)
    - Stale-while-revalidate for images
    - Firebase/analytics requests excluded
    - Precaches key routes: /, /bar, /checkin, /checkout, /rooms-grid

---

## Residual issues (opportunistic)

These are known issues from completed migration work. Not blocking but worth tracking:

- **Lint cleanup**: 8677 pre-existing ESLint issues (from REC-08). Separate cleanup pass needed.
- **Timezone test failures**: 3 dateUtils tests fail due to local midnight vs UTC.
- **useEndOfDayReportData test**: Calculation test expects 100, gets 50 — needs investigation.
- **UI centralization candidates**: ModalContainer and form patterns identified for future
  promotion to @acme/ui.

---

## Notes and implementation hints

- Auth: `src/context/AuthContext.tsx`, `src/services/firebaseAuth.ts`, `src/lib/roles.ts`.
- Navigation: `src/components/appNav/AppNav.tsx`.
- Dialog system: `src/context/DialogContext.tsx`, `src/components/AlertModal.tsx`,
  `src/components/ConfirmModal.tsx`.
- Toast: react-toastify via `src/utils/toastUtils.ts`.
- Offline: `src/components/ServiceWorkerRegistration.tsx`, `src/components/OfflineIndicator.tsx`.
