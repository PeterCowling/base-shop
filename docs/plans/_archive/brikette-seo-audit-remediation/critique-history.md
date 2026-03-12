# Critique History

## Round 1
- **Mode**: fact-find
- **Verdict**: credible
- **Score**: 4.0 / 5.0

### Dimension Scores
| Dimension | Score | Notes |
|---|---|---|
| Evidence | 4/5 | Strong file-path and line-number evidence throughout. All four entry-point files verified as existing and matching described behavior. The 24-route count confirmed against `routes.json`. `_redirects` confirmed missing `/assistance` and `/en/directions/:slug`. One weakness: the `shouldExcludeFromSitemap` line range is stated as 67-81 which is accurate, but the fact-find never explicitly states *why* `/directions/*` paths pass through that filter (i.e., no exclusion rule matches them). The reader must infer this. |
| Completeness | 4/5 | All 4 findings have identified root causes with code paths. Finding #2 (i18n leakage) is the weakest: the root cause is described as "likely namespace preload ordering issue" but the actual mechanism is not proven. The fact-find correctly flags this uncertainty in the Rehearsal Trace and Confidence Inputs, which is honest rather than a gap. One minor omission: the fact-find claims `lastmod` coverage is 23% but provides no evidence for this number (no sitemap analysis, no script output). |
| Feasibility | 4/5 | Fixes are well-scoped and realistic. Removing `listDirectionPaths()` from `listCanonicalSitemapPaths()` is a one-line change. Adding redirect rules to `_redirects` is trivial. The lastmod backfill via git dates is more complex and the fact-find appropriately notes the bulk-today guard constraint. The i18n fix is feasible but the exact code change is not specified because the root cause is not fully confirmed. |
| Risk-handling | 4/5 | Risk table covers the main scenarios. The `listDirectionPaths()` consumer search confirming no other callers is valuable. The i18n side-effect risk is real and mitigated by the SSR audit test. One gap: no risk entry for the lastmod git-date approach potentially being unavailable in CI (shallow clones truncate git history). The fact-find's "Remaining Assumptions" section notes "git history available in CI" but this is stated as an assumption without mitigation. |
| Forward rehearsal | 4/5 | Task seeds are logical and independently deployable. Seed #1 (sitemap + redirect + test) is clean. Seed #2 (i18n fix) has a precondition issue: the exact fix is unknown because the root cause is not confirmed -- the plan phase will need to investigate further before coding. Seed #3 (assistance redirect) is trivial and well-defined. Seed #4 (lastmod backfill) is the riskiest -- "investigate git-date extraction approach" is really a sub-fact-find, not a build task. The scope signal says "right-sized" which is fair for seeds 1-3 but seed #4 may need its own spike. |

### Top Issues
1. **[Minor] Unproven root cause for Finding #2 (i18n leakage):** The fact-find identifies `PlanChoice.tsx` and `TransportNotice.tsx` as leaking raw i18n keys and points to `getTranslations(lang, ["guides"])` as the preload mechanism, but does not demonstrate that the `guides` namespace load actually fails to include `guides/components` and `guides/transportNotice` sub-namespaces on the server side. The `guides.imports.ts` file (a *client-side* runtime loader) assembles these sub-namespaces, but the server-side `getTranslations` path may use a different loading mechanism. The fact-find honestly flags this as "likely" rather than "confirmed" -- this is adequate for planning but the plan must include a verification step.

2. **[Minor] Lastmod 23% coverage claim is unsourced:** The fact-find states "improve lastmod sitemap coverage from 23% toward >=60%" in the Goals section but never shows how this number was derived. No sitemap analysis output, no script run, no line count. This is a soft claim that should either be evidenced or stated as approximate.

3. **[Minor] Lastmod git-date CI feasibility assumption:** The fact-find assumes "git history available in CI" for the git-date extraction approach but does not check whether the CI checkout uses shallow clones (common with `actions/checkout` default `fetch-depth: 1`). If shallow, `git log` returns only the latest commit date for all files. This needs to be verified or mitigated (e.g., `fetch-depth: 0`).

4. **[Info] Missing explicit statement of why `/directions/*` passes `shouldExcludeFromSitemap`:** The evidence section lists the filter function at lines 67-81 but does not state that it lacks a `/directions/` pattern. Adding one sentence would strengthen the root cause chain for Finding #1.

### Fix List
- Add evidence for the 23% lastmod coverage claim (e.g., sitemap URL count vs. lastmod count, or mark as "estimated").
- Add a risk row for shallow git clone in CI potentially breaking the git-date lastmod approach.
- In the Evidence Audit, add one sentence under `shouldExcludeFromSitemap` noting that no exclusion rule matches `/directions/*` paths, completing the root cause chain for Finding #1.
- Ensure the plan for Finding #2 includes a verification step (e.g., SSR render test) before committing to the preload-ordering fix.

## Round 2 (Analysis)
- **Mode**: analysis
- **Verdict**: credible
- **Score**: 3.8 / 5.0

### Dimension Scores
| Dimension | Score | Notes |
|---|---|---|
| Evidence | 3/5 | Option comparisons for findings #1, #2, #3 are backed by sound technical reasoning -- removing the source beats filtering, client-only rendering defeats SEO purpose, one-line redirect has no trade-offs. Finding #4 option analysis is the weakest: Option A (git dates) is chosen but the analysis never quantifies how many of the ~128 guides per locale actually have meaningful git history vs. being bulk-committed in a single import. If most content files were committed in one batch, git dates are no better than build timestamps. The 23% lastmod claim (flagged in Round 1 as unsourced) is repeated verbatim without evidence -- the analysis inherited it without verification. The "Inherited Outcome Contract" section is useful but adds no new evidence beyond the fact-find. |
| Completeness | 4/5 | All 4 findings are addressed with option tables, elimination rationale, and chosen approaches. The engineering coverage comparison table is thorough and correctly identifies applicable areas. The "Additional action" for Finding #1 (adding `/en/directions/:slug` redirect) is a good catch that goes beyond the bare minimum. One gap: the analysis does not discuss what happens if the i18n fix turns out to require RSC boundary restructuring -- it identifies this as a risk but offers no fallback approach or scope containment strategy. |
| Feasibility | 4/5 | Findings #1, #3 are trivially feasible (one-line changes). Finding #2 is honestly flagged as requiring diagnosis during implementation, which is realistic. Finding #4 has a credible implementation path (git-date extraction script) but the analysis underestimates complexity: 18 locales times ~128 guides means touching potentially 2,300+ JSON files. The committed lookup file alternative (line 121) is mentioned but not evaluated as a formal option -- it is buried in an implementation note rather than appearing in the options table. This is a missed option that could be materially better than runtime git extraction. |
| Risk-handling | 4/5 | The risk table is lean but appropriate -- two risks, both with planning implications stated. The CI shallow clone risk (flagged in Round 1) is now properly captured. The analysis correctly identifies that finding #2 has residual diagnostic uncertainty and carries it forward. One weakness: no risk entry for the bulk JSON file update (finding #4) potentially causing merge conflicts or review burden -- 2,300+ file changes in a single PR is operationally non-trivial even if technically correct. |
| Forward rehearsal | 4/5 | Task decomposition is clear and logically sequenced. The separation of tasks 1+2+3 (ship together) vs. task 4 (ship separately) is well-reasoned. Validation implications are specific and testable for each task. Sequencing constraints are correctly stated. One weakness: Task 2 (i18n fix) says "diagnose preload timing + fix + verify" but does not define a time-box or fallback if diagnosis takes longer than expected. For a task with an unconfirmed root cause, this is an omission -- the plan needs to know when to escalate or pivot. |

### Top Issues
1. **[Major] Lastmod 23% coverage claim still unsourced (inherited from fact-find, Round 1 issue #2).** The analysis repeats "from 23% toward >=60%" in the Goals section without adding evidence. This number drives the entire justification for Finding #4 and the >=60% target. If the actual coverage is, say, 45%, the effort/reward calculus changes significantly. An analysis artifact should not inherit unverified claims from the fact-find without either verifying them or marking them as estimated.

2. **[Minor] Committed lookup file not evaluated as a formal option for Finding #4.** The analysis mentions "store git dates in a committed lookup file" at line 121 as an aside, but this approach has materially different trade-offs from runtime git extraction (no CI depth dependency, reviewable diffs, works with shallow clones). It deserves its own row in the options table rather than being buried in an implementation note.

3. **[Minor] No fallback strategy for Finding #2 if RSC restructuring is needed.** The risk table says "i18n preload fix requires component tree restructure" is low likelihood, but if it materializes the impact is medium and there is no stated fallback. The analysis should state what the plan should do if simple preload reordering fails -- e.g., scope reduction (skip PlanChoice/TransportNotice SSR as a temporary measure while investigating deeper), or escalation criteria.

4. **[Minor] Bulk JSON update operational risk missing for Finding #4.** Touching 2,300+ content JSON files in a single task has practical implications: large PR diffs, potential merge conflicts with concurrent content work, and review burden. This is not a technical risk but an operational one that affects planning.

### Fix List
- Add evidence for the 23% lastmod figure or explicitly mark it as "estimated from SEO audit report" with a note that the plan should verify before committing to the >=60% target.
- Promote the committed lookup file approach to a formal Option B in the Finding #4 options table, with trade-off comparison against runtime git extraction.
- Add a fallback/escalation note for Finding #2: if preload reordering does not resolve the issue within the diagnostic step, what is the containment strategy?
- Add an operational risk row for the bulk JSON update scope of Finding #4 (PR size, merge conflict potential).

## Round 3 (Plan)
- **Mode**: plan
- **Verdict**: credible
- **Score**: 3.6 / 5.0

### Dimension Scores
| Dimension | Score | Notes |
|---|---|---|
| Evidence | 4/5 | Code references are specific and verified: `listDirectionPaths()` at line 245, `listCanonicalSitemapPaths()` at line 248, `resolveGuideLastmod` at line 98, `assertNoBulkTodayLastmod` at line 166 -- all confirmed accurate. `PlanChoice.tsx` and `TransportNotice.tsx` exist at claimed locations. TC-12, TC-13, TC-14 test IDs confirmed in `generate-public-seo.lastmod.test.ts`. One factual error: TASK-03 edge case says "Verify existing `/en/assistance` -> `/en/help` redirect is unaffected" but no such redirect exists -- `/en/assistance` is a live App Router page (has `page.shared.tsx`, `layout.tsx`, `AssistanceIndexContent.tsx`), not a redirect. The 23% lastmod figure (flagged in Rounds 1 and 2 as unsourced) propagates into the plan Summary unchanged. |
| Completeness | 3/5 | Two significant completeness gaps. (1) TASK-02 acceptance criteria reference `guide-content-ssr-audit.test.tsx` as an existing test to pass, but this file does not exist anywhere in the codebase. The plan treats it as pre-existing verification infrastructure when it would need to be created. The execution plan does not include a step to create this test. (2) TASK-02 has no explicit fallback or escalation criteria despite Round 2 critique flagging this gap (issue #3). The plan's "What would make this >=90%" says "Confirmed exact preload gap via local SSR trace" but does not define what happens if the trace reveals RSC boundary issues rather than a simple preload fix. (3) TASK-03 redirect target `/en/help` may be incorrect -- `/en/assistance` is the actual help centre page in the App Router. The plan does not verify that `/en/help` resolves to anything. |
| Feasibility | 4/5 | Tasks 1 and 3 are trivially feasible (one-line changes in well-understood files). Task 4 is feasible with the noted mitigation that the script runs locally (not in CI), sidestepping the shallow clone issue. Task 2 at 85% confidence is fair given the unconfirmed root cause, and the execution plan correctly includes a diagnosis step first. The plan's Scouts section says "None: root cause narrowed to preload ordering" for TASK-02, but the root cause is not actually narrowed -- it is hypothesised. A scout step for SSR trace would be more honest than "None". |
| Risk-handling | 3/5 | The risk table is too lean for a 4-task plan. Three entries cover the main scenarios but miss several identified in prior rounds. (1) Round 2 flagged bulk JSON update operational risk (2,300+ files, PR size, merge conflicts) -- not addressed in the plan's risk table. (2) No risk entry for TASK-03 redirect target being wrong (if `/en/help` is not a valid route, the redirect sends users to a 404). (3) TASK-02 has no escalation path or time-box. The risk table says "i18n fix more complex than preload reordering" is Low/Medium but the only mitigation is "escalate to replan" -- no intermediate containment (e.g., suppress SSR for those two components temporarily). (4) No risk entry for the non-existent SSR audit test that TASK-02 depends on for verification. |
| Forward rehearsal | 4/5 | Walking through task execution: TASK-01 is clean -- remove one spread from the array, add one redirect line, add one test assertion. No dependency issues. TASK-03 is clean -- one line addition. TASK-04 is clean -- script writes historical dates, bulk-today guard won't fire, existing tests cover the pipeline. TASK-02 has a precondition gap: step 3 says "Verify via SSR audit test" but that test does not exist and no step creates it. The execution plan implicitly requires creating a new test but lists it as verification, not implementation. Additionally, TASK-02's "Affects" list includes `guide-i18n-bundle.ts` as a file to modify, but the actual fix might need changes in the page-level server component (`how-to-get-here/[slug]/page.tsx`) where `loadGuideI18nBundle` is called -- the plan does list this file but the execution steps are vague about where the actual change lands. |

### Top Issues
1. **[Major] TASK-02 references non-existent test file `guide-content-ssr-audit.test.tsx`.** The acceptance criteria state "SSR audit test (`guide-content-ssr-audit.test.tsx`) passes with how-to-get-here page coverage" but this file does not exist in the codebase. The validation contract (TC-01, TC-02, TC-03) and execution plan step 3 depend on this test for verification. Either the test must be created as part of the task (requiring additional scope in the execution plan) or the acceptance criteria must reference a different, existing verification mechanism.

2. **[Major] TASK-03 redirect target `/en/help` is unverified and likely incorrect.** The App Router has a full `/en/assistance` page with layout, content component, and article sub-routes. There is no evidence that `/en/help` is a valid route. If it is not, the redirect sends users from a 404 (`/assistance`) to another 404 (`/en/help`). The edge case note compounds this by claiming "/en/assistance -> /en/help" is an existing redirect to preserve -- no such redirect exists; `/en/assistance` is a live page.

3. **[Minor] 23% lastmod figure still unsourced after three rounds of critique.** Rounds 1 and 2 both flagged this. The plan inherits it into the Summary ("improve lastmod coverage from 23% to >=60%") and TASK-04 acceptance criteria (">=60% of sitemap URLs have `<lastmod>` (up from 23%)") without evidence. This number drives the >=60% target threshold. At minimum, the plan should mark it as "estimated" or verify it before build.

4. **[Minor] Round 2 critique issues not fully addressed.** The analysis critique raised 4 issues. In the plan: (a) the 23% claim remains unverified (issue #1 -- still open); (b) committed lookup file vs. runtime git extraction was not carried into the plan as an option consideration (issue #2 -- the plan just uses git extraction without acknowledging the alternative); (c) no fallback/escalation for TASK-02 (issue #3 -- still open); (d) bulk JSON operational risk not in plan risk table (issue #4 -- still open).

5. **[Minor] TASK-02 Scouts field says "None" despite unconfirmed root cause.** The task has 80% implementation confidence because the exact preload mechanism is unconfirmed. This is precisely the scenario where a scout (SSR trace) would be valuable. Marking "None" while simultaneously saying "exact RSC timing needs diagnosis during build" is contradictory.

### Fix List
- TASK-02: Either create `guide-content-ssr-audit.test.tsx` as an explicit execution step, or replace the acceptance criteria reference with a concrete alternative (e.g., `curl`-based SSR content check in the existing lastmod test file, or a new test in the existing test file).
- TASK-03: Verify that `/en/help` is a valid route. If not, change redirect target to `/en/assistance`. Remove the false claim about an existing `/en/assistance` -> `/en/help` redirect from edge cases.
- Mark the 23% lastmod figure as "estimated from SEO audit report (unverified)" or run the sitemap generator and count lastmod entries to produce an actual number.
- Add risk rows for: (a) TASK-03 redirect target validity, (b) bulk JSON update PR size/merge conflict (TASK-04), (c) non-existent SSR audit test (TASK-02).
- TASK-02: Add a scout step or explicit diagnosis phase in execution plan. Add escalation criteria: if preload reordering does not resolve within N hours, fall back to suppressing SSR for PlanChoice/TransportNotice temporarily.
- TASK-02: Change Scouts from "None" to a brief SSR trace investigation step, consistent with the 80% implementation confidence.
