---
Type: Critique-History
Feature-Slug: startup-loop-security-audit
Stage: lp-do-fact-find
---

# Critique History — startup-loop-security-audit (fact-find)

## Round 1

**Route**: codemoot (gpt-5.4, session Q1qNA84X, thread 019ce23b)
**Score**: 6/10 → lp_score 3.0/5.0
**Verdict**: needs_revision
**Raw output**: `critique-raw-output.json`

### Findings

| Severity | Finding | Resolution |
|---|---|---|
| Critical | No S9B gate family in `cmd-advance` — GATE-LAUNCH-SEC would be documented but not enforced by `/startup-loop advance` | Added TASK-04: create `cmd-advance/s9b-gates.md` and register in SKILL.md module routing table |
| Warning | CI scope under-scoped — loop-wide claim but only `brikette.yml` in tasks; `reusable-app.yml` is the shared layer for caryina + future apps | Updated TASK-05 to cover both `brikette.yml` and `reusable-app.yml` |
| Warning | Trigger mentions both `pnpm audit` and secret scanning missing from app-specific workflows, but secret scanning is already covered by `ci.yml` | Clarified: TruffleHog in `ci.yml` covers all relevant branches; only `pnpm audit` gap needs fixing |
| Warning | "Warn-on-fail initially" fallback contradicts hard-gate outcome | Removed: pnpm audit is hard-fail from day one; pre-existing CVEs must be remediated as part of this plan |
| Warning | "Secrets in deployed output" check hardcodes `out/` (static-export only); Caryina uses `.open-next/` (Worker) | Narrowed: domain check validates repo-level secrets only (`git ls-files`); build artifact scanning is CI's responsibility (TruffleHog) |

## Round 2

**Route**: codemoot (gpt-5.4, session Q1qNA84X resumed, thread 019ce23b)
**Score**: 7/10 → lp_score 3.5/5.0
**Verdict**: needs_revision

### Findings

| Severity | Finding | Resolution |
|---|---|---|
| Critical | TASK-04 said to register in SKILL.md but the actual advance loader is `modules/cmd-advance.md` (Module Loading Order + Gate and Dispatch Map) — GATE-LAUNCH-SEC still not consumed | Updated TASK-04 and dependency map to explicitly reference `modules/cmd-advance.md` as the actual loader |
| Warning | `ci.yml` explicitly excludes `apps/brikette/**` in `paths-ignore` — TruffleHog does NOT cover brikette-specific deploys | Corrected claim; updated TASK-05 to include TruffleHog step in `brikette.yml` |
| Warning | Scope signal still described old blast radius ("one new module, two file modifications") | Updated Scope Signal to accurate: 2 new modules, 4 file edits, 2 CI workflow additions |

## Round 3 (Final)

**Route**: codemoot (gpt-5.4, session Q1qNA84X resumed, thread 019ce23b)
**Score**: 8/10 → lp_score 4.0/5.0
**Verdict**: needs_revision (warnings only — no criticals)

### Findings

| Severity | Finding | Resolution |
|---|---|---|
| Warning | Goals section inconsistent: claimed TruffleHog covered by `ci.yml` on all branches, but CI section correctly stated brikette is excluded | Corrected Goals section to state TruffleHog gap exists for brikette; TASK-05 covers it |
| Warning | Check 6 mislabeled "Secrets in deployed output" but only checks repo-level files via `git ls-files` | Renamed to "Repository secrets exposure" |
| Warning | Remaining assumptions referenced TASK-04 for CI audit precondition; CI audit is TASK-05 | Fixed task reference: TASK-04 → TASK-05 |
| Warning | Analysis Readiness deliverable description stale (described old scope) | Updated to accurate: 2 new modules, 4 file edits, 2 CI workflow additions |

**Final verdict**: credible. Score 4.0/5.0.
**Critical count: 0.**
