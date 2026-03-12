## Critique History

### Round 1 — fact-find mode
- **Verdict:** credible
- **Score:** 4.3 / 5.0
- **Critical issues (blocking):** None
- **Major issues (advisory):** None
- **Minor issues (advisory):**
  - Test coverage notes for `ProcessImprovementsInbox.test.tsx` do not mention bulk actions, custom defer periods, or advanced filtering — all added in commit `0d70286d86`. The coverage description is slightly stale; build agent should verify the test file before assuming portability scope.
  - Minor inconsistency between sections: "Deferred and Recently Actioned sections stay with New Ideas" appears in both **Resolved** (with a stated answer) and **Remaining Assumptions** (flagged as "not yet confirmed by operator"). This creates ambiguity about whether the question is actually settled. Recommend removing it from Remaining Assumptions or marking it as "assumed resolved pending operator sign-off".
  - Line numbers cited as evidence refs (`:910`, `:796`, `:627`, `:1166` in `ProcessImprovementsInbox.tsx`) are stated without verification. Given the recent bulk-action commit touched this file, these refs should be spot-checked before build to ensure they still point to the described sections.
- **Resolved this round:** n/a (Round 1)

### Round 2 — analysis mode
- **Verdict:** credible
- **Score:** 4.2 / 5.0
- **Critical issues (blocking):** None
- **Major issues (advisory):** None
- **Minor issues (advisory):**
  - Component name list (`InProgressSection`, `ActivePlanCard`, `InboxSection`, `WorkItemCard`, `BulkActionBar`, `RecentlyActionedSection`, `ProcessImprovementsSummary`) is carried as fact but is not re-verified against the post-bulk-action monolith. The bulk-action commit (`0d70286d86`) touched `ProcessImprovementsInbox.tsx`; build agent should spot-check these names before assuming the list is exhaustive and that no cross-section sub-component usage was introduced.
  - Hero stat tile cross-link description in the End-State Operating Model is slightly ambiguous — "present on each sub-page's hero, pointing to the sibling page" does not specify which stat tiles (e.g. the In Progress count tile or the New Ideas count tile) appear on each page. Planning task TASK-03 should resolve this explicitly before implementing.
  - The `layout.tsx` sub-nav pattern is stated as the chosen approach but the analysis does not confirm that no existing `layout.tsx` is present inside `apps/business-os/src/app/process-improvements/`. If one exists (even as a passthrough), adding a new one would conflict. Build agent should check before creating the file.
- **Resolved this round:** n/a (first analysis round)

### Round 3 — plan mode
- **Verdict:** credible
- **Score:** 3.8 / 5.0
- **Critical issues (blocking):** None
- **Major issues (advisory):**
  - Nav `isActive` acceptance criterion is internally inconsistent. TASK-03 Acceptance states "isActive continues to highlight for both sub-routes via startsWith" after updating the nav href to `/process-improvements/new-ideas`. This is false: `pathname?.startsWith("/process-improvements/new-ideas")` does not match `/process-improvements/in-progress`, so the nav entry goes dark on the In Progress page. The Notes section (line 371–372) correctly identifies this edge case but the fix it describes ("startsWith on /process-improvements prefix") contradicts the Acceptance criterion. The correct resolution is for `NavigationHeader.tsx` to keep the nav link href as `/process-improvements/new-ideas` for click destination but pass a separate `activePrefix="/process-improvements"` to the `isActive` check, OR keep `href="/process-improvements"` (which already highlights for both sub-routes via startsWith) and add a separate `<Link href="/process-improvements/new-ideas">` only as the click destination. The current acceptance criterion as written will produce a nav bug.
  - `export const dynamic = "force-dynamic"` is not mentioned in the deliverables or execution plans for either `in-progress/page.tsx` or `new-ideas/page.tsx`. The existing root `page.tsx` has this directive (required for pages using `getCloudflareContext` / D1 access patterns in BOS; also needed because `loadProcessImprovementsProjection()` reads files at runtime). Both new server components call runtime I/O functions and must carry this export or risk static prerender attempts during build. Build agent should add it to both new `page.tsx` files.
- **Minor issues (advisory):**
  - `loadActivePlans()` is a synchronous function (signature: `export function loadActivePlans(...)`). The plan's Delivered Processes section and several task notes describe it as an async/awaitable call (e.g. "calls `loadActivePlans()` + `collectInProgressDispatchIds()`" in contexts implying concurrent resolution). The current `page.tsx` already calls it without `await` (line 11: `const activePlans = loadActivePlans()`). Build agent should follow the synchronous pattern; no runtime impact, but the language in the plan may mislead.
- **Resolved this round:** n/a (first plan round)

### Round 4 — plan mode (revision)
- **Verdict:** credible
- **Score:** 4.3 / 5.0
- **Prior issues resolved:**
  - Nav `isActive` logic: nav link href is now explicitly kept at `/process-improvements` (not changed to `/new-ideas`); `startsWith("/process-improvements")` highlights correctly for both sub-routes. Acceptance criterion, execution plan, and Goals section all consistent.
  - `export const dynamic = "force-dynamic"`: explicitly added to both `in-progress/page.tsx` and `new-ideas/page.tsx` in their execution plans and called out in TASK-01 planning validation.
  - `loadActivePlans()` synchronous: both TASK-01 and TASK-02 execution plans now explicitly annotate the call as synchronous with no `await` required.
- **Critical issues (blocking):** None
- **Major issues (advisory):** None
- **Minor issues (advisory):**
  - Monolith deletion sequencing ambiguity: TASK-02 deletes `ProcessImprovementsInbox.tsx` but root `page.tsx` still imports it until TASK-03 runs. The Risks table entry covers this ("TASK-03 converts root `page.tsx` to redirect in the same task as deletion completion confirmation"), but the TASK-02 execution plan does not explicitly say to leave the root `page.tsx` import removal to TASK-03. There is a transient broken-build window if the monolith deletion and the root `page.tsx` redirect conversion land in separate commits. Build agent should handle both in one atomic commit or ensure TASK-03's page.tsx conversion runs before the monolith file is deleted.
