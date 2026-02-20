# Critique History: brikette-webpack-removal

## Round 1 — 2026-02-20

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Scope Summary + Dependency & Impact Map | "Guides go blank under Turbopack" is wrong — guides.backend.ts provides two-layer fallback to guides.imports.ts; corrected to performance/dead-code problem |
| 1-02 | Major | Key Modules / Files + Impact Map | locale-loader.ts has a real dynamic import() fallback omitted from the brief; migration is dead-code removal not functional restoration |
| 1-03 | Moderate | Constraints & Assumptions | 13 apps share packages/next-config; fact-find named only "cms, reception, etc."; blast radius understated for drizzle-orm alias change |
| 1-04 | Moderate | Constraints & Assumptions | turbopack: config block already in next.config.mjs (Next.js 15 stable opt-in); "do not enable Turbopack" gate may be meaningless if it's already active |
| 1-05 | Moderate | Confidence Inputs — Approach 72% | Approach confidence depressed by Open Q1 that is already largely answered by existing architecture (locale-loader.ts fallback, guides.backend.ts chain) |
| 1-06 | Moderate | Suggested Task Seeds | Tasks 4-8 depend on Task 3 completing (spike); dependency not enforced; parallel execution risk |
| 1-07 | Minor | Remaining Assumptions | drizzle-orm "assumed not imported" listed as assumption; confirmed by grep; should be marked confirmed |
| 1-08 | Minor | Resolved Questions | "NormalModuleReplacementPlugin droppable — Turbopack handles node:*" stated as resolved fact, no Turbopack doc cited |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

None (first round).

### Autofix Summary

- 7 point fixes applied
- 1 section rewrite (Constraints & Assumptions)
- AF-3 consistency scan: 2 cleanup edits (guides.imports.ts Key Modules description, drizzle-orm Goal line)
- Overall score: 3.5 (partially credible)
- Recommended action: revise and re-critique if score matters; planning can proceed with corrected narrative

---

## Round 2 — 2026-02-20

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | Risks table row 1, Impact column | "Critical" contradicts Dependency & Impact Map "Medium" for guides empty-map scenario; Round 1 corrected the Impact Map but not the Risks table |
| 2-02 | Minor | Suggested Task Seeds, Task 2 | "update `packages/next-config`" implies modifying shared webpack callback; contradicts Goals and Execution Routing Packet which say the drizzle-orm: false entry is left unchanged |
| 2-03 | Minor | Suggested Task Seeds, Task 5 | "remove webpackGlob usage" for locale-loader.guides.ts is wrong — factcheck confirmed it does NOT import webpackGlob; "blocked on Task 3" dependency annotation also wrong — only a comment needs removing, no API replacement |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | "Guides go blank under Turbopack" wrong | Corrected by Round 1 autofix (scope summary, impact map) |
| 1-02 | Major | locale-loader.ts fallback omitted | Corrected by Round 1 autofix (Key Modules, Impact Map) |
| 1-03 | Moderate | 13-app blast radius understated | Corrected by Round 1 autofix (Constraints section rewrite) |
| 1-04 | Moderate | Turbopack config block already present | Corrected by Round 1 autofix (Constraints, Risks table) |
| 1-05 | Moderate | Approach confidence depressed by already-answered Q1 | Corrected by Round 1 autofix (Confidence Inputs) |
| 1-06 | Moderate | Task 4-8 dependency on Task 3 not enforced | Corrected by Round 1 autofix (Task Seeds) |
| 1-07 | Minor | drizzle-orm assumption not marked confirmed | Corrected by factcheck (Remaining Assumptions) |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-08 | Minor | 2 | Evidence Gap Review states "NormalModuleReplacementPlugin confirmed droppable (Turbopack handles node:* natively)" with no Turbopack documentation cited |

### Autofix Summary

- 3 point fixes applied (2-01, 2-02, 2-03)
- 0 section rewrites
- AF-3 consistency scan: 0 cleanup edits needed (fixes aligned with existing Goals, Execution Routing Packet, Key Modules)
- Overall score: 4.0 (credible) — up from 3.5; delta justified by resolution of 2 Major + 4 Moderate + 1 Minor Round 1 issues
- Recommended action: proceed to `/lp-do-plan`
