---
Type: Critique-History
Status: Reference
---

# Critique History: brik-code-simplification

## Round 1 — 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Impact estimate | Headline "~20,800 lines / ~120 files" was an unverified aggregation; verified arithmetic yields ~18,000+ / ~90+ |
| 1-02 | Moderate | Assumptions | chiesaNuovaDepartures re-export pattern claimed as comprehensive proof but only covers 3 of ~10 files; i18n.ts and guideFaqFallback.ts are full copies, not re-exports |
| 1-03 | Minor | RoomImage.tsx (task seed 2) | Listed as dead code, which is correct (zero imports), but it is a 147-line full component, not a re-export — deletion saves more than listed ~30 lines for task 1 |
| 1-04 | Minor | Lighthouse CI consolidation | Listed in Goals but no task seed exists for it; also not in scope for most task seeds |

### Issues Confirmed Resolved This Round
(none — first round)

### Issues Carried Open (not yet resolved)
(none — all opened issues addressed via autofix in this round)

## Round 2 — 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Dependency & Impact Map; Task seed 4 | `swiper` was incorrectly classified as unused despite active runtime imports (`HomeContent.tsx`, `prefetchInteractive.ts`) |
| 2-02 | Major | Constraints/Test/Validation commands | Validation contract used non-targeted commands (`pnpm typecheck`, `pnpm lint`) and an unscoped test contract inconsistent with repo policy |
| 2-03 | Major | Questions + Planning Readiness | Document was marked `Ready-for-planning` while a load-bearing consolidation decision lacked a safe default path |
| 2-04 | Moderate | Test Landscape | Claimed dedicated `translation-fallback.test.ts` coverage that does not exist; coverage was indirect via mocks/components |
| 2-05 (regression of 1-04) | Minor | Scope goals/task seeds | Lighthouse CI duplication resurfaced in goals without evidence-backed task scope |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | Impact estimate arithmetic drift | Confidence + evidence sections now keep impact as estimate and tie it to verified terms only |
| 1-02 | Moderate | Overstated re-export proof | Assumptions/questions/task seeds now explicitly split route-agnostic re-exports from `GUIDE_KEY`-dependent duplication |
| 1-03 | Minor | RoomImage/task sizing mismatch | Task seeds now keep `RoomImage.tsx` in dead-utils scope and avoid re-export framing |
| 1-04 | Minor | Lighthouse scope drift | Lighthouse objective/task removed from the fact-find scope |

### Issues Carried Open (not yet resolved)
(none — all opened issues addressed via autofix in this round)

## Round 3 — 2026-02-23 (Plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-03 Affects / Acceptance | `test/jest-baselines/README.md` was `[readonly]` but should be in deletion scope; removing all JSON files orphans the README and empty directory |
| 3-02 | Moderate | Overall-confidence Calculation | Arithmetic showed 1450/17 but correct values are 1375/16; final 86% was coincidentally correct |
| 3-03 | Minor | Risks & Mitigations | Two fact-find risks (dynamic import, @tiptap peer deps) covered in task-level details but absent from top-level Risks table |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | `swiper` incorrectly classified as unused | Plan keeps `swiper` and `@anthropic-ai/sdk` explicitly; TASK-02 acceptance excludes them |
| 2-02 | Major | Non-targeted validation commands | All TCs now use `pnpm --filter @apps/brikette` consistently |
| 2-03 | Major | Ready-for-planning with unresolved decision | TASK-06 added as explicit decision gate before high-risk consolidation |
| 2-04 | Moderate | False test coverage claim | TASK-08 correctly notes coverage is indirect; no false dedicated-test claims |
| 2-05 | Minor | Lighthouse scope drift | No mention of Lighthouse anywhere in the plan |

### Issues Carried Open (not yet resolved)
(none — all opened issues addressed via autofix in this round)
