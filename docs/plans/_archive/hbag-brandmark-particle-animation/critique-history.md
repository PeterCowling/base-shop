---
Type: Reference
Status: Active
Domain: Repo
Last-reviewed: 2026-02-23
---

# Critique History: hbag-brandmark-particle-animation

## Round 1 -- 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Data & Contracts | Prop count stated as 7 but actual count is 9 |
| 1-02 | Moderate | Planning Readiness | Ready-for-planning status without explicit conditional note for sub-80% confidence dimensions |
| 1-03 | Moderate | Approach A performance claim | Mobile performance stated as fact ("well within budget even on mobile") without primary evidence |
| 1-04 | Moderate | Frontmatter Card-ID | Card-ID: none with Business-OS-Integration: on (process gap for direct-inject, not blocking) |
| 1-05 | Minor | Non-goals vs task seeds | Tension between "No API changes" non-goal and need for particle-specific timing controls |
| 1-06 | Minor | External Research bundle sizes | opentype.js and tsparticles-slim sizes are estimates, not verified from authoritative source |

### Issues Confirmed Resolved This Round
(none -- first round)

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Moderate | 1 | Card-ID: none -- deferred for direct-inject cycle |
| 1-05 | Minor | 1 | API change tension -- to be resolved during /lp-do-plan |
| 1-06 | Minor | 1 | Bundle size estimates -- acceptable for rejection rationale |

### Autofix Summary
- 1-01: Fixed (prop count corrected to 9)
- 1-02: Fixed (conditional readiness note added to Planning Readiness)
- 1-03: Fixed (mobile performance qualified with H1 validation requirement)
- 1-04: Not autofixed (process gap, requires BOS card creation workflow)
- 1-05: Not autofixed (design decision for /lp-do-plan phase)
- 1-06: Not autofixed (acceptable as estimates for rejection rationale)

Additional fixes applied:
- Canvas font rendering risk added to Risks table
- Canvas resize handling risk added to Risks table
- Canvas resize note added to Recommended Architecture
- Two new assumptions added to Remaining Assumptions (ctx.font resolution, canvas resize tracking)

## Round 2 -- 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Frontmatter | Contract drift: `Status` and `Outcome` were non-canonical for loop consumers; `artifact: fact-find` missing |
| 2-02 | Moderate | Frontmatter / Execution Routing Packet | Nonexistent supporting skill ID (`create-ui-component`) referenced |
| 2-03 | Major | Planning Readiness | Ready-for-planning call conflicted with unvalidated load-bearing assumptions and sub-80 delivery/testability |
| 2-04 | Moderate | External Research / Signal Coverage | Performance benchmark presented as established without primary repo/device evidence |
| 2-05 | Minor | External Research | Precise dependency size claims given without authoritative source attribution |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-04 | Moderate | `Card-ID: none` with BOS integration on | Set `Business-OS-Integration: off` for this direct-inject cycle; added explicit BOS decision gate in Planning Readiness |
| 1-05 | Minor | Non-goal/API tension | Clarified timing control uses existing `durationMs` contract without changing `BrandMarkProps` shape |
| 1-06 | Minor | Unverified bundle-size estimates | Replaced precise size estimates with qualitative overhead statements |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| none | none | 0 | None |

### Autofix Summary
- 2-01: Fixed (frontmatter canonicalized; `artifact: fact-find` added)
- 2-02: Fixed (`Supporting-Skills` normalized to `none`; execution routing packet aligned)
- 2-03: Fixed (`Planning Readiness` changed to `Needs-input` with explicit unblock path)
- 2-04: Fixed (H1 evidence downgraded to low-confidence hypothesis pending prototype data)
- 2-05: Fixed (removed unsourced precise bundle-size figures)

Additional fixes applied:
- Removed orphaned stale claims (`5000+ particles` assertion and stale skill reference)
- Added explicit BOS-tracking decision checkpoint before moving to planning

## Round 3 -- 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Hypothesis evidence + readiness gate | H1-H3 remained blocking without executable prototype evidence and metrics artifacts |
| 3-02 | Major | Test landscape / confidence | Test-harness decision was unresolved and delivery readiness stayed below threshold |
| 3-03 | Moderate | BOS routing decision | BOS integration state needed an explicit decision log for downstream planning clarity |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | Missing executable prototype evidence | Added prototype + benchmark runner + results + screenshots and updated hypothesis coverage/readiness |
| 3-02 | Major | Missing test-harness decision | Added `apps/caryina/jest.config.cjs`, test script, and passing BrandMark baseline test seam |
| 3-03 | Moderate | BOS routing ambiguity | Recorded explicit direct-inject BOS decision in fact-find + decision log artifact |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| none | none | 0 | None |

### Autofix Summary
- 3-01: Fixed (prototype evidence integrated; readiness moved to `Ready-for-planning`)
- 3-02: Fixed (harness decision implemented and validated)
- 3-03: Fixed (BOS decision documented with revisit trigger)

Additional fixes applied:
- Updated stale test-landscape statements to reflect new Jest/test artifacts
- Added artifact-level decision trace at `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/decision-log.md`
