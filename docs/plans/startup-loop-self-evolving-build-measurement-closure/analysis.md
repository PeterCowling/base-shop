---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: startup-loop-self-evolving-build-measurement-closure
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find
Related-Fact-Find: docs/plans/startup-loop-self-evolving-build-measurement-closure/fact-find.md
Related-Plan: docs/plans/startup-loop-self-evolving-build-measurement-closure/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Startup Loop Self-Evolving Build Measurement Closure Analysis

## Decision Frame
### Summary
The self-evolving stack already knows how to close a completed dispatch with verified measurement, but the build workflow still cannot hand that proof across in a canonical way. The decision is whether to solve that gap by pushing more arguments into queue completion, by introducing a new runtime subsystem, or by making build outputs carry a structured proof block that queue completion can read automatically.

### Goals
- Close the proof handoff seam without inventing a second build-output format.
- Keep queue completion usage stable for normal builds.
- Make malformed declared proof explicit rather than silently degrading to narrative-only closure.

### Non-goals
- Replacing the broader self-evolving evidence, evaluation, or promotion stack.
- Making proof mandatory for every build.
- Solving missing experiment hooks for containers that still declare `experiment_hook_contract: "none"`.

### Constraints & Assumptions
- Constraints:
  - Build completion must stay additive and backwards compatible for non-self-evolving builds.
  - Queue completion cannot require a dozen manual CLI flags in the normal path.
- Assumptions:
  - `build-record.user.md` is the correct canonical operator-facing completion artifact to carry proof metadata.
  - Automatic extraction from the adjacent build-record is safer than reproducing the proof payload on the command line.

## Inherited Outcome Contract
- **Why:** Finished self-improving work can already close with verified measurement in queue completion, but lp-do-build still has no canonical place to put that proof, so most completed self-evolving work matures without observed evidence and promotion keeps stalling.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Finished self-evolving builds can carry a canonical verified-measurement block in build-record.user.md, and queue-state completion automatically converts that block into verified self-evolving outcome closure.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-evolving-build-measurement-closure/fact-find.md`
- Key findings used:
  - `markDispatchesCompleted()` already accepts `selfEvolvingMeasurement` and writes verified observations plus lifecycle events.
  - The build-record template and output contract have no matching section for that payload.
  - The build completion skill always passes `--plan-path`, which can be used to locate the adjacent `build-record.user.md`.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Canonicality | Proof should live in one build artifact, not an extra side channel | High |
| Workflow friction | Build completion should not require manual proof flag assembly | High |
| Failure clarity | Declared proof must fail loudly when malformed | High |
| Backwards compatibility | Ordinary builds without proof must keep current behavior | High |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Add manual `startup-loop:queue-state-complete` CLI flags for every measurement field | Reuses existing runtime shape directly | Burdens every proof-bearing build with fragile manual argument assembly | High operator/agent error rate; no canonical build artifact | No |
| B | Add a canonical `## Self-Evolving Measurement` section to `build-record.user.md` and auto-extract it during queue completion | Keeps proof with the build record, preserves normal CLI shape, and aligns with existing build outputs | Requires parser hardening and documentation updates | Malformed declared proof must fail closed carefully | Yes |
| C | Build a new proving runtime before fixing build-output closure | Potentially richer long-term architecture | Leaves the immediate workflow proof seam broken and duplicates existing contracts | High scope; does not fix current build path | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | No UI work |
| UX / states | High operator burden | Low burden, artifact-first | Choose automatic extraction |
| Security / privacy | Neutral | Neutral | No new secrets surface |
| Logging / observability / audit | Weak; proof only on CLI invocation | Strong; proof stored in canonical build artifact and lifecycle writes | Build-record becomes audit seam |
| Testing / validation | CLI parser only | Parser plus build-record extraction tests | Add focused queue completion tests |
| Data / contracts | Duplicates runtime fields on CLI | Aligns build-record contract to existing runtime shape | Extend build-record contract |
| Performance / reliability | Neutral | Small file read and parse | Keep missing-section fail-open |
| Rollout / rollback | Harder to monitor misuse | Additive and revertable | Gate malformed declared proof only |

## Chosen Approach
- **Recommendation:** Option B.
- **Why this wins:** It closes the proof seam where build outputs already become canonical. Queue completion can continue to take the same arguments, but when a build-record declares verified self-evolving measurement the CLI can read it automatically and close the dispatch with real proof.
- **What it depends on:** A documented build-record section, deterministic parsing, and focused regression tests for valid and malformed declared proof.

### Rejected Approaches
- Option A — rejected because it creates a manual, non-canonical proof channel that is too easy to omit or corrupt.
- Option C — rejected because the repo already has verified-measurement closure contracts; the missing gap is workflow wiring, not foundational architecture.

### Open Questions (Operator Input Required)
- None.

## End-State Operating Model
| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Proof-bearing build completion | Build completion writes `build-record.user.md`, but verified proof has no canonical slot and queue completion usually closes with pending/missing measurement | A completed self-evolving build reaches the queue-state completion hook | 1. Build completion writes `## Self-Evolving Measurement` in `build-record.user.md` when verified proof exists. 2. `startup-loop:queue-state-complete` resolves the adjacent build-record from `--plan-path`. 3. Queue completion auto-extracts the proof block. 4. If the block is valid and `Status: verified`, queue completion writes verified observation and lifecycle outcome closure. 5. If the block is absent or `Status: none`, current pending/missing behavior remains. | Existing outcome contract, build-event emission, and ordinary non-self-evolving builds stay unchanged | Parser must fail closed only when a declared proof block is malformed |

## Planning Handoff
- Planning focus:
  - Extend the build-record contract and template with a canonical self-evolving measurement section.
  - Teach queue completion to read and validate that section automatically from the adjacent build-record.
  - Update build workflow guidance so the section is filled when a build closes a verified self-evolving measurement.
- Validation implications:
  - Add queue completion regression tests for valid auto-extracted proof and malformed declared proof.
  - Run targeted TypeScript and eslint validation on the touched scripts files.
- Sequencing constraints:
  - Contract/template and parser should land together so documentation and runtime stay aligned.
- Risks to carry into planning:
  - Overly strict parsing could block unrelated builds if the optional section rules are not bounded carefully.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Malformed declared proof blocks stop queue completion unexpectedly | Medium | High | Needs implementation detail in parser behavior | Add focused failure-path tests and clear skill guidance |
| Non-proof builds regress if the parser treats missing sections as errors | Low | High | Requires code changes to prove | Keep missing section fail-open explicitly |
| The first proof-bearing builds still lack experiment hooks | Medium | Medium | Outside this seam | Keep later task focused on container/report follow-through, not current closure bridge |

## Planning Readiness
- Status: Go
- Rationale: The chosen approach is narrow, additive, and directly aligned with the existing proof-closure contract already present in queue completion.
