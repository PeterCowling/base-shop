---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Data
Created: 2026-03-09
Last-updated: 2026-03-09
Topic-Slug: loop-assessment-intake-packet-static-not-updated-post-build
---

# Loop Assessment Intake Packet Static Not Updated Post-Build Briefing

## Executive Summary

The queued idea is valid. The assessment intake packet is only written or refreshed inside the ASSESSMENT-09 intake sync, and that sync only reacts to ASSESSMENT precursor drift. The post-build loop writes `results-review.user.md` and routes outcomes back to Layer A standing intelligence, but there is no corresponding post-build step for the intake packet or for assessment-container synthesis. This creates real drift: for HEAD, the intake packet still records `Nidilo` as an unconfirmed working name on 2026-02-20, while a later assessment decision on 2026-02-26 selects `Facilella`.

The scope is slightly narrower than the queue text implies. Some downstream assessment-era documents are intentionally live and are not meant to be re-seeded from the intake packet after first creation. The gap is therefore not "all assessment docs are static"; it is "the intake packet has no post-build refresh contract, and there is no defined balance-sheet synthesis step for later strategic decisions."

## Questions Answered

- Q1: Is the idea's core claim true? Yes.
- Q2: Where is intake refresh currently defined? Only in ASSESSMENT-09 intake sync.
- Q3: Does post-build have any formal write-back into assessment containers? No.
- Q4: Is every downstream assessment doc supposed to follow the intake packet forever? No; some are seed-once by design.

## High-Level Architecture

- Components:
  - `docs/business-os/startup-loop/specifications/loop-spec.yaml` - defines ASSESSMENT-09 as the intake write/refresh point and MEASURE-00 as seed-once from intake.
  - `.claude/skills/startup-loop/modules/assessment-intake-sync.md` - defines the only refresh mechanism for `assessment-intake-packet.user.md`.
  - `docs/business-os/startup-loop/contracts/loop-output-contracts.md` - defines the post-build artifacts and the formal Layer B to Layer A feedback path.
  - `.claude/skills/lp-do-build/SKILL.md` - operational post-build protocol; generates and refines `results-review.user.md` but does not update assessment artifacts.

## End-to-End Flow

### Primary flow

1. ASSESSMENT-09 is the canonical intake stage and its contract is to write or refresh `docs/business-os/startup-baselines/<BIZ>-<YYYY-MM-DD>assessment-intake-packet.user.md`.
   Evidence: `docs/business-os/startup-loop/specifications/loop-spec.yaml:304-318`
2. The intake sync module refreshes only when ASSESSMENT precursor dates change; it does not watch build outputs, results-review artifacts, or later assessment-stage decisions.
   Evidence: `.claude/skills/startup-loop/modules/assessment-intake-sync.md:1-21`
3. The post-build loop generates `build-record.user.md`, pre-fills and refines `results-review.user.md`, emits sidecars, and commits artifacts, but includes no step for re-running intake sync or updating assessment containers.
   Evidence: `.claude/skills/lp-do-build/SKILL.md:199-245`, `.claude/skills/lp-do-build/SKILL.md:294-294`
4. The formal loop-output contract defines `results-review.user.md` as the Layer B to Layer A handoff and scopes its consumers to standing-information refresh, not assessment refresh.
   Evidence: `docs/business-os/startup-loop/contracts/loop-output-contracts.md:19-21`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md:208-240`

### Alternate / edge flows

- The two-layer architecture explicitly shows `assessment-intake-packet.user.md` as a Layer A input into Layer B, while `results-review.user.md` writes back to Layer A standing updates. There is no separate arrow or rule for assessment-packet refresh after build.
  Evidence: `docs/business-os/startup-loop/specifications/two-layer-model.md:229-240`
- MEASURE-00 is intentionally seed-once from intake and then updated directly, so not every later strategy artifact should be driven by intake refresh.
  Evidence: `docs/business-os/startup-loop/specifications/loop-spec.yaml:480-488`

## Data & Contracts

- Source of truth for intake refresh:
  - `.claude/skills/startup-loop/modules/assessment-intake-sync.md:1-21`
- Source of truth for post-build write-back:
  - `docs/business-os/startup-loop/contracts/loop-output-contracts.md:208-240`
  - `docs/business-os/startup-loop/specifications/two-layer-model.md:250-262`
- Queue packet under review:
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json:2120-2150`

## Error Handling and Failure Modes

- Failure mode: strategic decisions can land after ASSESSMENT-09 without any mechanism that re-materializes the intake packet.
  - Concrete example: the HEAD intake packet still shows `Nidilo` and `unconfirmed` naming status on 2026-02-20.
    Evidence: `docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md:48-49`, `docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md:67-71`
  - Later, HEAD records `Facilella` as the selected brand name on 2026-02-26.
    Evidence: `docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md:14-23`
  - Product naming on the same date already assumes `Business-Name: Facilella`.
    Evidence: `docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-26-product-naming.user.md:1-11`, `docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-26-product-naming.user.md:20-24`

## Unknowns / Follow-ups

- Unknown: whether the right fix is intake regeneration, direct assessment-container write-back from `results-review`, or a new bounded post-build "balance sheet refresh" step.
  - How to verify: run `/lp-do-fact-find` on this queue item and compare all consumers of the intake packet against the later assessment artifacts they actually need.
- Unknown: which assessment-container classes should be refreshed automatically versus remaining live docs owned by later stages.
  - How to verify: audit consumers of `current-problem-framing.user.md`, `s1-readiness.user.md`, brand-profile, brand-identity, naming decisions, and product-naming artifacts before proposing a refresh policy.

## If You Later Want to Change This (Non-plan)

- Likely change points:
  - `.claude/skills/lp-do-build/SKILL.md`
  - `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
  - `docs/business-os/startup-loop/specifications/two-layer-model.md`
  - `.claude/skills/startup-loop/modules/assessment-intake-sync.md`
- Key risks:
  - Re-refreshing the intake packet may overwrite intentionally live downstream docs if the boundary between "seed-once" and "refreshable" artifacts is not made explicit.
  - Updating assessment containers on every build would create noise unless trigger rules are narrowed to strategy-relevant builds.
