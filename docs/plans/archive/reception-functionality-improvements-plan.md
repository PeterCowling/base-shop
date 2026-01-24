---
Type: Plan
Status: Archived
Domain: Reception
Last-reviewed: 2026-01-15
Archived: 2026-01-23
Carried-forward-to: docs/plans/reception-improvement-plan-v2.md
Relates-to charter: none
---

# Reception - Functionality Improvements Plan

Bring the Reception app from "works but incomplete" to a production-ready
operations tool with secure auth, clear navigation, finished workflows, and
cost-aware offline support.

## Constraints and decisions

- Desktop-only UX. No tablet/mobile layouts or touch-first work.
- Migrate to Firebase Auth (no client-shipped credentials).
- Pete and Cristiana are owners; Pete is also developer.
- Offline support should be client-side only (service worker + browser cache).
  Avoid Cloudflare Workers/KV/R2 or other paid features.
- Keep Firebase Realtime Database as the primary data store for now.

## Non-goals

- Full UI redesign or new visual system.
- Switching persistence from Realtime Database to Firestore.
- Multi-tenant roles or fine-grained policy engine beyond owner/developer/staff.
- Monorepo-wide test runs.

## Active tasks

- [ ] REC-AUTH-01: Firebase Auth session + user profile
  - Scope:
    - Add Firebase Auth initialization and a session listener.
    - Expand user shape to include uid, email, display name, and roles.
    - Load roles from a secured profile source (custom claims or user doc).
    - Remove reliance on NEXT_PUBLIC_USERS_JSON.
  - Dependencies:
    - Firebase project configured with Auth providers and role source.
  - Definition of done:
    - Auth state is driven by Firebase; no client-side credential JSON is used.
    - User context exposes roles and auth state across the app.

- [ ] REC-AUTH-02: Login UX update (email/password + optional device PIN unlock)
  - Scope:
    - Replace PinLogin with a Firebase Auth login screen.
    - Add optional device PIN unlock for returning sessions (stored locally,
      only after a successful Firebase login on that device).
    - Ensure logout clears local unlock state and session.
  - Dependencies:
    - REC-AUTH-01.
  - Definition of done:
    - New login flow is functional; device PIN is optional and local only.
    - No PINs or credentials are shipped in the build output.

- [ ] REC-ROLE-01: Role-based access gates
  - Scope:
    - Define roles: owner, developer, staff.
    - Replace hard-coded name checks with role checks.
    - Add a shared access utility for UI gating and route guards.
  - Dependencies:
    - REC-AUTH-01.
  - Definition of done:
    - Pages and privileged actions respect roles, not user_name strings.
    - Owners and developers match the existing Pete/Cristiana behavior.

- [ ] REC-NAV-01: Visible navigation and shortcuts
  - Scope:
    - Add a persistent on-screen nav/launcher for all sections.
    - Preserve keyboard shortcuts but do not rely on them for discovery.
    - Add a visible logout action.
  - Dependencies:
    - REC-ROLE-01 (for role-aware navigation).
  - Definition of done:
    - Every route is reachable via on-screen navigation for authorized users.

- [x] REC-THEME-01: Align Reception Tailwind v4 globals
  - Scope:
    - Replace legacy `@tailwind` directives with `@import "tailwindcss"` in globals.
    - Keep Reception's Tailwind config as the source of operations colors/tokens.
    - Add a Tailwind build test for Reception globals.
  - Dependencies:
    - None.
  - Definition of done:
    - Login and dashboard styling render with Tailwind utilities.
    - Tailwind build test for Reception globals passes.

- [x] REC-OFFLINE-01: Cost-aware offline strategy
  - Scope:
    - Define offline policy (read-only when offline; no queued writes).
    - Add offline/online indicator and "stale data" messaging.
    - Keep precache minimal and rely on runtime cache of visited pages.
    - Avoid caching Firebase API responses that could become stale.
  - Dependencies:
    - REC-NAV-01 (for global UI placement of offline status).
  - Definition of done:
    - App shell loads offline after a prior online visit.
    - No new Cloudflare services are required.
  - **Status (2026-01-15): COMPLETE**
    - Created `apps/reception/public/sw.js` - service worker with:
      - Network-first strategy for HTML pages with offline fallback
      - Cache-first for static assets (JS, CSS, fonts)
      - Stale-while-revalidate for images
      - Firebase requests excluded from caching (always fresh)
      - Precaches key operational pages (/, /bar, /checkin, /checkout, /rooms-grid)
    - Created `apps/reception/public/offline.html` - offline fallback page with dark mode support
    - Created `apps/reception/src/components/ServiceWorkerRegistration.tsx` - client component for SW registration
    - Created `apps/reception/src/components/OfflineIndicator.tsx` - amber banner when offline
    - Updated `apps/reception/src/app/layout.tsx` to include SW registration and offline indicator

- [x] REC-OPS-01: Finish booking search bulk actions
  - Scope:
    - Implement bulk email using existing booking email services.
    - Implement CSV export for selected bookings.
    - Implement bulk cancel with confirmation + Firebase mutation.
  - Dependencies:
    - REC-ROLE-01 (permissions for destructive actions).
  - Definition of done:
    - Bulk actions perform real work and update UI state.
  - **Status (2026-01-15): COMPLETE** (CSV export + bulk cancel; bulk email deferred)
    - Created `apps/reception/src/hooks/mutations/useBulkBookingActions.ts`:
      - `cancelBookings(refs)` - cancels multiple bookings with success/failure tracking
      - `exportToCsv(data)` - exports selected bookings to CSV with download trigger
    - Created `apps/reception/src/components/search/BulkActionsToolbar.tsx`:
      - Shows when rows are selected
      - "Export CSV" button (available to all users)
      - "Cancel Selected" button (requires BULK_ACTIONS permission - owner/developer only)
      - Uses existing `ConfirmCancelModal` for confirmation
    - Updated `apps/reception/src/components/search/BookingSearchTable.tsx`:
      - Added row selection state with checkboxes
      - "Select all" checkbox in header
      - Visual highlighting of selected rows
      - Integrated `BulkActionsToolbar` component
    - **Note:** Bulk email was not implemented - the existing email system sends individual emails through `EmailProgressActions` and would need significant work to support bulk sending

- [ ] REC-OPS-02: Replace alert/confirm with app UI
  - Scope:
    - Replace window.alert and window.confirm in core flows with toasts
      and confirm modals.
    - Standardize error and success messaging.
  - Dependencies:
    - REC-NAV-01 (for consistent placement of notifications).
  - Definition of done:
    - No alert/confirm usage remains in Reception UI code.

- [ ] REC-PERF-01: Reduce bundle size and log noise
  - Scope:
    - Lazy-load large lookup data (comune codes, doc insert data).
    - Gate console logging behind a debug flag.
  - Dependencies:
    - None.
  - Definition of done:
    - Initial bundle shrinks and console logs are silent in normal use.

- [ ] REC-CLEAN-01: Remove or integrate unused drag/drop grid code
  - Scope:
    - Decide whether DropCell is part of the supported workflow.
    - If not used, delete it and any orphan references.
    - If used, wire it into RoomGrid with tests.
  - Dependencies:
    - None.
  - Definition of done:
    - No unused room-grid drag/drop code remains.

## Notes and implementation hints

- Auth entrypoints today: `apps/reception/src/App.tsx`,
  `apps/reception/src/context/AuthContext.tsx`,
  `apps/reception/src/components/PinLogin.tsx`.
- Role checks are currently scattered across multiple screens; centralize them
  under a shared utility.
- Service worker lives at `apps/reception/public/sw.js`.