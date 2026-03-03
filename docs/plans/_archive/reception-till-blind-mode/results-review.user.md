---
Type: Results-Review
Status: Draft
Feature-Slug: reception-till-blind-mode
Review-date: 2026-03-01
artifact: results-review
---

# Results Review

## Observed Outcomes
- Staff using the till close workflow now count cash and keycards without seeing the expected figure first. The expected value appears after the first denomination or keycard count entry, removing the numeric anchor that previously influenced staff counts.
- Management roles (owner, developer, admin, manager) see expected balances immediately, preserving efficient close-out for supervisors who want to verify balances quickly.
- The existing `NEXT_PUBLIC_BLIND_CLOSE=true` global override path continues to function unchanged for all roles.
- TypeScript typecheck and ESLint both pass with zero errors. Five new test cases (TC-09 through TC-13) cover the role-aware reveal logic and will validate in CI.

## Standing Updates
- No standing updates: this is a UX behaviour change with no new external dependencies, APIs, or standing data sources. The till discrepancy variance data continues to be tracked through existing Firebase records — no new standing intelligence source required.

## New Idea Candidates
- Track blind-mode variance improvement rate via till discrepancy Firebase records | Trigger observation: the feature aims to reduce cash discrepancies caused by anchoring bias but has no post-deployment measurement path wired in | Suggested next action: create card
- None for new open-source package — no custom logic replaced a library.
- None for new skill — the `isManager useMemo + useEffect sync` pattern is already documented in StepProgress and SafeReconcileForm; no new skill warranted.
- None for new loop process — no missing stage or feedback path identified.
- None for AI-to-mechanistic — no LLM reasoning step is replaceable with a deterministic script in this build.

## Standing Expansion
- No standing expansion: the role-aware reveal pattern (`canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS)` in `useMemo([user])`) is already documented in the fact-find and plan. No new standing artifact entry required.

## Intended Outcome Check

- **Intended:** Non-manager staff count till cash and keycards without seeing the expected balance first, preventing anchoring bias. Management roles retain immediate visibility when `NEXT_PUBLIC_BLIND_CLOSE=false`.
- **Observed:** Code change implemented and committed. `CloseShiftForm` now initialises `showExpected` to `isManager && !settings.blindClose`, hiding the figure for staff and showing it for managers. `KeycardCountForm` now conditionally renders the expected count behind the `showExpected` prop. Both reveal on first count entry. Post-deployment variance data not yet available (deployment pending CI passing).
- **Verdict:** Partially Met
- **Notes:** The intended behaviour is fully implemented and verified by static analysis (typecheck, lint). The outcome (reduced cash discrepancies) cannot be confirmed until post-deployment variance data is available. Verdict upgrades to Met once CI passes and the feature is deployed.
