# Critique History: brikette-rsc-structured-data-conversion

## Round 1 — 2026-02-26

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Dependency & Impact Map | Ambiguous "in addition to (or replacing)" phrasing implied RSC structured data replaces page content — both are rendered; fixed to "before `<RoomsPageContent>` — both are rendered" |
| 1-02 | Moderate | Remaining Assumptions / Evidence Gap Review | `buildCanonicalUrl` listed as unverified assumption — critique verified server-safe (pure `new URL()`, no browser globals); assumption closed |
| 1-03 | Moderate | Suggested Task Seeds TASK-03/04 | No atomic commit sequencing constraint — duplicate JSON-LD risk if TASK-03 lands without TASK-04; sequencing note added |
| 1-04 | Moderate | Key Modules (ExperiencesStructuredData entry) | Missing precision: `!ready` guard at line 88 is the specific SSR absence mechanism, not just "inside client boundary"; note added |
| 1-05 | Moderate | Testability Assessment | Async RSC `Promise<JSX.Element>` test handling not discussed — `renderWithProviders` may not await async RSC; warning added |
| 1-06 | Moderate | Risks table | Duplicate JSON-LD risk (TASK-03 landing without TASK-04) not present in risk table; row added |
| 1-07 | Minor | Confidence Inputs | Tautological "Already above 80%/90%" entries replaced with meaningful residual uncertainty statements |
| 1-08 | Minor | Constraints & Assumptions | `buildCanonicalUrl` assumption not updated to reflect verified status — cross-section orphaned text fixed |

### Issues Confirmed Resolved This Round

None (Round 1 — no prior history).

### Issues Carried Open (not yet resolved)

None. All issues addressed in autofix phase.

---

## Round 2 — 2026-02-26 (plan.md critique)

Target: `docs/plans/brikette-rsc-structured-data-conversion/plan.md`
Score: 4.5/5.0 — **credible**
Severity distribution: 0 Critical, 0 Major, 2 Moderate, 2 Minor

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | Parallelism Guide / Wave 3 | TASK-05 and TASK-07 listed as parallel in Wave 3, but TASK-07 depends on TASK-05 — split into Wave 3 (TASK-05) and Wave 4 (TASK-07) |
| 2-02 | Moderate | TASK-07 Acceptance + Validation contract | `/de/esperienze` described as German slug — `esperienze` is Italian; correct German slug is `erlebnisse` (verified in `slug-map.ts`). Also `/de/rooms` corrected to `/de/zimmer`. |
| 2-03 | Minor | Constraints & Assumptions + Risks table | `loadRoomsCatalog` parallel static export stated as "Validated by a full pnpm build run" — build run is a future TASK-07 confirmation, not pre-existing evidence; phrasing corrected |
| 2-04 | Minor | TASK-02 Edge Cases | `getSlug` unsupported locale concern raised — resolved by confirming `lang` parameter is typed as `AppLanguage` at compile time; TypeScript prevents invalid locale calls; note added |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| (all Round 1 issues) | Moderate/Minor | See Round 1 | All resolved in Round 1 autofix phase; none reappeared |

### Issues Carried Open (not yet resolved)

None. All issues addressed in autofix phase.
