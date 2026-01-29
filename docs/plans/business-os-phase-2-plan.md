---
Type: Plan
Status: Draft
Domain: Business OS
Created: 2026-01-29
Last-reviewed: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: business-os-phase-2
Overall-confidence: TBD
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Supersedes:
  - docs/plans/business-os-kanban-plan.md (Phase 0/1 complete)
  - docs/plans/business-os-board-ux-overhaul-plan.md (Phase 1 complete)
---

# Business OS Phase 2+ Plan

## Summary

This plan consolidates remaining incomplete tasks from Phase 0/1 Business OS plans and defines Phase 2+ priorities. Phase 1 delivered a fully functional Pete-only local Kanban system with Universal Capture, search/filtering, and archive functionality. Phase 2 focuses on multi-user support, mobile optimization, and advanced features.

**Phase 1 Achievements** (Jan 28-29, 2026):
- ✅ Core Kanban infrastructure (32 tasks: BOS-01 through BOS-32)
- ✅ Board UX Overhaul (17 tasks: BOS-UX-01 through BOS-UX-17)
- ✅ Archive view with permission-based filtering
- ✅ Universal Capture workflow (FAB + modal + keyboard shortcuts)
- ✅ Search, filtering, and board view switcher
- ✅ Toast notifications and navigation infrastructure

**Phase 2 Focus**:
- Multi-user authentication and permissions
- Mobile-optimized responsive layout
- Docs registry sync automation
- Advanced filtering and keyboard power features

## Goals

1. **Multi-user Support** - Enable Cristiana, Avery, and future team members to use Business OS
2. **Mobile Optimization** - Vertical lane stacking, touch-friendly interactions, single-lane picker
3. **Advanced Findability** - Multi-select filters, date range filtering, saved filter presets
4. **Power User Features** - Keyboard navigation, bulk actions, server-side search
5. **Production Readiness** - Registry sync automation, hosted deployment, monitoring

## Non-goals

- Full ERP feature parity (keep system lightweight and focused)
- Public access or external stakeholder views (Phase 3+)
- Automatic agent task execution (remains Pete-triggered in Phase 2)
- Card dependencies visualization (graph view deferred to Phase 3+)
- Time tracking or effort estimation (out of scope)

## Constraints & Assumptions

**Constraints:**
- Must maintain backward compatibility with Phase 1 Card/Lane/Idea types
- Mobile layout must work on iOS Safari and Android Chrome
- Auth mechanism must support repo-backed identity (no external auth providers in Phase 2)
- Hosted deployment must preserve git-based audit trail

**Assumptions:**
- User switcher for dev/testing sufficient for Phase 2 (full auth in Phase 3)
- Mobile usage primarily Read mode (bulk editing remains laptop-only)
- Advanced filters have <5% usage vs basic search (nice-to-have, not critical)
- Registry sync performance acceptable at <10s per Sync

## Fact-Find Reference

- Related briefs:
  - `docs/plans/business-os-kanban-plan.md` (Phase 0/1 baseline)
  - `docs/plans/business-os-board-ux-overhaul-plan.md` (Phase 1 UX baseline)
  - `docs/plans/business-os-card-presentation-fact-find.md` (UX research)
- Key findings from Phase 1:
  - Archive functionality implemented (admin vs regular user permissions)
  - User model established (Pete, Cristiana as admins; Avery as regular user)
  - All Phase 1 UI components tested and operational
  - Client-side filtering performs well (<100ms for 50 cards)
  - Mobile FAB pattern validated as successful

## Existing System Notes

**Phase 1 Baseline:**
- Current users: `src/lib/current-user.ts` (Pete, Cristiana, Avery defined)
- Archive view: `src/app/archive/page.tsx` (permission-based filtering)
- Board components: `src/components/board/` (BoardView, BoardLane, CompactCard, SearchBar, FilterChips, BoardViewSwitcher)
- Layout: `src/app/layout.tsx` (ToastProvider, KeyboardShortcutProvider, CaptureFAB)
- Navigation: `src/components/navigation/NavigationHeader.tsx` (Archive link added)
- Types: `src/lib/types.ts` (Card includes Blocked field, Lane includes Reflected)

**Patterns established:**
- Permission checks: `canViewAllArchived(user)` pattern in `current-user.ts`
- User switching: Environment variable `CURRENT_USER_ID` for dev/testing
- Archive detection: `card.filePath.includes("/archive/")`
- Responsive patterns: `md:hidden` for mobile-only, `hidden md:flex` for desktop-only

## Proposed Approach

### Phase 2A: Multi-User Foundation (Priority: HIGH)

**User Authentication & Identity:**
- Extend current-user.ts with session management
- Add user switcher component for dev/testing (environment-based in Phase 2)
- Implement permission checks for card editing (owner-only vs admin)
- Add user profile page (view responsibilities, assigned cards)

**User-Scoped Visibility:**
- Filter "My items" shows cards where `Owner === currentUser.name`
- Inbox ideas show submitter's own raw ideas (unless admin)
- Card edit permissions: owner + admins only
- Plan/people edit permissions: admins only (existing constraint)

### Phase 2B: Mobile Optimization (Priority: HIGH)

**Responsive Layout:**
- Vertical lane stacking on mobile (<768px)
- Single-lane picker/selector (tab-based navigation)
- Touch-friendly card interactions (larger touch targets, swipe gestures)
- Optimized mobile nav (bottom tab bar instead of hamburger)

**Mobile-Specific Features:**
- Pull-to-refresh for board updates
- Bottom sheet for card detail (instead of full-page navigation)
- Sticky FAB with quick actions menu (Capture, Filter, Search)
- Offline indicator and retry logic

### Phase 2C: Advanced Features (Priority: MEDIUM)

**Advanced Filtering:**
- Multi-select filter chips (select multiple owners, priorities)
- Date range filter (due date between X and Y)
- Saved filter presets (save commonly used filter combinations)
- Combined logic (AND/OR operators for complex queries)

**Keyboard Power Features:**
- Arrow key navigation between cards
- Bulk selection with Shift+click
- Bulk actions (assign owner, set priority, add tags)
- Quick jump to card by ID (`G` then card ID)

**Search Enhancements:**
- Server-side full-text search (for large card sets >500)
- Search in card content/comments (not just title/ID)
- Search suggestions/autocomplete
- Search history

### Phase 2D: Infrastructure & Production (Priority: MEDIUM)

**Registry Sync Automation:**
- Implement BOS-00-C (registry sync on Sync/push)
- Background job option for eventual consistency
- Graceful handling of `pnpm docs:lint` errors

**Hosted Deployment:**
- Resolve BOS-00-A (deployment runtime and git access model)
- Self-hosted VM option with git checkout
- OR GitHub API commits (no local git)
- Credentials management for hosted mode
- Concurrency/locking strategy for multi-instance

**Monitoring & Observability:**
- Error tracking (Sentry or similar)
- Performance monitoring (board render time, filter latency)
- Audit log for sensitive operations (plan edits, lane moves)
- Health check endpoint for uptime monitoring

## Tasks

### BOS-00-C: Implement registry sync on Sync (carry forward from Phase 1)

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/lib/repo/registry-sync.ts`, BOS-10 write operations
- **Depends on:** BOS-07 (complete)
- **Status:** Deferred from Phase 1
- **Confidence:** 60%
  - Implementation: 65% — Registry generation logic understood; sync mechanism straightforward
  - Approach: 60% — Two approaches: (1) call `pnpm docs:lint` on Sync, (2) replicate registry logic in app
  - Impact: 55% — Stale registry breaks queries; non-critical for single-user Phase 1
- **Effort:** S (Small)
- **Priority:** P2 (Medium - needed for multi-user Phase 2)
- **Description:**
  - Problem: After app writes new docs, registry is stale until `pnpm docs:lint` runs manually
  - Solution: Run `pnpm docs:lint` on Sync after merging origin/main, commit updated `docs/registry.json`, then push
  - Trade-off: Sync is slower but registry guaranteed correct when changes pushed
- **Acceptance:**
  - Registry sync runs on Sync only (no registry updates on Save)
  - Sync runs `pnpm docs:lint` and commits `docs/registry.json` updates before pushing
  - `pnpm docs:lint` non-zero exit code does not block Sync (surface as warnings)
  - Performance: Registry sync completes in <10s per Sync
- **Test plan:**
  - Integration: Save idea/card → verify registry.json unchanged → Sync → verify registry.json updated
  - Integration: `pnpm docs:lint` returns non-zero → Sync still pushes with warnings
- **Rollout / rollback:**
  - Rollout: Integrated into RepoStore Sync
  - Rollback: If registry sync fails, Save still succeeds; manual `pnpm docs:lint` as fallback

---

### BOS-P2-01: Add user switcher component for dev/testing

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/user/UserSwitcher.tsx` (new)
  - `apps/business-os/src/components/navigation/NavigationHeader.tsx` (add switcher)
  - `apps/business-os/src/lib/current-user.ts` (add setCurrentUser helper)
- **Depends on:** -
- **Status:** Pending
- **Confidence:** 85%
  - Implementation: 90% — Simple dropdown to change environment variable
  - Approach: 85% — Environment-based switching sufficient for Phase 2; full auth in Phase 3
  - Impact: 80% — Enables multi-user testing but not production-ready auth
- **Effort:** M (Medium)
- **Priority:** P0 (Critical - blocks all multi-user features)
- **Description:**
  - Add dropdown in NavigationHeader showing current user (Pete/Cristiana/Avery)
  - Clicking switches `CURRENT_USER_ID` and reloads page
  - Only visible in development mode (hidden in production)
  - Enables testing permission-based features without full auth
- **Acceptance:**
  - User switcher renders in NavigationHeader (dev mode only)
  - Selecting user updates `CURRENT_USER_ID` and reloads page
  - Current user name displayed in switcher button
  - All permission checks (archive, card editing) work correctly per user
- **Test plan:**
  - Manual: Switch between Pete, Cristiana, Avery → verify permissions change
  - Manual: Verify switcher hidden in production build
  - Unit test: setCurrentUser helper updates environment correctly
- **Rollout / rollback:**
  - Rollout: Add switcher to dev builds only
  - Rollback: Remove switcher component

---

### BOS-P2-02: Implement owner-only card editing permissions

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/boards/[businessCode]/[cardId]/page.tsx` (add permission check)
  - `apps/business-os/src/lib/current-user.ts` (add canEditCard helper)
  - `apps/business-os/src/components/card-detail/CardDetail.tsx` (conditional edit UI)
- **Depends on:** BOS-P2-01
- **Status:** Pending
- **Confidence:** 88%
  - Implementation: 90% — Permission check + conditional UI rendering
  - Approach: 88% — Owner-only + admin override is correct model
  - Impact: 85% — Changes edit workflow; needs careful testing
- **Effort:** M (Medium)
- **Priority:** P1 (High - core security for multi-user)
- **Description:**
  - Add `canEditCard(user, card)` helper: returns true if user is card owner OR admin
  - Card detail page shows edit button only if canEditCard returns true
  - Attempting to edit unauthorized card shows error toast
  - Admins (Pete, Cristiana) can edit any card
- **Acceptance:**
  - canEditCard helper returns correct boolean for owner/admin/other
  - Edit button hidden for non-owners (except admins)
  - API route enforces server-side permission check (defense in depth)
  - Error toast shown if unauthorized edit attempted
- **Test plan:**
  - Unit test: canEditCard returns true for owner, true for admin, false for other
  - Integration test: Pete can edit any card, Avery can only edit own cards
  - Manual: Verify edit button visibility changes per user
- **Rollout / rollback:**
  - Rollout: Add permission checks, update UI conditionally
  - Rollback: Remove permission checks, restore universal edit access

---

### BOS-P2-03: Mobile vertical lane stacking layout

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/board/BoardView.tsx` (responsive layout)
  - `apps/business-os/src/components/board/MobileLanePicker.tsx` (new)
- **Depends on:** -
- **Status:** Pending
- **Confidence:** 75%
  - Implementation: 80% — CSS flexbox/grid changes + lane picker component
  - Approach: 75% — Single-lane picker vs vertical stacking tradeoff unclear
  - Impact: 70% — Major layout change; needs extensive mobile testing
- **Effort:** L (Large)
- **Priority:** P1 (High - critical for mobile adoption)
- **Description:**
  - On mobile (<768px), switch from horizontal scrolling to vertical single-lane view
  - Add MobileLanePicker component (tab bar or dropdown) to select active lane
  - Cards within selected lane displayed vertically
  - Lane picker sticky at top of viewport
  - Preserve search/filter functionality on mobile
- **Acceptance:**
  - Mobile layout (<768px) shows single lane vertically
  - Lane picker allows switching between lanes
  - Search and filter chips remain functional on mobile
  - Smooth transitions between lane selections
  - No horizontal scrolling on mobile
- **Test plan:**
  - Manual: Test on iOS Safari (iPhone 12, 14 Pro)
  - Manual: Test on Android Chrome (Pixel, Samsung)
  - Manual: Verify landscape orientation works
  - Manual: Test with 1 lane vs 7 lanes (performance)
- **Rollout / rollback:**
  - Rollout: Add responsive layout behind feature flag initially
  - Rollback: Remove mobile layout, restore horizontal scrolling

---

### BOS-P2-04: Advanced multi-select filter chips

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/board/FilterChips.tsx` (add multi-select)
  - `apps/business-os/src/components/board/FilterChipsAdvanced.tsx` (new)
- **Depends on:** -
- **Status:** Pending
- **Confidence:** 82%
  - Implementation: 85% — Checkbox-based multi-select + AND/OR logic
  - Approach: 82% — Complexity tradeoff: power vs usability
  - Impact: 80% — Changes filtering UX; risk of confusion
- **Effort:** L (Large)
- **Priority:** P2 (Medium - nice-to-have for power users)
- **Description:**
  - Extend filter chips to support multi-select (e.g., select Pete AND Cristiana)
  - Add date range filter for due dates
  - Add saved filter presets (save commonly used filter combos)
  - AND/OR logic toggle for advanced users
- **Acceptance:**
  - Multi-select owner filter (select multiple owners)
  - Multi-select priority filter (e.g., P0 OR P1)
  - Date range picker for due dates
  - Save filter preset with name
  - Load saved preset from dropdown
- **Test plan:**
  - Unit test: Multi-select logic filters correctly (AND/OR)
  - Unit test: Date range filter works for various ranges
  - Unit test: Saved presets persist in localStorage
  - Manual: Verify UX clarity (not overwhelming)
- **Rollout / rollback:**
  - Rollout: Add advanced filters behind feature flag
  - Rollback: Remove advanced filters, keep basic single-select

---

### BOS-P2-05: Keyboard arrow navigation between cards

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/keyboard/KeyboardShortcutProvider.tsx` (add arrow handlers)
  - `apps/business-os/src/components/board/CompactCard.tsx` (add focus state)
- **Depends on:** -
- **Status:** Pending
- **Confidence:** 78%
  - Implementation: 80% — Focus management + arrow key handlers
  - Approach: 78% — Complex focus logic across lanes
  - Impact: 75% — Nice-to-have; risk of keyboard trap bugs
- **Effort:** L (Large)
- **Priority:** P3 (Low - power user feature)
- **Description:**
  - Arrow keys navigate between cards (up/down within lane, left/right across lanes)
  - Enter key opens focused card detail
  - Focus state visible (outline or highlight)
  - Escape returns to last focused element
- **Acceptance:**
  - Up/down arrows move focus within lane
  - Left/right arrows move focus between lanes
  - Enter opens card detail for focused card
  - Escape clears focus
  - Focus state visually clear
- **Test plan:**
  - Manual: Test all arrow key combinations
  - Manual: Verify no keyboard trap scenarios
  - Accessibility: Test with screen reader (VoiceOver/NVDA)
- **Rollout / rollback:**
  - Rollout: Add behind feature flag, gather feedback
  - Rollback: Remove arrow handlers, revert to click-only

---

### BOS-P2-06: Resolve hosted deployment runtime and git access

- **Type:** DECISION
- **Affects:** Deployment architecture, credentials management
- **Depends on:** -
- **Status:** Needs-Input (carry forward from BOS-00-A)
- **Confidence:** 40%
  - Implementation: 40% — Unproven mechanism for writable git checkout
  - Approach: 40% — Multiple options, no clear winner
  - Impact: 40% — Blocks hosted deployment for Phase 2
- **Effort:** N/A (Decision)
- **Priority:** P1 (High - blocks multi-user hosted deployment)
- **Description:**
  - Decide how hosted deployment gets writable git checkout
  - Options:
    - **Option A:** Self-hosted VM with git checkout (simple, but not serverless)
    - **Option B:** GitHub API commits (no local git, requires token management)
    - **Option C:** Serverless function triggers separate worker (complex)
    - **Option D:** Keep local-only permanently (Pete's machine = deployment)
- **Acceptance:**
  - Hosted deployment mechanism proven (writable checkout OR GitHub API)
  - Credentials management strategy defined
  - Concurrency model defined (if multi-instance)
  - BOS-10 updated with Phase 2 constraints
- **Impact on other tasks:**
  - Blocks BOS-P2-07 (hosted deployment setup)
  - May require BOS-10 refactor (git CLI vs GitHub API)

---

### BOS-P2-07: Set up hosted deployment (Vercel/CF Pages/VM)

- **Type:** IMPLEMENT
- **Affects:** Deployment infrastructure, CI/CD
- **Depends on:** BOS-P2-06
- **Status:** Blocked (waiting on BOS-P2-06 decision)
- **Confidence:** TBD (depends on BOS-P2-06 choice)
- **Effort:** L (Large)
- **Priority:** P1 (High - enables multi-user access)
- **Description:**
  - Deploy Business OS to chosen hosting platform
  - Configure git access per BOS-P2-06 decision
  - Set up CI/CD pipeline for deployments
  - Configure environment variables and secrets
  - Add health check and monitoring
- **Acceptance:**
  - App accessible via public URL (with auth)
  - Git write operations work correctly
  - CI/CD deploys on merge to main
  - Monitoring and error tracking configured
  - Performance meets Phase 1 baseline
- **Test plan:**
  - End-to-end: Submit idea → Sync → verify PR created
  - End-to-end: Edit card → Sync → verify changes committed
  - Load test: 10 concurrent users, 100 cards per board
- **Rollout / rollback:**
  - Rollout: Deploy to staging first, validate, then production
  - Rollback: Revert to local-only deployment

---

### BOS-P2-08: Add monitoring and error tracking

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/lib/monitoring/` (new)
  - Error boundaries in key components
- **Depends on:** BOS-P2-07
- **Status:** Pending
- **Confidence:** 88%
  - Implementation: 90% — Sentry integration straightforward
  - Approach: 88% — Standard monitoring patterns
  - Impact: 85% — Observability critical for production
- **Effort:** M (Medium)
- **Priority:** P1 (High - required for production readiness)
- **Description:**
  - Integrate error tracking (Sentry or similar)
  - Add performance monitoring (board render time, filter latency)
  - Create audit log for sensitive operations (plan edits, lane moves)
  - Add health check endpoint
- **Acceptance:**
  - Errors automatically reported to Sentry
  - Performance metrics tracked (render time, API latency)
  - Audit log captures plan/people edits with user identity
  - Health check endpoint returns 200 OK when healthy
- **Test plan:**
  - Manual: Trigger error, verify Sentry report
  - Manual: Check performance metrics dashboard
  - Manual: Verify audit log entries for plan edit
- **Rollout / rollback:**
  - Rollout: Add monitoring incrementally
  - Rollback: Disable monitoring, keep app functional

---

## Phase Prioritization

### Phase 2A: Multi-User Foundation (Target: Q1 2026)
**Priority: CRITICAL**
- BOS-P2-01: User switcher (dev/testing)
- BOS-P2-02: Owner-only card editing permissions
- BOS-P2-06: Hosted deployment decision
- BOS-P2-07: Hosted deployment setup
- BOS-P2-08: Monitoring and error tracking

**Success criteria:**
- Cristiana and Avery can use Business OS
- Permission checks work correctly per user
- App accessible via public URL
- No production outages >5 minutes

### Phase 2B: Mobile Optimization (Target: Q2 2026)
**Priority: HIGH**
- BOS-P2-03: Mobile vertical lane stacking
- Mobile-specific polish (touch targets, swipe gestures)

**Success criteria:**
- Mobile usage ≥30% of total sessions
- Mobile NPS score ≥8/10
- No horizontal scrolling on mobile

### Phase 2C: Advanced Features (Target: Q3 2026)
**Priority: MEDIUM**
- BOS-00-C: Registry sync automation
- BOS-P2-04: Advanced multi-select filters
- Server-side search (if >500 cards)

**Success criteria:**
- Registry always in sync
- Power users report increased productivity
- Search latency <100ms for 1000 cards

### Phase 2D: Power User Features (Target: Q4 2026)
**Priority: LOW**
- BOS-P2-05: Keyboard arrow navigation
- Bulk actions (assign, tag, priority)
- Saved filter presets

**Success criteria:**
- Keyboard power features used by ≥10% of users
- Positive feedback from power users

## Success Metrics

### Phase 2 Overall:
- **Multi-user adoption:** ≥3 active users (Pete, Cristiana, Avery)
- **Mobile usage:** ≥30% of sessions on mobile
- **Uptime:** ≥99.5% (≤3.6 hours downtime/month)
- **Performance:** Board render <500ms for 100 cards
- **Error rate:** <0.1% of requests

### User Satisfaction:
- NPS score ≥8/10
- Weekly active users ≥3
- Ideas captured per week ≥10

### Technical Health:
- Test coverage ≥80%
- Zero P0/P1 security vulnerabilities
- Mean time to recovery (MTTR) <1 hour

## Dependencies & Risks

### External Dependencies:
- Hosting platform (Vercel/CF Pages/VM) availability
- GitHub API rate limits (if using API for commits)
- Third-party libraries (react-hot-toast, headlessui, etc.)

### Key Risks:

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| BOS-P2-06 decision delayed | High | Medium | Start with Option D (local-only) until hosted decided |
| Mobile layout breaks desktop UX | High | Low | Extensive cross-device testing, feature flag |
| Git concurrency issues in hosted mode | High | Medium | Implement locking mechanism, queue writes |
| Permission checks bypassed | Critical | Low | Server-side enforcement, security audit |
| Performance degradation on mobile | Medium | Medium | Performance budget, lazy loading |

## Notes

**Phase 1 Complete:** All original Business OS Kanban plan tasks (BOS-01 through BOS-32) and Board UX Overhaul tasks (BOS-UX-01 through BOS-UX-17) are complete as of 2026-01-29.

**Archive Implemented:** Archive view with permission-based filtering (admins see all, regular users see own) implemented outside of original plans.

**Multi-user Model Established:** User types (admin vs regular) and permission patterns defined in `src/lib/current-user.ts`.

**Mobile-First Design:** Phase 2B prioritizes mobile experience, recognizing that mobile usage will be significant for capture and read workflows.

**Incremental Rollout:** All major features should launch behind feature flags for safe incremental rollout and rollback capability.
